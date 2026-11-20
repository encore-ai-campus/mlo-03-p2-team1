"""03 결과 수치 회귀 검사. docs/silver_정제_테스트계획.md L3.

사용법
  python pipeline/validation/check_cln_numbers.py

metadata/known_issues.csv 의 expected_cnt 와 03 결과(03 parquet, report/silver/03_*)에서 다시 센 값을 비교한다.
'02 전체' 기준 항목은 정확히 같아야 하고, 'bronze 점검' 기준 항목은 차이를 기록만 한다. 정확 항목이 하나라도 틀리면 종료 코드 1.
결과 표는 report/silver/03_silver__known_issues_check.csv 에 쓴다.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
SILVER = ROOT / "data" / "silver"
REPORT = ROOT / "report" / "silver"


def load03(ds: str) -> pd.DataFrame:
    return pd.read_parquet(SILVER / ds / f"03_silver__{ds}.parquet")


def load02(ds: str, cols: list[str]) -> pd.DataFrame:
    df = pd.read_parquet(next((SILVER / ds).glob("02_silver__*.parquet")), columns=cols)
    for c in cols:
        if c.endswith("_DTM"):
            df[c] = pd.to_datetime(df[c])
    return df


issues = pd.read_csv(REPORT / "03_silver__issue_list.csv", dtype=str, keep_default_na=False, encoding="utf-8-sig")
change = pd.read_csv(REPORT / "03_silver__change_log.csv", dtype=str, keep_default_na=False, encoding="utf-8-sig")
known = pd.read_csv(ROOT / "metadata" / "known_issues.csv", dtype=str, keep_default_na=False, encoding="utf-8-sig")
DS = ["food_general", "food_rest", "clinic", "pharmacy", "beauty"]
d03 = {ds: load03(ds) for ds in DS}


def n_issue(code: str, ds: str, column: str | None = None) -> int:
    sel = (issues["issue_cd"] == code) & ((issues["dataset"] == ds) if ds != "*" else issues["dataset"].isin(DS))
    if column:
        sel &= issues["column"] == column
    return int(sel.sum())


def clog(ds: str, section: str, item: str) -> str:
    v = change[(change["dataset"] == ds) & (change["section"] == section) & (change["item"] == item)]["value"]
    return v.iloc[0] if len(v) else ""


def measure(row) -> int:
    ds, col, ref = row.dataset, row.column, row.rule_ref
    if ref == "C1":
        return int((d03[ds]["CLSBIZ_SRC_CD"] == "최종수정일자_전출").sum())
    if ref == "C2":
        if ds == "food_rest":      # 02 전체 기준 (중복 제거 전)
            raw = load02(ds, ["DTL_TRD_STATE_NM", "CLSBIZ_DTM"])
            return int(((raw["DTL_TRD_STATE_NM"] == "폐업") & raw["CLSBIZ_DTM"].isna()).sum())
        return int((d03[ds]["CLSBIZ_SRC_CD"] == "최종수정일자_대용").sum())
    if ref == "C3":
        return int(clog(ds, "행수", "중복_LCNS_KEY") or 0)
    if ref == "C4":
        return n_issue("BRKN_NM" if col == "BPLC_NM" else "BRKN_ADDR", ds, col)
    if ref == "C5" and col == "LCNS_DTM":
        if ds == "food_rest":
            raw = load02(ds, ["LCNS_DTM"])
            return int((raw["LCNS_DTM"] < pd.Timestamp("1950-01-01")).sum())
        return int(d03[ds]["ABNRM_LCNS_DTM_YN"].sum())
    if ref == "C5":
        return n_issue("FUTURE_CLSBIZ" if "이후" in row.description else "INVALID_CLSBIZ", ds)
    if ref == "C6":
        return sum(int((issues["dataset"] == d).mul(issues["value"] == "02-0000-0000").sum()) for d in DS)
    if ref == "D4":
        return int((d03[ds]["LDONG_SRC_CD"] == "실패_전출주소").sum())
    if ref in ("E5", "E6"):
        return int(d03[ds]["OUT_SCOPE_YN"].sum())
    if ref == "G4":                   # 실거래가 전월세 02 변환 실패 (change_log)
        return int(clog(ds, "G4", "CNTRCT_BGN_DTM_변환실패") or 0)
    if ref in ("G1", "G2", "G5"):     # 실거래가 매매·전월세
        col03 = {"G1": "CNCL_YN", "G2": "SAME_DEAL_YN", "G5": "LDONG_SRC_CD"}[ref]
        t = pd.read_parquet(SILVER / ds / f"03_silver__{ds}.parquet", columns=["SGG_CD", col03])
        t = t[t["SGG_CD"].str.startswith("11")]
        return int((t[col03] == "실패").sum()) if ref == "G5" else int(t[col03].fillna(False).astype(bool).sum())
    if ref == "D3":
        return sum(int(clog(d, "D3", "서울밖_2017이후영업") or 0) for d in DS)
    raise KeyError(row.issue_id)


rows = []
for r in known.itertuples():
    got = measure(r)
    exp = int(r.expected_cnt)
    exact = r.cnt_basis.startswith("02 전체")
    rows.append({"issue_id": r.issue_id, "rule_ref": r.rule_ref, "dataset": r.dataset, "description": r.description,
                 "expected_cnt": exp, "measured_cnt": got, "diff": got - exp, "basis": r.cnt_basis,
                 "check": ("OK" if got == exp else "NG") if exact else ("OK" if got == exp else "차이기록")})
out = pd.DataFrame(rows)
out.to_csv(REPORT / "03_silver__known_issues_check.csv", index=False, encoding="utf-8-sig")
for x in out.itertuples():
    print(f"{x.check:4} {x.issue_id} {x.dataset:12} {x.description[:30]:32} 기대 {x.expected_cnt:>6} / 결과 {x.measured_cnt:>6}")
ng = (out["check"] == "NG").sum()
print(f"\n정확 비교 {int((out['check'] != '차이기록').sum())}건 중 NG {ng}, 차이기록 {int((out['check'] == '차이기록').sum())}건")
sys.exit(1 if ng else 0)
