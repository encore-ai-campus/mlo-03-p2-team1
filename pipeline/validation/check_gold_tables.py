"""저장된 04 Gold Parquet의 키, 집계, 마트와 출력 해시를 검증한다."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.files import sha256_file
from common.paths import DATA_DIR, METADATA_DIR, PROJECT_ROOT, REPORT_DIR, stage_file_name

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
    "fact_lcns_qtr": LICENSE_KEY,
    "mart_ldong_infra_qtr": REGION_PERIOD,
}
TRADE_METRICS = ["TRADE_CNT", "PRICE_SAMPLE_CNT", "UNIT_AMT_MEDIAN"]
DIMENSION_KEYS = {"LDONG_CD": "dim_region", "YQ": "dim_date", "ANLS_INDUTY_CD": "dim_lcns_induty"}
FOREIGN_KEYS = {
    "fact_apt_trd": REGION_PERIOD,
    "fact_apt_trd_qtr": REGION_PERIOD,
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


def validate_tables(tables, industry_rules, mart_groups):
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
    if len(quarters) != size or len(tables["mart_ldong_infra_qtr"]) != size or len(licenses) != size * len(industries):
        raise ValueError("차원 조합 수와 팩트·마트 행 수가 다릅니다.")

    detail = tables["fact_apt_trd"]
    grouped = detail.groupby(REGION_PERIOD)["UNIT_AMT"].agg(
        TRADE_CNT="size", PRICE_SAMPLE_CNT="count", UNIT_AMT_MEDIAN="median",
    ).reindex(quarters.index)
    for column in ("TRADE_CNT", "PRICE_SAMPLE_CNT"):
        grouped[column] = grouped[column].fillna(0).astype("int64")
    pd.testing.assert_frame_equal(quarters[TRADE_METRICS], grouped, check_exact=True)
    pd.testing.assert_frame_equal(mart[TRADE_METRICS], quarters[TRADE_METRICS], check_exact=True)
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
    validate_tables(tables, rules, groups)
    print(f"Gold Parquet {len(tables)}개 검증 통과")


if __name__ == "__main__":
    main()
