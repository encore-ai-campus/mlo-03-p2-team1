"""저장된 04 Gold Parquet의 키, 집계, 마트와 출력 해시를 검증한다."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.files import sha256_file
from common.paths import DATA_DIR, METADATA_DIR, PROJECT_ROOT, REPORT_DIR, stage_file_name
from gold.price_index import build_price_index, load_min_price_samples

TRADE_SOURCE_KEY = ["SRC_FILE_NM", "SRC_ROW_NUM"]
REGION_PERIOD = ["LDONG_CD", "YQ"]
LICENSE_KEY = [*REGION_PERIOD, "ANLS_INDUTY_CD"]
LICENSE_COUNTS = ["OPEN_CNT", "CLOSE_CNT", "ACTIVE_CNT", "PROXY_CLOSE_CNT"]
TABLE_KEYS = {
    "dim_region": ["LDONG_CD"],
    "dim_date": ["YQ"],
    "dim_lcns_induty": ["ANLS_INDUTY_CD"],
    "fact_apt_trd": TRADE_SOURCE_KEY,
    "fact_apt_trd_qtr": REGION_PERIOD,
    "fact_apt_idx_qtr": REGION_PERIOD,
    "fact_lcns_qtr": LICENSE_KEY,
    "mart_ldong_infra_qtr": REGION_PERIOD,
}
TRADE_METRICS = ["TRADE_CNT", "PRICE_SAMPLE_CNT", "UNIT_AMT_MEDIAN"]
DIMENSION_KEYS = {"LDONG_CD": "dim_region", "YQ": "dim_date", "ANLS_INDUTY_CD": "dim_lcns_induty"}
FOREIGN_KEYS = {
    "fact_apt_trd": REGION_PERIOD,
    "fact_apt_trd_qtr": REGION_PERIOD,
    "fact_apt_idx_qtr": REGION_PERIOD,
    "fact_lcns_qtr": LICENSE_KEY,
    "mart_ldong_infra_qtr": REGION_PERIOD,
}


def load_industry_rules():
    rules = pd.read_csv(METADATA_DIR / "rule_gold_induty.csv", dtype=str, keep_default_na=False)
    rules = rules.set_index("ANLS_INDUTY_CD")
    if rules.empty or not rules.index.is_unique or "" in rules.index:
        raise ValueError("Gold 업종 규칙의 업종 코드가 비어 있거나 중복됩니다.")
    if not rules["reference_yn"].isin(["Y", "N"]).all():
        raise ValueError("Gold 업종 규칙의 reference_yn은 Y 또는 N이어야 합니다.")
    if (rules["mart_group"].eq("") & rules["reference_yn"].eq("N")).any():
        raise ValueError("마트 그룹이 없는 업종은 참고 업종으로 표기해야 합니다.")
    named = rules.loc[rules["mart_group"].ne("")]
    if named.empty:
        raise ValueError("Gold 업종 규칙에 마트 그룹이 없습니다.")
    groups = {name: group.index.tolist() for name, group in named.groupby("mart_group", sort=False)}
    return rules, groups


def validate_price_index(tables, grid, min_samples):
    stored = tables["fact_apt_idx_qtr"].sort_values(REGION_PERIOD).reset_index(drop=True)
    expected = build_price_index(tables["fact_apt_trd"], tables["dim_region"], grid, min_samples)
    pd.testing.assert_frame_equal(stored, expected, check_exact=True)

    rates = stored["CPLX_RET_1Q"]
    levels = stored["PRICE_IDX"]
    segments = stored["IDX_SEG_NO"]
    dongs = stored["LDONG_CD"]
    observed = rates.notna()
    if not levels.notna().equals(observed) or not segments.notna().equals(observed):
        raise ValueError("1분기 변화율이 끊긴 구간에는 지수와 구간 번호가 비어 있어야 합니다.")
    starts = observed & rates.groupby(dongs).shift().isna()
    if not levels[starts].eq(100).all():
        raise ValueError("새 지수 구간은 100에서 시작해야 합니다.")
    if not segments[starts].eq(1 + starts[starts].groupby(dongs[starts]).cumcount()).all():
        raise ValueError("동별 지수 구간 번호가 순서대로 증가해야 합니다.")
    previous = levels.groupby(dongs).shift()
    continuing = observed & ~starts
    np.testing.assert_allclose(
        np.log(levels[continuing] / previous[continuing]), rates[continuing],
        rtol=0, atol=1e-12,
    )


def validate_tables(tables, industry_rules, mart_groups, min_samples):
    checks = []
    for name, keys in TABLE_KEYS.items():
        table = tables[name]
        if table[keys].isna().any().any() or table.duplicated(keys).any():
            raise ValueError(f"{name}: 키의 결측 또는 중복이 있습니다.")
        checks.append((name, "KEY_UNIQUENESS", len(table), len(table), ""))
    for name, keys in FOREIGN_KEYS.items():
        table = tables[name]
        for key in keys:
            matched = table[key].isin(tables[DIMENSION_KEYS[key]][key]).sum()
            if matched != len(table):
                raise ValueError(f"{name}: {key} 차원 연결이 누락됐습니다.")
            checks.append((name, "DIMENSION_MATCH", len(table), matched, key))

    regions = tables["dim_region"]
    dates = tables["dim_date"]
    industries = tables["dim_lcns_induty"].set_index("ANLS_INDUTY_CD")
    expected_refs = industry_rules["reference_yn"].eq("Y")
    if set(industries.index) != set(expected_refs.index) or not industries["REFERENCE_YN"].eq(
        expected_refs.reindex(industries.index),
    ).all():
        raise ValueError("업종 차원의 코드 또는 참고 플래그가 Gold 메타데이터와 다릅니다.")
    size = len(regions) * len(dates)
    quarters = tables["fact_apt_trd_qtr"].set_index(REGION_PERIOD)
    mart = tables["mart_ldong_infra_qtr"].set_index(REGION_PERIOD).reindex(quarters.index)
    licenses = tables["fact_lcns_qtr"].set_index(LICENSE_KEY)
    if (
        len(quarters) != size or len(tables["mart_ldong_infra_qtr"]) != size
        or len(tables["fact_apt_idx_qtr"]) != size or len(licenses) != size * len(industries)
    ):
        raise ValueError("차원 조합 수와 팩트·마트 행 수가 다릅니다.")

    detail = tables["fact_apt_trd"]
    grouped = detail.groupby(REGION_PERIOD)["UNIT_AMT"].agg(
        TRADE_CNT="size", PRICE_SAMPLE_CNT="count", UNIT_AMT_MEDIAN="median",
    ).reindex(quarters.index)
    for column in ("TRADE_CNT", "PRICE_SAMPLE_CNT"):
        grouped[column] = grouped[column].fillna(0).astype("int64")
    pd.testing.assert_frame_equal(quarters[TRADE_METRICS], grouped, check_exact=True)
    pd.testing.assert_frame_equal(mart[TRADE_METRICS], quarters[TRADE_METRICS], check_exact=True)
    expected_low_sample = quarters["PRICE_SAMPLE_CNT"].lt(min_samples)
    if not quarters["LOW_SAMPLE_YN"].equals(expected_low_sample) or not mart["LOW_SAMPLE_YN"].equals(expected_low_sample):
        raise ValueError("Gold 희소 표시가 가격 표본 수 및 메타데이터 기준과 다릅니다.")
    for table in (dates, mart):
        flags = table["PROVISIONAL_YN"]
        if flags.isna().any() or not flags.eq(False).all():
            raise ValueError("PROVISIONAL_YN은 모든 분기에서 False여야 합니다.")
    checks.append(("fact_apt_trd_qtr", "LOW_SAMPLE_RULE_CHECK", size, size, ""))
    checks.append(("mart_ldong_infra_qtr", "LOW_SAMPLE_RULE_CHECK", size, size, ""))
    checks.append(("dim_date", "PROVISIONAL_RULE_CHECK", len(dates), len(dates), ""))
    checks.append(("mart_ldong_infra_qtr", "PROVISIONAL_RULE_CHECK", size, size, ""))
    expected_observed = regions["LDONG_CD"].isin(detail["LDONG_CD"])
    if not regions["HAS_OBSERVED_TRADE_YN"].equals(expected_observed):
        raise ValueError("거래 관측 여부가 상세 팩트와 다릅니다.")
    if licenses[LICENSE_COUNTS].isna().any().any() or (licenses[LICENSE_COUNTS] < 0).any().any():
        raise ValueError("인허가 팩트 건수에 결측 또는 음수가 있습니다.")
    if not licenses["NET_CNT"].eq(licenses["OPEN_CNT"] - licenses["CLOSE_CNT"]).all():
        raise ValueError("인허가 순증이 개업 수와 폐업 수의 차이와 다릅니다.")
    wide = licenses[LICENSE_COUNTS].unstack("ANLS_INDUTY_CD").reindex(quarters.index)
    for group, codes in mart_groups.items():
        for metric in LICENSE_COUNTS:
            expected = wide[metric][codes].sum(axis=1)
            if not mart[f"{group}_{metric}"].equals(expected):
                raise ValueError(f"마트 {group}_{metric}이 업종 팩트 집계와 다릅니다.")
    validate_price_index(tables, quarters.index, min_samples)
    checks.append(("fact_apt_idx_qtr", "INDEX_RECALCULATION_CHECK", size, size, "상세 거래 재집계 및 지수 연결 검증"))
    return checks


def main():
    rules, groups = load_industry_rules()
    manifest_path = REPORT_DIR / "gold" / stage_file_name("04", "manifest", ext="csv")
    manifest = pd.read_csv(manifest_path, dtype=str, keep_default_na=False)
    if "kind" in manifest:
        manifest = manifest.loc[manifest["kind"].eq("output")]
    if manifest["dataset"].duplicated().any() or set(manifest["dataset"]) != set(TABLE_KEYS):
        raise ValueError("Gold 매니페스트의 출력 목록이 스타 스키마와 다릅니다.")
    tables = {}
    for row in manifest.itertuples(index=False):
        path = DATA_DIR / "gold" / stage_file_name("04", row.dataset)
        if path != PROJECT_ROOT / row.file or sha256_file(path) != row.sha256:
            raise ValueError(f"{row.dataset}: 출력 경로 또는 SHA-256이 매니페스트와 다릅니다.")
        table = pd.read_parquet(path)
        if table.shape != (int(row.rows), int(row.columns)):
            raise ValueError(f"{row.dataset}: 출력 크기가 매니페스트와 다릅니다.")
        tables[row.dataset] = table
    validate_tables(tables, rules, groups, load_min_price_samples())
    print(f"Gold Parquet {len(tables)}개 검증 통과")


if __name__ == "__main__":
    main()
