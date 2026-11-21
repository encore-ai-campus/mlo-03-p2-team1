"""03 Silver Parquet에서 04 Gold 스타 스키마와 검증 기록을 만든다."""

from __future__ import annotations

import argparse
import sys
from contextlib import ExitStack, contextmanager, nullcontext
from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZipFile

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.parquet as pq

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.files import replace_if_changed
from common.paths import DATA_DIR, METADATA_DIR, REPORT_DIR, SILVER_DIR, relative, stage_file_name
from common.report import md_table, write_csv, write_markdown
from silver.cln_rules import LICENSE_DATASETS, TRADE_SAME_DEAL_KEY

GOLD_DIR = DATA_DIR / "gold"
GOLD_REPORT_DIR = REPORT_DIR / "gold"
REGION_COLUMNS = [
    "LDONG_CD", "LDONG_NM", "SIDO_CD", "SIDO_NM", "SGG_CD", "SGG_NM", "UMD_NM",
]
TRADE_COLUMNS = [
    *TRADE_SAME_DEAL_KEY, "SGG_CD", "LDONG_SRC_CD", "CNCL_YN", "SAME_DEAL_YN",
    "SRC_FILE_NM", "SRC_ROW_NUM", "APT_NM", "BUILD_YEAR_NUM",
]
TRADE_SOURCE_KEY = ["SRC_FILE_NM", "SRC_ROW_NUM"]
TRADE_FACT_COLUMNS = [
    *TRADE_SOURCE_KEY, "LDONG_CD", "YQ", "DEAL_DTM", "APT_KEY", "APT_NM", "BUILD_YEAR_NUM",
    "EXCL_AREA_NUM", "FLR_NUM", "DEAL_AMT_NUM", "UNIT_AMT", "LDONG_SRC_CD", "SAME_DEAL_YN",
]
LICENSE_COLUMNS = [
    "LCNS_KEY", "LDONG_CD", "LDONG_SRC_CD", "LGOV_CD", "ANLS_INDUTY_CD",
    "ANLS_LCNS_DTM", "ANLS_CLSBIZ_DTM", "CLSBIZ_SRC_CD", "OUT_SCOPE_YN",
    "ABNRM_LCNS_DTM_YN", "OUT_SEOUL_ADDR_YN",
]
INPUT_COLUMNS = {
    "ldong_code": [*REGION_COLUMNS, "ABL_YN", "LDONG_SE_CD"],
    "apt_trade": TRADE_COLUMNS,
    **dict.fromkeys(LICENSE_DATASETS, LICENSE_COLUMNS),
}
REGION_PERIOD = ["LDONG_CD", "YQ"]
LICENSE_KEY = [*REGION_PERIOD, "ANLS_INDUTY_CD"]
LICENSE_COUNTS = ["OPEN_CNT", "CLOSE_CNT", "ACTIVE_CNT", "PROXY_CLOSE_CNT"]
TABLE_KEYS = {
    "dim_region": ["LDONG_CD"],
    "dim_date": ["YQ"],
    "dim_lcns_induty": ["ANLS_INDUTY_CD"],
    "fact_apt_trd": TRADE_SOURCE_KEY,
    "fact_apt_trd_qtr": REGION_PERIOD,
    "fact_lcns_qtr": LICENSE_KEY,
    "mart_ldong_infra_qtr": REGION_PERIOD,
}
MART_INDUSTRIES = {
    "GENERAL_FOOD": ("일반음식점",),
    "CAFE": ("카페",),
    "CLINIC": ("의원", "치과의원", "한의원"),
    "PHARMACY": ("약국",),
    "BEAUTY": ("미용_헤어", "미용_피부", "미용_네일", "미용_메이크업", "미용_기타"),
    "CONVENIENCE": ("편의점",),
}


def record(log, dataset, metric, before, after, *, period="", note=""):
    log.append({
        "dataset": dataset, "metric": metric, "period": period,
        "before_count": int(before), "after_count": int(after),
        "delta": int(after) - int(before), "note": note,
    })


def load_rules():
    params = pd.read_csv(METADATA_DIR / "cln_param.csv", dtype=str, keep_default_na=False)
    common = params.loc[params["dataset"].eq("*")].set_index("param")["value"]
    start, end = pd.Timestamp(common["ANLS_BGN_DT"]), pd.Timestamp(common["ANLS_END_DT"])
    periods = pd.period_range(start, end, freq="Q")
    if periods.empty or start != periods[0].start_time or end != periods[-1].end_time.normalize():
        raise ValueError("분석 기간은 분기 시작일과 종료일에 맞춰야 합니다.")
    collected = params.loc[params["param"].eq("COLLECT_DT")].set_index("dataset")["value"]
    if pd.to_datetime(collected.loc[LICENSE_DATASETS]).le(end).any():
        raise ValueError("분석 종료일은 모든 인허가 수집일보다 앞서야 합니다.")
    prefix = params.loc[params["param"].eq("SEOUL_SGG_PREFIX"), "value"].item()

    flags = pd.read_csv(METADATA_DIR / "cln_flag.csv", dtype=str).set_index("flag")
    expected = {
        ("CNCL_YN", "price_deal_trt"): "제외",
        ("SAME_DEAL_YN", "price_deal_trt"): "묶음당1건",
    }
    for column in ("stock_trt", "open_cnt_trt", "close_cnt_trt"):
        expected["OUT_SCOPE_YN", column] = "제외"
        expected["OUT_SEOUL_ADDR_YN", column] = "동제외_구포함"
        expected["ABNRM_LCNS_DTM_YN", column] = "제외" if column == "open_cnt_trt" else "포함"
    for (flag, metric), treatment in expected.items():
        if flags.loc[flag, metric] != treatment:
            raise ValueError(f"지원하지 않는 Gold 플래그 처리: {flag}/{metric}")

    codes = pd.read_csv(METADATA_DIR / "cln_code_value.csv", dtype=str, keep_default_na=False)
    groups = codes.loc[codes["code_column"].eq("ANLS_INDUTY_CD"), "code_value"]
    industries = pd.DataFrame({"ANLS_INDUTY_CD": groups[groups.ne("대상외")].tolist()})
    industries["ANLS_INDUTY_NM"] = industries["ANLS_INDUTY_CD"]
    industries["REFERENCE_YN"] = industries["ANLS_INDUTY_CD"].isin(["편의점", "기타"])
    used_industries = {code for group in MART_INDUSTRIES.values() for code in group}
    if not used_industries.issubset(industries["ANLS_INDUTY_CD"]):
        raise ValueError("마트 업종 코드가 인허가 코드표에 없습니다.")
    proxy_codes = codes.loc[
        codes["code_column"].eq("CLSBIZ_SRC_CD") & codes["code_value"].str.startswith("최종수정일자_"),
        "code_value",
    ]
    gu_map = pd.read_csv(METADATA_DIR / "cln_lgov_sgg_map.csv", dtype=str).set_index("LGOV_CD")["SGG_CD"]
    if not gu_map.index.is_unique or gu_map.isna().any():
        raise ValueError("인허가 관청과 자치구 코드의 대응이 유일하지 않거나 비어 있습니다.")
    return periods, prefix, industries, proxy_codes, gu_map


def silver_path(dataset):
    return f"{dataset}/{stage_file_name('03', dataset)}"


def read_silver(dataset, archive, log):
    path = silver_path(dataset)
    source = SILVER_DIR / path if archive is None else pa.BufferReader(archive.read(f"silver/{path}"))
    with pq.ParquetFile(source) as parquet:
        columns = INPUT_COLUMNS[dataset]
        missing = sorted(set(columns) - set(parquet.schema_arrow.names))
        if missing:
            raise ValueError(f"{path}에 필요한 컬럼이 없습니다: {', '.join(missing)}")
        table = parquet.read(columns=columns)
        record(
            log, dataset, "SELECT_COLUMNS", len(parquet.schema_arrow.names), len(columns),
            note="컬럼 수. 나머지 단계의 건수는 행 또는 집계 지표 수.",
        )
    return table


def build_region(table, prefix, log):
    source = table.to_pandas()
    eligible = source["SIDO_CD"].eq(prefix) & source["ABL_YN"].eq(False)
    result = source.loc[eligible & source["LDONG_SE_CD"].eq("읍면동"), REGION_COLUMNS]
    record(log, "ldong_code", "SEOUL_CURRENT_DONG", len(source), len(result))
    if result.empty:
        raise ValueError("서울 현행 법정동이 없습니다.")
    return result.sort_values("LDONG_CD").reset_index(drop=True)


def build_dates(periods):
    return pd.DataFrame({
        "YQ": periods.astype(str),
        "YR": periods.year.astype("int16"),
        "QTR": periods.quarter.astype("int8"),
        "QTR_BGN_DT": periods.start_time.date,
        "QTR_END_DT": periods.end_time.date,
        "PROVISIONAL_YN": periods.year == periods[-1].year,
    })


def dong_is_valid(rows, region_codes):
    return rows["LDONG_CD"].isin(region_codes) & ~rows["LDONG_SRC_CD"].str.startswith("실패", na=False)


def prepare_trades(table, prefix, periods, region_codes, log):
    seoul = table.filter(pc.starts_with(table["SGG_CD"], prefix)).to_pandas()
    record(log, "apt_trade", "SEOUL_FILTER", table.num_rows, len(seoul))
    start, end = periods[0].start_time.date(), periods[-1].end_time.date()
    in_period = seoul.loc[seoul["DEAL_DTM"].between(start, end)]
    record(log, "apt_trade", "ANALYSIS_PERIOD", len(seoul), len(in_period))
    live = in_period.loc[~in_period["CNCL_YN"].eq(True)]
    record(log, "apt_trade", "G1_CANCELLED", len(in_period), len(live))

    flagged = live.loc[live["SAME_DEAL_YN"].eq(True)]
    ordered = flagged.sort_values(["SRC_FILE_NM", "SRC_ROW_NUM"], kind="stable")
    duplicates = ordered.index[ordered.duplicated(TRADE_SAME_DEAL_KEY)]
    unique = live.drop(index=duplicates)
    record(log, "apt_trade", "G2_SAME_DEAL", len(live), len(unique))
    valid = unique.loc[dong_is_valid(unique, region_codes)].copy()
    record(log, "apt_trade", "DONG_MATCH", len(unique), len(valid))

    area = valid["EXCL_AREA_NUM"]
    amount = valid["DEAL_AMT_NUM"]
    usable_price = np.isfinite(area) & area.gt(0) & amount.notna()
    record(
        log, "apt_trade", "UNIT_PRICE_AVAILABLE", len(valid), usable_price.sum(),
        note="면적이 없거나 0 이하이거나 금액이 없으면 중앙값에서만 제외.",
    )
    valid["UNIT_AMT"] = amount.where(usable_price) / area.where(usable_price)
    valid["YQ"] = pd.PeriodIndex(valid["DEAL_DTM"], freq="Q").astype(str)
    return valid


def build_trade_detail(eligible_trades):
    detail = eligible_trades.loc[:, TRADE_FACT_COLUMNS].sort_values(TRADE_SOURCE_KEY, ignore_index=True)
    detail["DEAL_DTM"] = detail["DEAL_DTM"].astype(pd.ArrowDtype(pa.date32()))
    return detail


def aggregate_trades(trades, grid, log):
    grouped = trades.groupby(REGION_PERIOD).agg(
        TRADE_CNT=("UNIT_AMT", "size"),
        PRICE_SAMPLE_CNT=("UNIT_AMT", "count"),
        UNIT_AMT_MEDIAN=("UNIT_AMT", "median"),
    )
    fact = grouped.reindex(grid)
    for column in ("TRADE_CNT", "PRICE_SAMPLE_CNT"):
        fact[column] = fact[column].fillna(0).astype("int64")
    empty = fact["TRADE_CNT"].eq(0).sum()
    record(log, "apt_trade", "TRADE_AGGREGATION", len(trades), len(grouped))
    record(log, "fact_apt_trd_qtr", "DENSE_GRID", len(grouped), len(fact), note=f"무거래 셀 {empty}개.")
    if fact["TRADE_CNT"].sum() != len(trades) or fact["PRICE_SAMPLE_CNT"].sum() != trades["UNIT_AMT"].count():
        raise ValueError("매매 팩트의 거래 수 또는 가격 표본 수가 Silver 선별 건수와 다릅니다.")
    record(log, "fact_apt_trd_qtr", "TRADE_COUNT_CHECK", len(trades), fact["TRADE_CNT"].sum())
    return fact.reset_index()


def prepare_licenses(table, dataset, region_codes, industry_codes, gu_map, log):
    rows = table.to_pandas()
    if rows["LCNS_KEY"].isna().any() or rows["LCNS_KEY"].duplicated().any():
        raise ValueError(f"{dataset}: LCNS_KEY가 비어 있거나 중복됩니다.")
    scoped = rows.loc[~rows["OUT_SCOPE_YN"].eq(True)].copy()
    record(log, dataset, "OUT_SCOPE", len(rows), len(scoped))
    unknown = ~scoped["ANLS_INDUTY_CD"].isin(industry_codes)
    if unknown.any():
        raise ValueError(f"{dataset}: 범위 내 업소에 알 수 없는 분석 업종 {unknown.sum()}건이 있습니다.")

    scoped["DONG_OK"] = dong_is_valid(scoped, region_codes) & ~scoped["OUT_SEOUL_ADDR_YN"].eq(True)
    scoped["GU_CD"] = scoped["LGOV_CD"].map(gu_map)
    if scoped["GU_CD"].isna().any():
        raise ValueError(f"{dataset}: 유효한 구 코드에 연결되지 않은 인허가 관청이 있습니다.")
    record(log, dataset, "DONG_MATCH", len(scoped), scoped["DONG_OK"].sum())
    matched = scoped.loc[scoped["DONG_OK"]]
    same_gu = matched["LDONG_CD"].str[:5].eq(matched["GU_CD"]).sum()
    record(log, dataset, "DONG_GU_CODE_MATCH", len(matched), same_gu,
           note="주소 법정동의 자치구와 인허가 관청의 자치구를 비교.")
    return scoped


def count_events(rows, dates, include, quarters, quarter_ends):
    events = rows.loc[include, ["LDONG_CD", "ANLS_INDUTY_CD"]].copy()
    events["YQ"] = quarters[np.searchsorted(quarter_ends, dates[include])]
    return events.groupby(LICENSE_KEY).size()


def aggregate_license_source(rows, periods, proxy_codes):
    """구간의 시작·종료 분기에만 증감을 기록하고 영업 수를 누적한다."""
    quarter_ends = periods.end_time.to_numpy(dtype="datetime64[D]")
    quarters = periods.astype(str).to_numpy()
    start = periods.start_time.to_numpy(dtype="datetime64[D]")[0]
    opened = rows["ANLS_LCNS_DTM"].to_numpy(dtype="datetime64[D]")
    closed = rows["ANLS_CLSBIZ_DTM"].to_numpy(dtype="datetime64[D]")
    dong = rows["DONG_OK"].to_numpy()
    abnormal = rows["ABNRM_LCNS_DTM_YN"].eq(True).to_numpy()
    proxy = rows["CLSBIZ_SRC_CD"].isin(proxy_codes).to_numpy()
    open_event = (opened >= start) & (opened <= quarter_ends[-1]) & ~abnormal
    close_event = (closed >= start) & (closed <= quarter_ends[-1])

    first = np.searchsorted(quarter_ends, opened)
    last = np.searchsorted(quarter_ends, closed)
    has_stock = dong & (first < last)
    next_qtr = np.append(quarters, "")
    changes = rows.loc[has_stock, ["LDONG_CD", "ANLS_INDUTY_CD"]].copy()
    starts = changes.assign(YQ=next_qtr[first[has_stock]]).groupby(LICENSE_KEY).size()
    ends = changes.assign(YQ=next_qtr[last[has_stock]]).groupby(LICENSE_KEY).size()
    return {
        "OPEN_CNT": count_events(rows, opened, dong & open_event, quarters, quarter_ends),
        "CLOSE_CNT": count_events(rows, closed, dong & close_event, quarters, quarter_ends),
        "ACTIVE_CHANGE": starts.subtract(ends, fill_value=0).astype("int64"),
        "PROXY_CLOSE_CNT": count_events(rows, closed, dong & close_event & proxy, quarters, quarter_ends),
    }


def audit_license_source(log, dataset, rows, periods, counts):
    opened = rows["ANLS_LCNS_DTM"].to_numpy(dtype="datetime64[D]")
    closed = rows["ANLS_CLSBIZ_DTM"].to_numpy(dtype="datetime64[D]")
    dong = rows["DONG_OK"].to_numpy()
    quarters = periods.astype(str)
    actual = counts["ACTIVE_CHANGE"].groupby(level="YQ").sum().reindex(quarters, fill_value=0).cumsum()
    actual_open = counts["OPEN_CNT"].groupby(level="YQ").sum().reindex(quarters, fill_value=0)
    actual_close = counts["CLOSE_CNT"].groupby(level="YQ").sum().reindex(quarters, fill_value=0)
    normal_open = ~rows["ABNRM_LCNS_DTM_YN"].eq(True).to_numpy()
    for period in periods:
        yq = str(period)
        start = period.start_time.to_datetime64().astype("datetime64[D]")
        end = period.end_time.to_datetime64().astype("datetime64[D]")
        active = (opened <= end) & (np.isnat(closed) | (closed > end))
        open_in_quarter = dong & normal_open & (opened >= start) & (opened <= end)
        close_in_quarter = dong & (closed >= start) & (closed <= end)
        dong_count = (active & dong).sum()
        gu_count = active.sum()
        failed_dong_count = (active & ~dong).sum()
        if gu_count != dong_count + failed_dong_count or dong_count != actual[yq]:
            raise ValueError(f"{dataset}: {yq} 영업 수의 동·구 대조가 일치하지 않습니다.")
        if open_in_quarter.sum() != actual_open[yq] or close_in_quarter.sum() != actual_close[yq]:
            raise ValueError(f"{dataset}: {yq} 개업·폐업 수가 Silver 선별 건수와 다릅니다.")
        record(log, dataset, "ACTIVE_GU_TO_DONG", gu_count, dong_count, period=yq,
               note="구 합계에서 동 매칭 실패 재고를 빼면 동 합계.")
        record(log, dataset, "ACTIVE_DIRECT_CHECK", dong_count, actual[yq], period=yq)
        record(log, dataset, "OPEN_DIRECT_CHECK", open_in_quarter.sum(), actual_open[yq], period=yq)
        record(log, dataset, "CLOSE_DIRECT_CHECK", close_in_quarter.sum(), actual_close[yq], period=yq)
    for metric in ("OPEN_CNT", "CLOSE_CNT", "PROXY_CLOSE_CNT"):
        record(log, dataset, metric, len(rows), counts[metric].sum(),
               note="기간 전체의 동 집계 건수.")


def build_license_fact(parts, regions, dates, industries, log):
    grid = pd.MultiIndex.from_product(
        [regions["LDONG_CD"], dates["YQ"], industries["ANLS_INDUTY_CD"]], names=LICENSE_KEY,
    )
    fact = pd.DataFrame(index=grid)
    for column in ("OPEN_CNT", "CLOSE_CNT", "ACTIVE_CHANGE", "PROXY_CLOSE_CNT"):
        combined = pd.concat([part[column] for part in parts]).groupby(level=LICENSE_KEY).sum()
        fact[column] = combined.reindex(grid, fill_value=0).astype("int64")
    changes = fact.pop("ACTIVE_CHANGE")
    fact["ACTIVE_CNT"] = changes.groupby(level=["LDONG_CD", "ANLS_INDUTY_CD"]).cumsum()
    fact["NET_CNT"] = fact["OPEN_CNT"] - fact["CLOSE_CNT"]
    if (fact["ACTIVE_CNT"] < 0).any():
        raise ValueError("분기 말 영업 수에 음수가 있습니다.")
    for column in ("OPEN_CNT", "CLOSE_CNT", "PROXY_CLOSE_CNT"):
        expected = sum(part[column].sum() for part in parts)
        actual = fact[column].sum()
        if actual != expected:
            raise ValueError(f"인허가 팩트의 {column}이 원천별 집계의 합과 다릅니다.")
        record(log, "fact_lcns_qtr", "SOURCE_TOTAL_CHECK", expected, actual, note=column)
    observed = fact[LICENSE_COUNTS].ne(0).any(axis=1).sum()
    record(log, "fact_lcns_qtr", "DENSE_GRID", observed, len(fact), note="미관측 조합에 건수 0을 생성.")
    return fact.reset_index()


def build_mart(trades, licenses, regions, dates):
    mart = trades.merge(regions[["LDONG_CD", "LDONG_NM", "SGG_CD", "SGG_NM"]], on="LDONG_CD", validate="m:1")
    mart = mart.merge(dates[["YQ", "PROVISIONAL_YN"]], on="YQ", validate="m:1")
    wide = licenses.set_index(LICENSE_KEY)[LICENSE_COUNTS].unstack("ANLS_INDUTY_CD")
    metrics = {}
    for name, codes in MART_INDUSTRIES.items():
        for count in LICENSE_COUNTS:
            metrics[f"{name}_{count}"] = wide[count][list(codes)].sum(axis=1)
    return mart.merge(pd.DataFrame(metrics).reset_index(), on=REGION_PERIOD, validate="1:1")


def validate_tables(tables, log):
    for name, keys in TABLE_KEYS.items():
        table = tables[name]
        if table[keys].isna().any().any() or table.duplicated(keys).any():
            raise ValueError(f"{name}: 키의 결측 또는 중복이 있습니다.")
        record(log, name, "KEY_UNIQUENESS", len(table), len(table))
    dimensions = {"LDONG_CD": "dim_region", "YQ": "dim_date", "ANLS_INDUTY_CD": "dim_lcns_induty"}
    foreign_keys = {
        "fact_apt_trd": REGION_PERIOD,
        "fact_apt_trd_qtr": REGION_PERIOD,
        "fact_lcns_qtr": LICENSE_KEY,
        "mart_ldong_infra_qtr": REGION_PERIOD,
    }
    for name, keys in foreign_keys.items():
        for key in keys:
            table = tables[name]
            matched = table[key].isin(tables[dimensions[key]][key]).sum()
            if matched != len(table):
                raise ValueError(f"{name}: {key} 차원 연결이 누락됐습니다.")
            record(log, name, "DIMENSION_MATCH", len(table), matched, note=key)

    trades, licenses, mart = (tables[name] for name in ("fact_apt_trd_qtr", "fact_lcns_qtr", "mart_ldong_infra_qtr"))
    if trades["TRADE_CNT"].sum() != len(tables["fact_apt_trd"]):
        raise ValueError("매매 분기 팩트의 총 거래 수가 상세 팩트의 행 수와 다릅니다.")
    size = len(tables["dim_region"]) * len(tables["dim_date"])
    if len(trades) != size or len(mart) != size or len(licenses) != size * len(tables["dim_lcns_induty"]):
        raise ValueError("차원 조합 수와 팩트·마트 행 수가 다릅니다.")
    trade_counts = trades.set_index(REGION_PERIOD)["TRADE_CNT"]
    mart_counts = mart.set_index(REGION_PERIOD)["TRADE_CNT"].reindex(trade_counts.index)
    if not trade_counts.equals(mart_counts):
        raise ValueError("마트를 조인하면서 매매 건수가 바뀌었습니다.")


@contextmanager
def publish_lock():
    """완성된 결과를 동시에 여러 실행이 교체하지 않게 한다."""
    with (GOLD_DIR / ".publish.lock").open("a+b") as lock:
        lock.seek(0)
        if sys.platform == "win32":
            import msvcrt

            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl

            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


def staged_file(target, cleanup):
    # Windows에서 최종 폴더에 직접 만들면 그 폴더의 ACL을 상속한다.
    with NamedTemporaryFile(
        dir=target.parent, prefix=f".{target.name}.", suffix=".tmp", delete=False,
    ) as stream:
        path = Path(stream.name)
    cleanup.callback(path.unlink, missing_ok=True)
    return path


def write_results(tables, log, input_label):
    GOLD_DIR.mkdir(parents=True, exist_ok=True)
    GOLD_REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with ExitStack() as cleanup:
        outputs = []
        for name, frame in tables.items():
            target = GOLD_DIR / stage_file_name("04", name)
            temp = staged_file(target, cleanup)
            written = pa.Table.from_pandas(frame, preserve_index=False)
            pq.write_table(written, temp, compression="snappy")
            outputs.append((name, temp, target, len(frame), len(frame.columns)))
        change_log = pd.DataFrame(log)
        change_target = GOLD_REPORT_DIR / stage_file_name("04", "change_log", ext="csv")
        md_target = GOLD_REPORT_DIR / stage_file_name("04", "work_summary", ext="md")
        manifest_target = GOLD_REPORT_DIR / stage_file_name("04", "manifest", ext="csv")
        change_temp = staged_file(change_target, cleanup)
        md_temp = staged_file(md_target, cleanup)
        manifest_temp = staged_file(manifest_target, cleanup)
        write_csv(change_temp, change_log)
        write_markdown(md_temp, report_lines(tables, change_log, input_label))

        with publish_lock():
            manifest = []
            for name, temp, target, rows, columns in outputs:
                status, digest = replace_if_changed(temp, target)
                manifest.append({
                    "dataset": name, "file": relative(target), "rows": rows, "columns": columns,
                    "sha256": digest, "status": status,
                })
            write_csv(manifest_temp, pd.DataFrame(manifest))
            replace_if_changed(change_temp, change_target)
            replace_if_changed(md_temp, md_target)
            replace_if_changed(manifest_temp, manifest_target)
    return manifest


def report_lines(tables, log, input_label):
    dates = tables["dim_date"]
    last_quarter = dates["YQ"].iloc[-1]
    stock = log.loc[log["metric"].eq("ACTIVE_GU_TO_DONG") & log["period"].eq(last_quarter)].copy()
    stock["법정동 실패"] = -stock["delta"]
    stock = stock[["dataset", "before_count", "after_count", "법정동 실패"]]
    stock.columns = ["원천", "구 합계", "동 합계", "법정동 실패"]
    table_list = pd.DataFrame(
        [(name, " × ".join(TABLE_KEYS[name]), len(frame)) for name, frame in tables.items()],
        columns=["Gold 테이블", "한 행의 키", "행 수"],
    )
    trade_steps = log.loc[log["dataset"].eq("apt_trade") & log["metric"].ne("SELECT_COLUMNS")]
    trade_steps = trade_steps[["metric", "before_count", "after_count", "delta"]]
    trade_steps.columns = ["처리", "이전", "이후", "차이"]
    return [
        "# Gold 스타 스키마 작업 기록", "",
        f"- Silver 입력은 `{input_label}`의 03 산출물 7개입니다.",
        f"- 분석 기간은 {dates['YQ'].iloc[0]}~{last_quarter}입니다. 마지막 연도는 잠정으로 표시했습니다.",
        "- 분기 가격과 인허가 지표를 서울 법정동별로 비교할 수 있도록 구성했습니다.", "",
        "## 팩트와 차원", "",
        *md_table(table_list), "",
        "- 지역 차원은 서울 현행 읍면동 코드와 상위 자치구를 담습니다. 날짜 차원은 분기 시작·종료일을, 업종 차원은 Silver 분석 업종과 참고 지표 여부를 담습니다.",
        f"- `HAS_OBSERVED_TRADE_YN`은 분석 기간 중 유효 매매가 1건 이상 관측된 동을 표시합니다. 유효 매매가 관측되지 않은 동은 {(~tables['dim_region']['HAS_OBSERVED_TRADE_YN']).sum():,}개입니다. 아파트 존재 여부는 별도 자료로 확인합니다.",
        "- 매매 상세 팩트는 유효 매매 1건당 한 행입니다. 계약일과 분기, 단지, 면적, 가격을 보존하고 원천 파일명과 행 번호를 키로 씁니다. 분기 키는 기존 분기 날짜 차원에 연결합니다.",
        "- 매매 분기 팩트는 상세 팩트에서 계산한 거래 수·가격 표본 수·㎡당 매매가 중앙값을 저장합니다. 인허가 분기 팩트에는 개업·폐업·분기 말 영업·순증·대용 폐업일 건수를 저장합니다.",
        "- 인허가 코드는 원천 구분과 관계없이 같은 분석 업종으로 합산하고, 원천별 대조값은 CSV에 보존합니다. 마트에서는 의원 계열과 미용 세부 업종을 각각 묶고 편의점은 참고 지표로 표시합니다.",
        "- 분기·업종 조합은 모두 생성했습니다. 거래가 없으면 거래 건수는 0, 가격은 NULL입니다. 결과표의 인허가 건수는 0으로 표현합니다.", "",
        "## Silver에서 Gold로 바뀐 내용", "",
        "### 매매", "",
        "서울·계약 기간을 선별한 뒤 G1 계약 해제를 제외하고, G2 동일 조건 거래는 원천 파일명·행 번호 순서의 첫 행을 남겼습니다. 동 매칭 실패는 동 집계에서 제외했습니다. 가격 중앙값은 유효한 거래별 거래금액(원)을 전용면적(㎡)으로 나눈 값에서 산출했습니다.", "",
        *md_table(trade_steps), "",
        "마지막 행은 개별 거래를 법정동·분기별로 묶은 결과입니다. 원래 거래 수의 합계는 팩트의 TRADE_CNT에 보존했습니다.", "",
        "### 인허가", "",
        "대상 외 업태를 제외하고 분석용 개업·폐업일로 분기별 건수를 계산했습니다. 이상 개업일 플래그는 개업 수에서 제외했고, 영업 수는 개업일 ≤ 분기 말 < 폐업일 기준으로 계산했습니다. 폐업일이 비어 있으면 영업 구간이 이어집니다. 대용 폐업일 건수는 분석용 폐업일이 속하는 분기에 기록했습니다.",
        "개업·폐업은 전체 기준으로 집계했습니다. 이전·재등록·교체를 별도로 제외한 지표는 팀 결정 항목입니다. 구 합계 검증에는 인허가 관청 코드를 사용했습니다. 주소가 가리키는 구와 관청의 구가 다른 건수는 CSV의 DONG_GU_CODE_MATCH에 기록했습니다.", "",
        f"### {last_quarter} 분기 말 영업 수 대조", "",
        *md_table(stock), "",
        "각 원천에서 모든 분기의 개업·폐업·기말 영업 수를 Silver 날짜 조건으로 직접 센 값과 대조했습니다. 팩트의 차원 연결률은 100%이며 키 중복은 0건입니다.", "",
        "## 출력과 재실행", "",
        "- `data/gold/`에 Snappy Parquet을 저장합니다. `04_gold__change_log.csv`는 실제 선택·집계·검증 건수를, `04_gold__manifest.csv`는 출력 행 수·SHA-256·재실행 상태를 기록합니다.",
        "- 심평원·상가 스냅샷, 전월세, 모델 결과는 이번 1차 집계 범위 밖입니다.",
        "- 프로젝트 루트에서 `python pipeline/gold/04_gold.py`로 실행하면 `data/silver/`를 읽습니다. ZIP은 `--silver-zip <경로>`를 지정한 경우에 읽습니다.",
    ]


def run(archive_path):
    periods, prefix, industries, proxy_codes, gu_map = load_rules()
    required = [silver_path(dataset) for dataset in INPUT_COLUMNS]
    if archive_path is None:
        missing = [path for path in required if not (SILVER_DIR / path).is_file()]
        if missing:
            raise FileNotFoundError(
                f"data/silver에 입력이 없습니다: {', '.join(missing)}. --silver-zip으로 지정할 수 있습니다."
            )
    input_label = archive_path.name if archive_path is not None else "data/silver"
    context = ZipFile(archive_path) if archive_path is not None else nullcontext()
    log = []
    with context as archive:
        if archive is not None:
            missing = {f"silver/{path}" for path in required} - set(archive.namelist())
            if missing:
                raise ValueError(f"ZIP에 Silver 입력이 없습니다: {', '.join(sorted(missing))}")
        regions = build_region(read_silver("ldong_code", archive, log), prefix, log)
        dates = build_dates(periods)
        grid = pd.MultiIndex.from_product([regions["LDONG_CD"], dates["YQ"]], names=REGION_PERIOD)
        eligible_trades = prepare_trades(
            read_silver("apt_trade", archive, log), prefix, periods, regions["LDONG_CD"], log,
        )
        trade_detail = build_trade_detail(eligible_trades)
        del eligible_trades
        record(log, "fact_apt_trd", "TRADE_DETAIL_ROWS", len(trade_detail), len(trade_detail))
        trades = aggregate_trades(trade_detail, grid, log)
        observed_regions = trades.loc[trades["TRADE_CNT"].gt(0), "LDONG_CD"]
        regions["HAS_OBSERVED_TRADE_YN"] = regions["LDONG_CD"].isin(observed_regions)
        record(
            log, "dim_region", "OBSERVED_TRADE_REGION", len(regions), regions["HAS_OBSERVED_TRADE_YN"].sum(),
            note="분석 기간 중 유효 매매가 1건 이상 관측된 법정동 수.",
        )
        parts = []
        for dataset in LICENSE_DATASETS:
            rows = prepare_licenses(
                read_silver(dataset, archive, log), dataset, regions["LDONG_CD"],
                industries["ANLS_INDUTY_CD"], gu_map, log,
            )
            counts = aggregate_license_source(rows, periods, proxy_codes)
            audit_license_source(log, dataset, rows, periods, counts)
            parts.append(counts)

    licenses = build_license_fact(parts, regions, dates, industries, log)
    mart = build_mart(trades, licenses, regions, dates)
    tables = {
        "dim_region": regions, "dim_date": dates, "dim_lcns_induty": industries,
        "fact_apt_trd": trade_detail,
        "fact_apt_trd_qtr": trades, "fact_lcns_qtr": licenses, "mart_ldong_infra_qtr": mart,
    }
    validate_tables(tables, log)
    record(log, "mart_ldong_infra_qtr", "FACT_JOIN", len(trades), len(mart))
    for row in write_results(tables, log, input_label):
        print(f"{row['dataset']}: {row['rows']:,} rows ({row['status']})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--silver-zip", type=Path, help="Silver 03 산출물이 들어 있는 ZIP 경로")
    args = parser.parse_args()
    run(args.silver_zip)
