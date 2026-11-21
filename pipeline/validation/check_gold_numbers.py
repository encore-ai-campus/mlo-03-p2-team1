"""Gold의 매매 관련 정답지 4건을 기간 필터 전 서울 Silver 입력과 대조한다."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.paths import METADATA_DIR, SILVER_DIR, stage_file_name

GOLD_ISSUES = {"KI26", "KI27", "KI28", "KI31"}


def trade_check_parameters(params):
    prefix = params.loc[params["param"].eq("SEOUL_SGG_PREFIX"), "value"].item()
    price_min = params.loc[
        params["param"].eq("ABNRM_UNIT_AMT_MIN") & params["dataset"].eq("apt_trade"), "value",
    ].item()
    return prefix, float(price_min)


def check_known_issues(seoul_trades, price_min):
    known = pd.read_csv(METADATA_DIR / "known_issues.csv", dtype=str, keep_default_na=False)
    selected = known.loc[known["issue_id"].isin(GOLD_ISSUES)]
    if len(selected) != len(GOLD_ISSUES) or set(selected["issue_id"]) != GOLD_ISSUES:
        raise ValueError("Gold 정답지 항목이 누락되었거나 중복됩니다.")
    unit_amt = seoul_trades["DEAL_AMT_NUM"] / seoul_trades["EXCL_AREA_NUM"]
    measured = {
        "G5": seoul_trades["LDONG_SRC_CD"].eq("실패").sum(),
        "G2": seoul_trades["SAME_DEAL_YN"].eq(True).sum(),
        "G1": seoul_trades["CNCL_YN"].eq(True).sum(),
        "G6": unit_amt.lt(price_min).sum(),
    }
    rows = []
    for item in selected.itertuples(index=False):
        expected = int(item.expected_cnt)
        actual = int(measured[item.rule_ref])
        rows.append({
            "issue_id": item.issue_id,
            "rule_ref": item.rule_ref,
            "dataset": item.dataset,
            "description": item.description,
            "expected_cnt": expected,
            "measured_cnt": actual,
            "diff": actual - expected,
            "basis": item.cnt_basis,
            "check": "OK" if actual == expected else "NG",
        })
    return pd.DataFrame(rows)


def main():
    params = pd.read_csv(METADATA_DIR / "cln_param.csv", dtype=str, keep_default_na=False)
    prefix, price_min = trade_check_parameters(params)
    path = SILVER_DIR / "apt_trade" / stage_file_name("03", "apt_trade")
    trades = pd.read_parquet(path, columns=[
        "SGG_CD", "LDONG_SRC_CD", "SAME_DEAL_YN", "CNCL_YN", "DEAL_AMT_NUM", "EXCL_AREA_NUM",
    ])
    results = check_known_issues(trades.loc[trades["SGG_CD"].str.startswith(prefix, na=False)], price_min)
    for row in results.itertuples(index=False):
        print(f"{row.check} {row.issue_id} {row.rule_ref}: 기대 {row.expected_cnt:,} / 실측 {row.measured_cnt:,}")
    return int(results["check"].eq("NG").any())


if __name__ == "__main__":
    sys.exit(main())
