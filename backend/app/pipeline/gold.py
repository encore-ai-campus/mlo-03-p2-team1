import json
from pathlib import Path

import numpy as np
import pandas as pd

LICENSE_CODES = {
    "food_general": ("일반음식점", "카페", "편의점"),
    "food_rest": ("카페", "편의점"),
    "clinic": ("의원", "치과의원", "한의원"),
    "pharmacy": ("약국",),
    "beauty": ("미용_헤어", "미용_피부", "미용_네일", "미용_메이크업", "미용_기타"),
}
DATASETS = ("apt_trade", "ldong_code", *LICENSE_CODES)
TRADE_KEY = ("LDONG_CD", "APT_KEY", "DEAL_DTM", "DEAL_AMT_NUM", "EXCL_AREA_NUM", "FLR_NUM", "APT_DONG_TXT")
TRADE_COLUMNS = (*TRADE_KEY, "SGG_CD", "CNCL_YN", "SAME_DEAL_YN", "SRC_FILE_NM", "SRC_ROW_NUM")
REGION_COLUMNS = ("LDONG_CD", "LDONG_NM", "SIDO_CD", "SIDO_NM", "SGG_CD", "SGG_NM", "UMD_NM", "LDONG_SE_CD", "ABL_YN")
LICENSE_COLUMNS = (
    "LDONG_CD", "LDONG_SRC_CD", "LGOV_CD", "OUT_SEOUL_ADDR_YN", "ANLS_INDUTY_CD", "ANLS_LCNS_DTM",
    "ANLS_CLSBIZ_DTM", "OUT_SCOPE_YN", "ABNRM_LCNS_DTM_YN", "CLSBIZ_SRC_CD",
)
LICENSE_METRICS = ("open_count", "close_count", "active_count", "proxy_close_count")
KEYS = ["ldong_cd", "yq"]


def flag(series: pd.Series) -> pd.Series:
    return series.astype("boolean").fillna(False)


def quarters(metadata: Path) -> pd.DataFrame:
    params = pd.read_csv(metadata / "cln_param.csv", dtype=str)
    values = params.loc[params["dataset"].eq("*")].set_index("param")["value"]
    start = pd.Timestamp(values["ANLS_BGN_DT"])
    end = pd.Timestamp(values["ANLS_END_DT"])
    if end < start:
        raise ValueError("분석 종료일이 시작일보다 앞섭니다")
    return pd.DataFrame([
        (str(q), q.year, q.quarter, max(q.start_time, start).date(), min(q.end_time.normalize(), end).date(), q.year == end.year)
        for q in pd.period_range(start, end, freq="Q")
    ], columns=["yq", "year", "quarter", "start_date", "end_date", "provisional"])


def region_dimension(frame: pd.DataFrame) -> pd.DataFrame:
    selected = frame["SIDO_CD"].eq("11") & frame["ABL_YN"].eq(False) & frame["LDONG_SE_CD"].eq("읍면동")
    region = frame.loc[selected, list(REGION_COLUMNS[:7])].rename(columns=str.lower)
    if region.empty or region["ldong_cd"].duplicated().any():
        raise ValueError("서울 현행 법정동 코드가 비어 있거나 중복됩니다")
    return region.sort_values("ldong_cd").reset_index(drop=True)


def trade_facts(frame: pd.DataFrame, region: pd.DataFrame, dates: pd.DataFrame) -> pd.DataFrame:
    frame = frame.assign(DEAL_DTM=pd.to_datetime(frame["DEAL_DTM"]))
    start = pd.Timestamp(dates["start_date"].iloc[0])
    end = pd.Timestamp(dates["end_date"].iloc[-1])
    eligible = (
        frame["SGG_CD"].str.startswith("11", na=False) & ~flag(frame["CNCL_YN"])
        & frame["LDONG_CD"].isin(region["ldong_cd"]) & frame["DEAL_DTM"].between(start, end)
    )
    trades = frame.loc[eligible]
    flagged = flag(trades["SAME_DEAL_YN"])
    representatives = (
        trades.loc[flagged].sort_values(["SRC_FILE_NM", "SRC_ROW_NUM"], kind="stable")
        .drop_duplicates(list(TRADE_KEY))
    )
    trades = pd.concat([trades.loc[~flagged], representatives], ignore_index=True)
    amount = trades["DEAL_AMT_NUM"].astype("float64")
    area = trades["EXCL_AREA_NUM"].astype("float64")
    price = amount.where(amount.gt(0) & np.isfinite(amount)) / area.where(area.gt(0) & np.isfinite(area))
    trades = trades.assign(yq=trades["DEAL_DTM"].dt.to_period("Q").astype(str), price=price.where(np.isfinite(price)))
    return (
        trades.groupby(["LDONG_CD", "yq"], as_index=False)
        .agg(trade_count=("price", "size"), priced_count=("price", "count"), price_per_sqm_won=("price", "median"))
        .rename(columns={"LDONG_CD": "ldong_cd"})
    )


def license_facts(
    inputs: dict[str, Path], region: pd.DataFrame, dates: pd.DataFrame, industry: pd.DataFrame,
    district_map: pd.Series, report: Path,
) -> pd.DataFrame:
    frames = []
    unmatched = []
    for dataset, codes in LICENSE_CODES.items():
        source = pd.read_parquet(inputs[dataset], columns=list(LICENSE_COLUMNS))
        scope = (
            ~flag(source["OUT_SCOPE_YN"]) & source["ANLS_INDUTY_CD"].isin(codes)
        )
        identified = (
            source["LDONG_CD"].isin(region["ldong_cd"])
            & ~source["LDONG_SRC_CD"].str.startswith("실패", na=False)
            & ~flag(source["OUT_SEOUL_ADDR_YN"])
        )
        frames.append(source.loc[scope & identified])
        missed = source.loc[scope & ~identified, ["LGOV_CD", "ANLS_INDUTY_CD"]].copy()
        missed["sgg_cd"] = missed["LGOV_CD"].map(district_map)
        unmatched.append(missed.assign(dataset=dataset))
    audit = pd.concat(unmatched, ignore_index=True)
    audit.groupby(["dataset", "sgg_cd", "ANLS_INDUTY_CD"], dropna=False).size().rename("unmatched_count").to_csv(
        report / "gold_license_unmatched.csv", encoding="utf-8-sig",
    )
    licenses = pd.concat(frames, ignore_index=True)
    opened = pd.to_datetime(licenses["ANLS_LCNS_DTM"])
    closed = pd.to_datetime(licenses["ANLS_CLSBIZ_DTM"])
    valid_open = ~flag(licenses["ABNRM_LCNS_DTM_YN"])
    proxy = licenses["CLSBIZ_SRC_CD"].str.startswith("최종수정일자_", na=False)
    results = []
    for period in dates.itertuples(index=False):
        start, end = pd.Timestamp(period.start_date), pd.Timestamp(period.end_date)
        closing = closed.between(start, end)
        rows = licenses[["LDONG_CD", "ANLS_INDUTY_CD"]].assign(
            open_count=opened.between(start, end) & valid_open,
            close_count=closing,
            active_count=opened.le(end) & (closed.isna() | closed.gt(end)),
            proxy_close_count=closing & proxy,
        )
        results.append(rows.groupby(["LDONG_CD", "ANLS_INDUTY_CD"], as_index=False)[list(LICENSE_METRICS)].sum().assign(yq=period.yq))

    counts = pd.concat(results, ignore_index=True).rename(columns={"LDONG_CD": "ldong_cd", "ANLS_INDUTY_CD": "industry_code"})
    grid = region[["ldong_cd"]].merge(dates[["yq"]], how="cross").merge(industry[["industry_code"]], how="cross")
    facts = grid.merge(counts, on=[*KEYS, "industry_code"], how="left", validate="one_to_one")
    facts[list(LICENSE_METRICS)] = facts[list(LICENSE_METRICS)].fillna(0).astype("int64")
    return facts


def market_mart(region: pd.DataFrame, dates: pd.DataFrame, trades: pd.DataFrame) -> pd.DataFrame:
    grid = region[["ldong_cd"]].merge(dates[["yq", "year", "quarter"]], how="cross")
    mart = grid.merge(trades, on=KEYS, how="left", validate="one_to_one")
    counts = ["trade_count", "priced_count"]
    mart[counts] = mart[counts].fillna(0).astype("int64")
    prior = mart[["ldong_cd", "year", "quarter", "price_per_sqm_won"]].rename(
        columns={"price_per_sqm_won": "prior_price"}
    )
    prior["year"] += 1
    mart = mart.merge(prior, on=["ldong_cd", "year", "quarter"], how="left", validate="one_to_one")
    mart["actual_growth_pct"] = 100 * (mart["price_per_sqm_won"] / mart["prior_price"].where(mart["prior_price"].gt(0)) - 1)
    return mart[[*KEYS, *counts, "price_per_sqm_won", "actual_growth_pct"]]


def run(workspace: Path, inputs: dict[str, Path], *, updated_trades: Path | None = None) -> Path:
    missing = [dataset for dataset in DATASETS if dataset not in inputs or not inputs[dataset].is_file()]
    if missing:
        raise ValueError(f"필수 Silver 03 산출물 누락: {', '.join(missing)}")
    metadata = workspace / "metadata"
    dates = quarters(metadata)
    region = region_dimension(pd.read_parquet(inputs["ldong_code"], columns=list(REGION_COLUMNS)))
    codes = pd.read_csv(metadata / "cln_code_value.csv", dtype=str)
    expected = {code for values in LICENSE_CODES.values() for code in values}
    configured = set(codes.loc[codes["code_column"].eq("ANLS_INDUTY_CD"), "code_value"])
    if expected - configured:
        raise ValueError(f"메타데이터에 없는 인허가 업종: {sorted(expected - configured)}")
    industry = pd.DataFrame({"industry_code": sorted(expected)})
    industry["reference_only"] = industry["industry_code"].eq("편의점")
    trade_rows = pd.read_parquet(inputs["apt_trade"], columns=list(TRADE_COLUMNS))
    if updated_trades:
        latest = pd.read_parquet(updated_trades, columns=list(TRADE_COLUMNS))
        retained = trade_rows.loc[~trade_rows["SRC_FILE_NM"].isin(latest["SRC_FILE_NM"])]
        trade_rows = pd.concat([retained, latest], ignore_index=True)
    trades = trade_facts(trade_rows, region, dates)
    report = workspace / "report"
    report.mkdir(exist_ok=True)
    districts = pd.read_csv(metadata / "cln_lgov_sgg_map.csv", dtype=str).set_index("LGOV_CD")["SGG_CD"]
    licenses = license_facts(inputs, region, dates, industry, districts, report)
    mart = market_mart(region, dates, trades)
    license_rows = licenses.merge(industry, on="industry_code", validate="many_to_one")
    metrics = [
        (ldong_cd, yq, json.dumps(rows.drop(columns=KEYS).to_dict("records"), ensure_ascii=False))
        for (ldong_cd, yq), rows in license_rows.groupby(KEYS)
    ]
    mart = mart.merge(
        pd.DataFrame(metrics, columns=[*KEYS, "license_metrics"]), on=KEYS, validate="one_to_one",
    )
    destination = workspace / "data" / "gold"
    destination.mkdir(parents=True, exist_ok=True)
    for name, table in {
        "dim_region": region, "dim_date": dates, "dim_lcns_induty": industry,
        "fact_apt_trd_qtr": trades, "fact_lcns_qtr": licenses, "mart_ldong_infra_qtr": mart,
    }.items():
        table.to_parquet(destination / f"{name}.parquet", index=False)
    return destination
