"""[03] Silver 정제: data/silver/{ds}/02_*.parquet → data/silver/{ds}/03_silver__{ds}.parquet

사용법
  python pipeline/silver/03_clean.py                       # 인허가 5종 + 실거래가 매매·전월세 + 심평원 + 상가정보 + 법정동코드
  python pipeline/silver/03_clean.py --dataset pharmacy    # 일부만 (기록의 다른 데이터셋 행은 유지)
  python pipeline/silver/03_clean.py --check               # metadata 검사만 (파일을 쓰지 않음)

규칙: docs/silver_정제.md (초안). 기준값: metadata/cln_*.csv. 규칙 함수: pipeline/silver/cln_rules.py
- 원본 컬럼은 덮어쓰지 않는다. 판단한 값은 분석용 컬럼 + 출처 컬럼으로 붙인다.
- 행을 지우는 것은 관리번호 중복 [C3] 뿐이다.
- 일반음식점 03 파일은 하나 (API 본체 + CSV 의 LDONG_CD·UTMK 보완) [A1]. food_general_file 03 파일은 만들지 않는다.
- 실거래가 매매는 행을 모두 유지(해제 포함)하고, LDONG_CD 를 현행 법정동 코드표에 맞추며(못 찾으면 NULL, SGG_CD 유지) [G5],
  동일 조건 거래를 SAME_DEAL_YN 플래그로 둔다(묶음 목록은 서울만 issue_list) [G2]. 서울 필터는 골드에서 [A3].
- 실거래가 전월세는 02 컬럼을 그대로 두고 LDONG_CD·LDONG_SRC_CD 만 붙인다 (SGG_CD + UMD_NM) [G5]. 동일 조건 거래는 건수만.
- 심평원은 02 파일 12개 중 병원정보·약국정보만 기관 파일 하나로 합치고(상세 10개는 02 에 둠) [H0],
  도로명 주소로 법정 시군구 SGG_CD, UMD_NM·도로명 괄호 동명으로 LDONG_CD 를 붙인다 [H1].
- 상가정보는 시도별 02 파일 16개를 하나로 합치고(전국 유지) [S0], 현행 코드표에 없는 LDONG_CD 만
  SGG_CD + LDONG_NM 으로 다시 찾거나 NULL 로 둔다 [S1].
- 법정동코드는 모든 행(전국·폐지 포함)을 두고 구분·시도·시군구·읍면동·리 계층 컬럼을 붙인다 [L1] (골드 dim_region 원천).

기록 (report/silver/)
  03_silver__manifest.csv   : 파일별 행 수(02 → 03), 중복 제거, 완료 조건 결과, 재실행 상태
  03_silver__change_log.csv : 출처·플래그·업종·연결·이슈 건수, 연결 전후 재고, 동·구 합계 차이, 카페 키워드
  03_silver__issue_list.csv : 컬럼으로 두지 않은 품질 정보의 레코드 목록
완료 조건 1~8 (docs/silver_정제.md 4장) 중 하나라도 어기면 종료 코드 1.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # pipeline/ → from common import ...
sys.path.insert(0, str(Path(__file__).resolve().parent))       # pipeline/silver/ → import cln_rules

import cln_rules as R
from common.files import replace_if_changed, snapshot_files
from common.paths import METADATA_DIR, REPORT_DIR, SILVER_DIR, relative, stage_file_name
from common.report import merge_dataset_rows, now_kst, write_csv

IDX = "03"
REPORT_SILVER_DIR = REPORT_DIR / "silver"
ROW_GROUP = 100_000
COMPRESSION = "snappy"
ALL_DATASETS = R.LICENSE_DATASETS + ["apt_trade", "apt_rent", "hira_inst", "store_info", "ldong_code"]

NEW_TYPES = {
    "ANLS_CLSBIZ_DTM": pa.date32(), "ANLS_LCNS_DTM": pa.date32(),
    "ABNRM_LCNS_DTM_YN": pa.bool_(), "OUT_SEOUL_ADDR_YN": pa.bool_(), "OUT_SCOPE_YN": pa.bool_(), "SAME_DEAL_YN": pa.bool_(),
    "UTMK_X_NUM": pa.float64(), "UTMK_Y_NUM": pa.float64(),
}


def hira02() -> list[Path]:
    """심평원 02 파일 12개 중 03 에 넣는 병원정보·약국정보 [H0]."""
    files = [f for pre in R.HIRA_FILES for f in sorted((SILVER_DIR / "hira_inst").glob(f"02_silver__hira_inst__{pre}*.parquet"))]
    if len(files) != len(R.HIRA_FILES):
        raise FileNotFoundError(f"hira_inst: 병원정보·약국정보 02 파일이 {len(files)}개 (2개여야 함). 02 단계를 먼저 실행하세요")
    return files


def silver02(dataset: str) -> Path:
    if dataset == "hira_inst":
        return hira02()[0]
    if dataset == "store_info":
        return store02()[0]
    files = sorted((SILVER_DIR / dataset).glob("02_silver__*.parquet"))
    if len(files) != 1:
        raise FileNotFoundError(f"{dataset}: 02 silver 파일이 {len(files)}개 (1개여야 함). 02 단계를 먼저 실행하세요")
    return files[0]


def read02(path: Path) -> tuple[pd.DataFrame, pa.Schema]:
    table = pq.read_table(path)
    return table.to_pandas(date_as_object=False), table.schema


class Log:
    """change_log / issue_list 누적."""

    def __init__(self, dataset: str):
        self.dataset = dataset
        self.rows: list[dict] = []
        self.issues: list[pd.DataFrame] = []

    def add(self, section: str, item: str, value, note: str = "") -> None:
        self.rows.append({"dataset": self.dataset, "section": section, "item": item, "value": value, "note": note})

    def counts(self, section: str, values: pd.Series, note: str = "") -> None:
        for k, v in values.fillna("(NULL)").astype(str).value_counts().sort_index().items():
            self.add(section, k, int(v), note)

    def issue(self, code: str, rec_key: pd.Series, column: str, value: pd.Series | str) -> None:
        if len(rec_key) == 0:
            return
        v = value if isinstance(value, pd.Series) else pd.Series(value, index=rec_key.index)
        self.issues.append(pd.DataFrame({"dataset": self.dataset, "issue_cd": code, "rec_key": rec_key.astype(str).values,
                                         "column": column, "value": v.astype(str).values}))

    def issue_frame(self) -> pd.DataFrame:
        cols = ["dataset", "issue_cd", "rec_key", "column", "value"]
        if not self.issues:
            return pd.DataFrame(columns=cols)
        # 한 칸이 자리표시 규칙 여러 줄(eq + regex)에 걸려도 이슈는 한 번만
        return pd.concat(self.issues, ignore_index=True).drop_duplicates(ignore_index=True)


# ──────────────────────────────────────────────────────────────
# 인허가 5종
# ──────────────────────────────────────────────────────────────
def dedup(df: pd.DataFrame, log: Log) -> tuple[pd.DataFrame, int]:
    """[C3] LCNS_KEY 중복: UPD_DTM 최신, 같으면 SRC_ROW_NUM 큰 행을 남긴다."""
    dup_mask = df["LCNS_KEY"].duplicated(keep=False)
    log.add("행수", "중복_LCNS_KEY", int(df.loc[dup_mask, "LCNS_KEY"].nunique()))
    log.add("행수", "중복_행", int(dup_mask.sum()))
    if not dup_mask.any():
        return df, 0
    order = df.sort_values(["LCNS_KEY", "UPD_DTM", "SRC_ROW_NUM"], na_position="first")
    keep_idx = order.drop_duplicates("LCNS_KEY", keep="last").index
    removed = df.drop(index=keep_idx)
    kept = df.loc[keep_idx].set_index("LCNS_KEY")
    compare = [c for c in df.columns if c not in ("LCNS_KEY", "SRC_ROW_NUM", "SRC_FILE_NM")]
    diff_txt = []
    for _, row in removed.iterrows():
        k = kept.loc[row["LCNS_KEY"]]
        diff = [c for c in compare if not (pd.isna(row[c]) and pd.isna(k[c])) and row[c] != k[c]]
        diff_txt.append("완전 중복" if not diff else "다른 값: " + ", ".join(diff))
    diff_s = pd.Series(diff_txt, index=removed.index)
    log.add("행수", "중복_완전", int((diff_s == "완전 중복").sum()))
    log.add("행수", "중복_값다름", int((diff_s != "완전 중복").sum()))
    log.issue("DUP_REMOVED", removed["LCNS_KEY"], "(제거된 행)",
              "SRC_ROW_NUM " + removed["SRC_ROW_NUM"].astype(str) + " / " + diff_s)
    out = df.loc[sorted(keep_idx)].reset_index(drop=True)
    return out, len(removed)


def attach_food_csv(df: pd.DataFrame, log: Log, problems: list[str]) -> pd.Series:
    """[A1] 일반음식점 CSV 의 LDONG_CD·UTMK 를 LCNS_KEY 로 붙인다. 원본코드 후보를 돌려준다."""
    csv, _ = read02(silver02("food_general_file"))
    csv = csv[["LCNS_KEY", "LDONG_CD", "UTMK_X_NUM", "UTMK_Y_NUM"]]
    same_keys = set(csv["LCNS_KEY"]) == set(df["LCNS_KEY"])
    one_to_one = not csv["LCNS_KEY"].duplicated().any()
    log.add("A1", "LCNS_KEY_집합_일치", same_keys)
    log.add("A1", "CSV_LCNS_KEY_유일", one_to_one)
    if not (same_keys and one_to_one):
        problems.append("A1: API·CSV LCNS_KEY 가 1:1 이 아님")
    m = df[["LCNS_KEY"]].merge(csv, on="LCNS_KEY", how="left")
    df["UTMK_X_NUM"] = m["UTMK_X_NUM"].values
    df["UTMK_Y_NUM"] = m["UTMK_Y_NUM"].values
    log.add("A1", "CSV_LDONG_CD_있음", int(m["LDONG_CD"].notna().sum()))
    return pd.Series(m["LDONG_CD"].values, index=df.index)


def quality_issues(df: pd.DataFrame, meta: R.Meta, dataset: str, log: Log) -> None:
    """[C4][C5][C6] 컬럼으로 두지 않는 품질 정보."""
    key = df["LCNS_KEY"]
    for col, code in [("BPLC_NM", "BRKN_NM"), ("JIBUN_ADDR", "BRKN_ADDR"), ("ROAD_ADDR", "BRKN_ADDR")]:
        hit = df[col].str.contains(R.FFFD, regex=False).fillna(False)
        log.issue(code, key[hit], col, df.loc[hit, col])
    collect = pd.Timestamp(meta.p("COLLECT_DT", dataset))
    future = df["CLSBIZ_DTM"] > collect
    log.issue("FUTURE_CLSBIZ", key[future], "CLSBIZ_DTM", df.loc[future, "CLSBIZ_DTM"].dt.strftime("%Y-%m-%d"))
    invalid = df["STD_ERR_TXT"].str.contains("CLSBIZ_DTM", regex=False).fillna(False)
    log.issue("INVALID_CLSBIZ", key[invalid], "CLSBIZ_DTM",
              "02 STD_ERR_TXT, " + df.loc[invalid, "SRC_FILE_NM"].str.split("/").str[-1] + ":" + df.loc[invalid, "SRC_ROW_NUM"].astype(str))
    log.add("C5", "CLSBIZ_DTM<LCNS_DTM", int((df["CLSBIZ_DTM"] < df["LCNS_DTM"]).sum()), "검사 규칙만")

    for row in meta.placeholder.itertuples():
        if row.match_type in ("eq", "regex") and row.column in df:
            col = df[row.column]
            if row.match_type == "eq" and pd.api.types.is_numeric_dtype(col):
                hit = (col == float(row.value)).fillna(False)
            else:
                text = col.astype("string")
                hit = ((text == row.value) if row.match_type == "eq" else text.str.match(row.value)).fillna(False)
            log.issue(row.issue_cd, key[hit], row.column, col[hit])
        elif row.match_type == "range_out" and {"TM_X_NUM", "TM_Y_NUM"} <= set(df.columns):
            x, y = df["TM_X_NUM"], df["TM_Y_NUM"]
            hit = x.notna() & y.notna() & ~(
                x.between(float(meta.p("SEOUL_TM_X_MIN")), float(meta.p("SEOUL_TM_X_MAX")))
                & y.between(float(meta.p("SEOUL_TM_Y_MIN")), float(meta.p("SEOUL_TM_Y_MAX"))))
            log.issue(row.issue_cd, key[hit], "TM_X_NUM/TM_Y_NUM",
                      x[hit].round(1).astype(str) + "," + y[hit].round(1).astype(str))


_STORE_CAFE: set | None = None


def store_cafe_places() -> set:
    """상가정보(서울) 업종 소분류 '카페' 의 (법정동, 번지) 집합 [E1] 대조용."""
    global _STORE_CAFE
    if _STORE_CAFE is None:
        f = [p for p in (SILVER_DIR / "store_info").glob("02_*.parquet") if "_서울_" in p.name][0]
        s = pd.read_parquet(f, columns=["INDUTY_SCLS_NM", "LDONG_CD", "LAND_SE_CD", "JIBUN_MAIN_NUM", "JIBUN_SUB_NUM"])
        s = s[(s["INDUTY_SCLS_NM"] == "카페") & s["LDONG_CD"].notna() & (s["JIBUN_MAIN_NUM"] > 0)]
        bunji = np.where(s["LAND_SE_CD"] == "2", "산", "") + s["JIBUN_MAIN_NUM"].astype(int).astype(str)
        sub = s["JIBUN_SUB_NUM"].fillna(0).astype(int)
        bunji = pd.Series(bunji, index=s.index).where(sub == 0, pd.Series(bunji, index=s.index) + "-" + sub.astype(str))
        _STORE_CAFE = set(zip(s["LDONG_CD"], bunji))
    return _STORE_CAFE


def cafe_log(df: pd.DataFrame, bunji: pd.Series, keyword_hits: dict, log: Log) -> None:
    """[E1] 카페 규칙 C 확인용 자동 기록: 상가정보 대조율, 키워드별 건수와 상위 상호."""
    places = store_cafe_places()
    open_now = (df["ANLS_TRD_STATE_CD"] == "영업") & df["ANLS_CLSBIZ_DTM"].isna() & df["LDONG_CD"].notna() & bunji.notna()
    loc = pd.Series(list(zip(df["LDONG_CD"], bunji)), index=df.index)
    for rule in ["카페A", "카페B", "카페C", "나머지"]:
        sel = open_now & (df["INDUTY_RULE_CD"] == rule)
        if sel.any():
            rate = loc[sel].isin(places).mean()
            log.add("카페_상가정보대조", rule, f"{rate:.3f}", f"현재 영업 중 {int(sel.sum())}곳 중 같은 법정동·번지에 상가정보 카페가 있는 비율")
    for kw, hit in keyword_hits.items():
        if hit.any():
            top = df.loc[hit, "BPLC_NM"].value_counts().head(5)
            log.add("카페_키워드", kw, int(hit.sum()), " / ".join(f"{k}({v})" for k, v in top.items()))


def clean_license(dataset: str, meta: R.Meta, table: dict, log: Log) -> tuple[dict, list[str]]:
    problems: list[str] = []
    src = silver02(dataset)
    df, schema02 = read02(src)
    rows02 = len(df)
    log.add("행수", "02", rows02)

    df, dup_removed = dedup(df, log)
    orig_code = attach_food_csv(df, log, problems) if dataset == "food_general" else None

    # [C1][C2]
    state, unmapped = R.map_state(df, meta)
    if len(unmapped):
        problems.append(f"조건5: 매핑표에 없는 상태 조합 {unmapped.values.tolist()}")
        return {"dataset": dataset, "silver02_file": relative(src), "rows_02": rows02}, problems
    for c in state:
        df[c] = state[c]
    log.counts("상태_조합", df["TRD_STATE_NM"] + "|" + df["DTL_TRD_STATE_NM"] + "→" + df["ANLS_TRD_STATE_CD"] + "/" + df["TRD_STATE_SRC_CD"])
    log.counts("출처_CLSBIZ_SRC_CD", df["CLSBIZ_SRC_CD"])
    late = (df["CLSBIZ_SRC_CD"].str.startswith("최종수정일자")) & (df["ANLS_CLSBIZ_DTM"] >= pd.Timestamp(meta.p("ANLS_BGN_DT")))
    log.add("C2", "대용폐업일_분석기간안", int(late.sum()), "개별 확인 대상 (LCNS_KEY: " + ", ".join(df.loc[late, "LCNS_KEY"].head(10)) + ")")

    # [C5]
    df["ABNRM_LCNS_DTM_YN"] = df["LCNS_DTM"] < pd.Timestamp(meta.p("ABNRM_LCNS_BEFORE_DT"))

    # [D]
    ld, mismatch = R.assign_ldong(df, table, meta, dataset, orig_code)
    df["LDONG_CD"] = ld["LDONG_CD"]
    df["LDONG_SRC_CD"] = ld["LDONG_SRC_CD"]
    df["OUT_SEOUL_ADDR_YN"] = ld["OUT_SEOUL_ADDR_YN"]
    bunji = ld["_BUNJI"]
    log.counts("출처_LDONG_SRC_CD", df["LDONG_SRC_CD"])
    log.issue("ADDR_MISMATCH", df.loc[mismatch, "LCNS_KEY"], "LDONG_CD",
              "지번 " + ld.loc[mismatch, "_JIBUN_CD"] + " / 도로명 " + ld.loc[mismatch, "_ROAD_CD"])
    if orig_code is not None:
        both = orig_code.notna() & ld["_JIBUN_CD"].notna()
        log.add("D1", "원본코드_지번_일치율", f"{(orig_code[both] == ld.loc[both, '_JIBUN_CD']).mean():.4f}", f"둘 다 있는 {int(both.sum())}건")
    since = df["ANLS_CLSBIZ_DTM"].isna() | (df["ANLS_CLSBIZ_DTM"] >= pd.Timestamp(meta.p("ANLS_BGN_DT")))
    log.add("D1", "2017이후영업_대상", int(since.sum()))
    log.add("D1", "2017이후영업_실패", int((since & df["LDONG_SRC_CD"].str.startswith("실패")).sum()))
    log.add("D1", "2017이후영업_지번만_성공률", f"{(since & df['LDONG_SRC_CD'].isin(['원본코드', '지번'])).sum() / since.sum():.4f}")
    log.add("D1", "2017이후영업_성공률", f"{(since & ~df['LDONG_SRC_CD'].str.startswith('실패')).sum() / since.sum():.4f}")
    log.add("D3", "서울밖_2017이후영업", int((since & df["OUT_SEOUL_ADDR_YN"]).sum()))

    # [E]
    if "UPTAE_NM" not in df:
        df["UPTAE_NM"] = None
    cls, abnrm, keyword_hits = R.classify(df, meta, dataset)
    if dataset == "pharmacy":
        df = df.drop(columns="UPTAE_NM")
    df["ANLS_INDUTY_CD"] = cls["ANLS_INDUTY_CD"]
    df["INDUTY_RULE_CD"] = cls["INDUTY_RULE_CD"]
    df["OUT_SCOPE_YN"] = df["ANLS_INDUTY_CD"] == "대상외"
    log.counts("업종_ANLS_INDUTY_CD", df["ANLS_INDUTY_CD"])
    log.counts("업종_INDUTY_RULE_CD", df["INDUTY_RULE_CD"])
    if abnrm.any():
        log.issue("ABNRM_UPTAE", df.loc[abnrm, "LCNS_KEY"], "UPTAE_NM", df.loc[abnrm, "UPTAE_NM"].fillna("(NULL)"))
    if dataset in ("food_general", "food_rest"):
        cafe_log(df, bunji, keyword_hits, log)

    # [C4][C5][C6]
    quality_issues(df, meta, dataset, log)

    # [F]
    end = df["ANLS_CLSBIZ_DTM"]
    d = pd.DataFrame({
        "LCNS_KEY": df["LCNS_KEY"], "NAME_KEY": R.name_key(df["BPLC_NM"]), "LCNS_DTM": df["LCNS_DTM"], "END": end,
        "LGOV_CD": df["LGOV_CD"], "TEL": R.valid_tel(df["SITE_TEL"], meta), "LDONG_CD": df["LDONG_CD"], "BUNJI": bunji,
        "JIBUN_KEY": R.jibun_key(df["JIBUN_ADDR"]),
    })
    links = R.find_links(d, int(meta.p("REPL_WINDOW_DAYS")), int(meta.p("MULTI_TENANT_MIN_RECORDS")))
    df["ANLS_LCNS_DTM"] = links.anls_lcns
    df["LCNS_SRC_CD"] = links.lcns_src
    df["MOVE_PRE_KEY"] = links.move_pre
    df["REPL_PRE_KEY"] = links.repl_pre
    df["REPL_TYPE_CD"] = links.repl_type
    for k, v in links.stats.items():
        log.add("연결", k, v)
    if links.issues:
        li = pd.DataFrame(links.issues).drop_duplicates()
        for code, g in li.groupby("issue_cd"):
            log.issue(code, g["rec_key"], "연결 후보", g["value"])

    # 연결 전후 분기 말 재고, 동·구 합계
    qe = R.quarter_ends(meta)
    before = R.stock(df["LCNS_DTM"], end, qe)
    after = R.stock(df["ANLS_LCNS_DTM"], end, qe)
    diff = before - after
    log.add("재고_연결전후", "2017Q1_차이", int(diff[0]), f"연결 전 {before[0]} → 후 {after[0]}")
    log.add("재고_연결전후", f"{qe[-1].year}Q{qe[-1].quarter}_차이", int(diff[-1]), f"연결 전 {before[-1]} → 후 {after[-1]}")
    log.add("재고_연결전후", "평균_차이", f"{diff.mean():.1f}")
    log.add("재고_연결전후", "최대_차이", int(diff.max()))
    in_scope = ~df["OUT_SCOPE_YN"]
    gu_total = R.stock(df.loc[in_scope, "ANLS_LCNS_DTM"], end[in_scope], qe[-1:])[0]
    dong_ok = in_scope & ~df["LDONG_SRC_CD"].str.startswith("실패")
    dong_total = R.stock(df.loc[dong_ok, "ANLS_LCNS_DTM"], end[dong_ok], qe[-1:])[0]
    log.add("재고_동구", f"{qe[-1].year}Q{qe[-1].quarter}_구합계", int(gu_total), "대상외 제외")
    log.add("재고_동구", f"{qe[-1].year}Q{qe[-1].quarter}_동합계", int(dong_total), f"차이 {int(gu_total - dong_total)} = 법정동 실패")
    for flag in ["ABNRM_LCNS_DTM_YN", "OUT_SEOUL_ADDR_YN", "OUT_SCOPE_YN"]:
        log.add("플래그", flag, int(df[flag].sum()))

    # 완료 조건 3·4·6
    for col in R.CODE_COLUMNS:
        bad = set(df[col].dropna()) - meta.codes(col)
        if bad:
            problems.append(f"조건3: {col} 코드표에 없는 값 {sorted(bad)}")
    if not (df["OUT_SEOUL_ADDR_YN"] == (df["LDONG_SRC_CD"] == "실패_서울밖")).all():
        problems.append("조건4: OUT_SEOUL_ADDR_YN ≠ (LDONG_SRC_CD = 실패_서울밖)")
    if not (df["OUT_SCOPE_YN"] == (df["ANLS_INDUTY_CD"] == "대상외")).all():
        problems.append("조건4: OUT_SCOPE_YN ≠ (ANLS_INDUTY_CD = 대상외)")
    if df["ANLS_INDUTY_CD"].isna().any():
        problems.append(f"분류 안 된 행 {int(df['ANLS_INDUTY_CD'].isna().sum())}건")
    problems += [f"조건6: {p}" for p in R.check_links(df)]

    # 쓰기
    out = SILVER_DIR / dataset / stage_file_name(IDX, dataset)
    status, sha, rows_written = write_parquet(df, schema02, out)
    rows_parquet = pq.ParquetFile(out).metadata.num_rows
    row_ok = rows_written == rows_parquet == rows02 - dup_removed
    if not row_ok:
        problems.append(f"조건2: 03 행 {rows_parquet} ≠ 02 행 {rows02} − 중복 {dup_removed}")
    log.add("행수", "03", rows_parquet)
    print(f"[03] {dataset}: 02 {rows02:,} → 03 {rows_parquet:,} (중복 제거 {dup_removed}, {status})")
    return {
        "dataset": dataset, "silver02_file": relative(src), "silver03_file": relative(out), "rows_02": rows02,
        "dup_removed": dup_removed, "rows_03_written": rows_written, "rows_03_parquet": rows_parquet, "row_check": row_ok,
        "columns_count": len(df.columns), "file_sha256": sha, "status": status,
    }, problems


def write_parquet(df: pd.DataFrame, schema02: pa.Schema, out: Path, new_columns: list[str] | None = None) -> tuple[str, str, int]:
    """02 컬럼 순서·타입 유지 + 새 컬럼. 내용이 같으면 기존 파일을 그대로 둔다."""
    new_columns = R.NEW_COLUMNS if new_columns is None else new_columns
    base = [f for f in schema02 if f.name in df.columns and f.name not in new_columns]
    extra = [c for c in ["UTMK_X_NUM", "UTMK_Y_NUM"] if c in df.columns] + new_columns
    fields = base + [pa.field(c, NEW_TYPES.get(c, pa.string())) for c in extra]
    arrays = []
    for f in fields:
        s = df[f.name]
        if pa.types.is_date32(f.type) or pa.types.is_timestamp(f.type):
            arr = pa.Array.from_pandas(pd.to_datetime(s)).cast(f.type, safe=False)
        elif pa.types.is_string(f.type):
            try:      # 값이 모두 문자열·결측이면 바로 변환 (실거래가 수백만 행)
                arr = pa.array(s, type=pa.string(), from_pandas=True)
            except (pa.ArrowTypeError, pa.ArrowInvalid):
                arr = pa.array([None if pd.isna(v) else str(v) for v in s], type=pa.string())
        else:
            arr = pa.Array.from_pandas(s, type=f.type)
        arrays.append(arr)
    table = pa.Table.from_arrays(arrays, schema=pa.schema(fields))
    out.parent.mkdir(parents=True, exist_ok=True)
    temp = out.with_name(out.name + ".tmp")
    pq.write_table(table, temp, compression=COMPRESSION, row_group_size=ROW_GROUP)
    status, sha = replace_if_changed(temp, out)
    return status, sha, table.num_rows


# ──────────────────────────────────────────────────────────────
# 실거래가 매매 [G1]·[G2]·[G5]
# ──────────────────────────────────────────────────────────────
def clean_trade(meta: R.Meta, ldong: pd.DataFrame, log: Log) -> tuple[dict, list[str]]:
    """실거래가 매매 03: 행은 그대로(해제 포함), LDONG_CD 를 현행 코드표에 맞추고 [G5], 동일 조건 거래 플래그 [G2]."""
    ds = "apt_trade"
    src = silver02(ds)
    df, schema02 = read02(src)
    rows02 = len(df)
    problems: list[str] = []
    seoul = df["SGG_CD"].str.startswith(meta.p("SEOUL_SGG_PREFIX", ds))
    rec_key = df["SRC_FILE_NM"].str.split("/").str[-1] + ":" + df["SRC_ROW_NUM"].astype(str)

    # [G5] 법정동: 현행 코드 → 그대로 / 아니면 SGG_CD + UMD_NM / 못 찾으면 NULL (구 코드 SGG_CD 는 남음)
    current = set(ldong.loc[~ldong["ABL_YN"].astype(bool), "LDONG_CD"])
    code, ldsrc = R.trade_ldong(df, current, R.sgg_umd_lookup(ldong))
    changed = df["LDONG_CD"].ne(code) | code.isna()
    log.counts("LDONG_SRC_CD", ldsrc)
    log.counts("LDONG_SRC_CD_서울", ldsrc[seoul], "SGG_CD 앞 2자리 11")
    log.issue("LDONG_NOT_CURRENT", rec_key[changed], "LDONG_CD",
              df.loc[changed, "LDONG_CD"] + " → " + code[changed].fillna("(NULL)") + " / " + ldsrc[changed]
              + " / SGG_CD " + df.loc[changed, "SGG_CD"] + " UMD_NM " + df.loc[changed, "UMD_NM"].fillna(""))
    df["LDONG_CD"] = code
    df["LDONG_SRC_CD"] = ldsrc

    # [G2] 동일 조건 거래: 플래그는 82개 시군구 전체, 묶음 목록(issue_list)은 기존대로 서울만
    grp = R.same_deal(df)
    df["SAME_DEAL_YN"] = grp.notna()
    key6 = R.TRADE_SAME_DEAL_KEY[:-1]
    log.add("G2", "서울_매매", int(seoul.sum()))
    log.add("G2", "키6_겹치는행", int(df[seoul].duplicated(key6, keep=False).sum()), "서울, 해제 포함")
    log.add("G2", "SAME_DEAL_YN", int(df["SAME_DEAL_YN"].sum()), "82개 시군구 전체")
    log.add("G2", "키7_해제제외_겹치는행", int(df.loc[seoul, "SAME_DEAL_YN"].sum()), "서울, issue_list SAME_DEAL")
    s_grp = grp[seoul].dropna()
    s_grp = (s_grp.rank(method="dense").astype(int))            # 서울 안에서 묶음 번호 1부터
    log.issue("SAME_DEAL", rec_key[s_grp.index], "묶음", "묶음 " + s_grp.astype(str))
    log.add("G1", "CNCL_YN", int(df["CNCL_YN"].fillna(False).astype(bool).sum()), "행 유지, 골드 가격·거래 수에서 제외")

    # [G6] 단가 이상값: ㎡당 금액이 기준 미만 (값 유지, 플래그 없음). 서울만 issue_list
    unit = df["DEAL_AMT_NUM"] / df["EXCL_AREA_NUM"]
    low = seoul & (unit < float(meta.p("ABNRM_UNIT_AMT_MIN", ds)))
    log.add("G6", "서울_단가기준미만", int(low.sum()), "값 유지, issue_list ABNRM_UNIT_AMT")
    log.add("G6", "서울_단가기준미만_2017이후", int((low & (df["DEAL_DTM"] >= pd.Timestamp(meta.p("ANLS_BGN_DT")))).sum()))
    log.issue("ABNRM_UNIT_AMT", rec_key[low], "DEAL_AMT_NUM/EXCL_AREA_NUM",
              unit[low].round(0).astype("int64").astype(str) + "원/㎡ (" + df.loc[low, "DEAL_AMT_NUM"].astype("int64").astype(str)
              + "원 / " + df.loc[low, "EXCL_AREA_NUM"].astype(str) + "㎡)")

    # 검사: 조건 3 (코드표), [G5] 결과 형식
    if bad := set(ldsrc) - meta.codes("LDONG_SRC_CD"):
        problems.append(f"조건3: 코드표에 없는 LDONG_SRC_CD {sorted(bad)}")
    if (code.notna() & ~code.isin(current)).any():
        problems.append("G5: 현행 코드표에 없는 LDONG_CD 가 남음")
    if not (code.isna() == (ldsrc == "실패")).all():
        problems.append("G5: LDONG_CD NULL 과 LDONG_SRC_CD = 실패 가 일치하지 않음")
    if df["SGG_CD"].isna().any():
        problems.append("G5: SGG_CD 가 빈 행이 있음")

    out = SILVER_DIR / ds / f"03_silver__{ds}.parquet"
    status, sha, rows_parquet = write_parquet(df, schema02, out, R.TRADE_NEW_COLUMNS)
    row_ok = rows02 == len(df) == rows_parquet
    if not row_ok:
        problems.append(f"조건2: 행 수 02 {rows02} / 03 {rows_parquet}")
    print(f"[03] {ds}: {rows02:,}행 → {relative(out)} ({status}) | LDONG 고침 {int(changed.sum())}행, "
          f"SAME_DEAL_YN {int(df['SAME_DEAL_YN'].sum()):,}행")
    return {"dataset": ds, "silver02_file": relative(src), "silver03_file": relative(out), "rows_02": rows02,
            "dup_removed": 0, "rows_03_written": len(df), "rows_03_parquet": rows_parquet, "row_check": row_ok,
            "columns_count": len(df.columns), "file_sha256": sha, "status": status}, problems


# ──────────────────────────────────────────────────────────────
# 실거래가 전월세 [G3]·[G4]·[G5]
# ──────────────────────────────────────────────────────────────
def clean_rent(meta: R.Meta, ldong: pd.DataFrame, log: Log) -> tuple[dict, list[str]]:
    """실거래가 전월세 03: 02 컬럼은 그대로(행 수 800만이라 Arrow 테이블에 새 컬럼만 붙임), LDONG_CD 를 SGG_CD + UMD_NM 으로 부여 [G5].
    동일 조건 거래는 행 목록 없이 change_log 건수만 남긴다 (결정 2026-11-20). 전세·월세 구분은 골드에서 [G3]."""
    ds = "apt_rent"
    src = silver02(ds)
    table = pq.read_table(src)
    rows02 = table.num_rows
    problems: list[str] = []
    df = table.select(["SGG_CD", "UMD_NM", "APT_KEY", "DEAL_DTM", "EXCL_AREA_NUM", "FLR_NUM", "DPST_AMT_NUM",
                       "MTHLY_RENT_AMT_NUM", "CNTRCT_SE_NM", "STD_ERR_TXT", "SRC_FILE_NM", "SRC_ROW_NUM"]).to_pandas()
    seoul = df["SGG_CD"].str.startswith(meta.p("SEOUL_SGG_PREFIX", ds))

    # [G5] 법정동: 02 에 LDONG_CD 가 없으므로 모두 SGG_CD + UMD_NM 으로 찾는다. 못 찾으면 NULL (SGG_CD 는 남음)
    current = set(ldong.loc[~ldong["ABL_YN"].astype(bool), "LDONG_CD"])
    combos = df[["SGG_CD", "UMD_NM"]].drop_duplicates()
    code_c, src_c = R.trade_ldong(combos.assign(LDONG_CD=None), current, R.sgg_umd_lookup(ldong))
    combos = combos.assign(LDONG_CD=code_c.values, LDONG_SRC_CD=src_c.values)
    m = df[["SGG_CD", "UMD_NM"]].merge(combos, on=["SGG_CD", "UMD_NM"], how="left")
    df["LDONG_CD"], df["LDONG_SRC_CD"] = m["LDONG_CD"].values, m["LDONG_SRC_CD"].values
    log.counts("LDONG_SRC_CD", df["LDONG_SRC_CD"])
    log.counts("LDONG_SRC_CD_서울", df.loc[seoul, "LDONG_SRC_CD"], "SGG_CD 앞 2자리 11")
    fail = df["LDONG_SRC_CD"] == "실패"
    log.issue("LDONG_NOT_CURRENT", df.loc[fail, "SRC_FILE_NM"].str.split("/").str[-1] + ":" + df.loc[fail, "SRC_ROW_NUM"].astype(str),
              "LDONG_CD", "(없음) → (NULL) / 실패 / SGG_CD " + df.loc[fail, "SGG_CD"] + " UMD_NM " + df.loc[fail, "UMD_NM"].fillna(""))

    # 건수만 기록 (행·컬럼은 그대로)
    key = ["LDONG_CD", "APT_KEY", "DEAL_DTM", "EXCL_AREA_NUM", "FLR_NUM", "DPST_AMT_NUM", "MTHLY_RENT_AMT_NUM"]
    log.add("G3", "서울_전월세", int(seoul.sum()))
    log.add("G3", "서울_전세", int((seoul & (df["MTHLY_RENT_AMT_NUM"] == 0)).sum()), "MTHLY_RENT_AMT_NUM = 0, 골드에서 구분")
    log.add("G3", "서울_월세", int((seoul & (df["MTHLY_RENT_AMT_NUM"] > 0)).sum()))
    log.add("G3", "서울_보증금0", int((seoul & (df["DPST_AMT_NUM"] == 0)).sum()), "보증금 없는 월세, 값 유지")
    log.add("G3", "서울_CNTRCT_SE_NM_있음", int((seoul & df["CNTRCT_SE_NM"].notna()).sum()), "신규/갱신, 2021년 이후만 값 있음")
    log.add("동일조건", "키7_겹치는행", int(df.duplicated(key, keep=False).sum()), "82개 시군구 전체, 행 목록 없음")
    log.add("동일조건", "키7_겹치는행_서울", int(df[seoul].duplicated(key, keep=False).sum()), "동·호 정보가 없어 정상 계약일 수 있음")
    log.add("G4", "CNTRCT_BGN_DTM_변환실패", int(df["STD_ERR_TXT"].fillna("").str.contains("CNTRCT_BGN_DTM").sum()), "02 STD_ERR_TXT, NULL 유지")

    if bad := set(df["LDONG_SRC_CD"]) - meta.codes("LDONG_SRC_CD"):
        problems.append(f"조건3: 코드표에 없는 LDONG_SRC_CD {sorted(bad)}")
    if (df["LDONG_CD"].notna() & ~df["LDONG_CD"].isin(current)).any():
        problems.append("G5: 현행 코드표에 없는 LDONG_CD 가 남음")
    if not (df["LDONG_CD"].isna() == fail).all():
        problems.append("G5: LDONG_CD NULL 과 LDONG_SRC_CD = 실패 가 일치하지 않음")
    if df["SGG_CD"].isna().any():
        problems.append("G5: SGG_CD 가 빈 행이 있음")

    for c in R.RENT_NEW_COLUMNS:
        table = table.append_column(pa.field(c, pa.string()), pa.array(df[c], type=pa.string(), from_pandas=True))
    out = SILVER_DIR / ds / f"03_silver__{ds}.parquet"
    out.parent.mkdir(parents=True, exist_ok=True)
    temp = out.with_name(out.name + ".tmp")
    pq.write_table(table, temp, compression=COMPRESSION, row_group_size=ROW_GROUP)
    status, sha = replace_if_changed(temp, out)
    row_ok = rows02 == table.num_rows
    if not row_ok:
        problems.append(f"조건2: 행 수 02 {rows02} / 03 {table.num_rows}")
    print(f"[03] {ds}: {rows02:,}행 → {relative(out)} ({status}) | 법정동 실패 {int(fail.sum())}행")
    return {"dataset": ds, "silver02_file": relative(src), "silver03_file": relative(out), "rows_02": rows02,
            "dup_removed": 0, "rows_03_written": table.num_rows, "rows_03_parquet": table.num_rows, "row_check": row_ok,
            "columns_count": table.num_columns, "file_sha256": sha, "status": status}, problems


# ──────────────────────────────────────────────────────────────
# 심평원 병의원·약국 [H0]·[H1]·[H2]
# ──────────────────────────────────────────────────────────────
def clean_hira(meta: R.Meta, ldong: pd.DataFrame, log: Log) -> tuple[dict, list[str]]:
    """심평원 03: 병원정보 + 약국정보를 기관 파일 하나로 합침 [H0] (약국 행의 의사 수 컬럼은 NULL).
    전국 유지. 법정 시군구 SGG_CD 와 법정동 LDONG_CD 를 붙인다 [H1]. 보건소 등·이상 개설일은 issue_list 만 (서울) [H2]."""
    ds = "hira_inst"
    files = hira02()
    tables = [pq.read_table(f) for f in files]
    schema02 = tables[0].schema
    for f, t in zip(files[1:], tables[1:]):      # 병원 스키마 기준으로 합치므로, 약국에만 있는 컬럼은 빠진다 → 쓰기 전에 중단
        if extra := [c for c in t.schema.names if c not in schema02.names]:
            raise ValueError(f"H0: {f.name} 에만 있는 컬럼 {extra} (병원 스키마 기준으로 합치면 빠짐)")
    problems: list[str] = []
    df = pd.concat([t.to_pandas(date_as_object=False) for t in tables], ignore_index=True)[schema02.names]
    rows02 = sum(t.num_rows for t in tables)
    for f, t in zip(files, tables):
        log.add("H0", f.name.split("__")[-1].replace(".parquet", ""), t.num_rows, "03 에 합친 02 파일")
    if df["MED_INST_KEY"].duplicated().any():
        problems.append("H0: 병원·약국 합친 뒤 MED_INST_KEY 중복")

    # [H1] 시군구: 도로명 주소의 정식 이름 / 법정동: UMD_NM → 도로명 괄호 동명 → 정규화 → 실패(NULL)
    df["SGG_CD"] = R.sgg_by_addr(df["ROAD_ADDR"], ldong)
    code, ldsrc, by_road = R.hira_ldong(df["SGG_CD"], df["UMD_NM"], df["ROAD_ADDR"], R.sgg_umd_lookup(ldong))
    df["LDONG_CD"], df["LDONG_SRC_CD"] = code, ldsrc
    seoul = df["HIRA_SIDO_NM"] == "서울"
    log.add("H1", "SGG_CD_실패", int(df["SGG_CD"].isna().sum()), "도로명 주소가 옛 시도 이름")
    log.add("H1", "SGG_CD_실패_서울", int(df.loc[seoul, "SGG_CD"].isna().sum()))
    log.counts("LDONG_SRC_CD", ldsrc)
    log.counts("LDONG_SRC_CD_서울", ldsrc[seoul], "HIRA_SIDO_NM = 서울")
    mismatch = seoul & code.notna() & by_road.notna() & (code != by_road)
    log.issue("ADDR_MISMATCH", df.loc[mismatch, "MED_INST_KEY"], "LDONG_CD",
              "동명 " + code[mismatch] + " / 도로명 " + by_road[mismatch])

    # [H2] 집계 영향 없는 품질 정보 (서울만 issue_list, 전국은 건수)
    out_scope = df["INST_TYPE_NM"].isin(["보건소", "보건지소", "조산원"])
    abnrm = df["ESTB_DTM"] < pd.Timestamp(meta.p("ABNRM_LCNS_BEFORE_DT"))
    log.add("H2", "보건소·보건지소·조산원", int(out_scope.sum()), "전국, 값 유지")
    log.add("H2", "개설일_1950이전", int(abnrm.sum()), "전국, 값 유지")
    log.issue("OUT_SCOPE_INST", df.loc[seoul & out_scope, "MED_INST_KEY"], "INST_TYPE_NM", df.loc[seoul & out_scope, "INST_TYPE_NM"])
    log.issue("ABNRM_ESTB", df.loc[seoul & abnrm, "MED_INST_KEY"], "ESTB_DTM",
              pd.to_datetime(df.loc[seoul & abnrm, "ESTB_DTM"]).dt.strftime("%Y-%m-%d"))
    log.counts("서울_기관종류", df.loc[seoul, "INST_TYPE_NM"])

    if bad := set(ldsrc) - meta.codes("LDONG_SRC_CD"):
        problems.append(f"조건3: 코드표에 없는 LDONG_SRC_CD {sorted(bad)}")
    current = set(ldong.loc[~ldong["ABL_YN"].astype(bool), "LDONG_CD"])
    if (code.notna() & ~code.isin(current)).any():
        problems.append("H1: 현행 코드표에 없는 LDONG_CD 가 남음")
    if not (code.isna() == (ldsrc == "실패")).all():
        problems.append("H1: LDONG_CD NULL 과 LDONG_SRC_CD = 실패 가 일치하지 않음")
    if (code.notna() & (code.str[:5] != df["SGG_CD"])).any():
        problems.append("H1: LDONG_CD 앞 5자리 ≠ SGG_CD")
    if df.loc[seoul, "SGG_CD"].isna().any() or (seoul & ~df["SGG_CD"].fillna("").str.startswith("11")).any():
        problems.append("H1: 서울 기관의 SGG_CD 가 비었거나 11 로 시작하지 않음")

    out = SILVER_DIR / ds / f"03_silver__{ds}.parquet"
    status, sha, rows_parquet = write_parquet(df, schema02, out, R.HIRA_NEW_COLUMNS)
    row_ok = rows02 == len(df) == rows_parquet
    if not row_ok:
        problems.append(f"조건2: 행 수 02 {rows02} / 03 {rows_parquet}")
    print(f"[03] {ds}: 02 {len(files)}개 {rows02:,}행 → {relative(out)} ({status}) | 법정동 실패 {int(code.isna().sum())} "
          f"(서울 {int((seoul & code.isna()).sum())})")
    return {"dataset": ds, "silver02_file": ";".join(relative(f) for f in files), "silver03_file": relative(out),
            "rows_02": rows02, "dup_removed": 0, "rows_03_written": len(df), "rows_03_parquet": rows_parquet,
            "row_check": row_ok, "columns_count": len(df.columns), "file_sha256": sha, "status": status}, problems

# ──────────────────────────────────────────────────────────────
# 상가(상권)정보 [S0]·[S1]·[S2]
# ──────────────────────────────────────────────────────────────
def store02() -> list[Path]:
    """상가정보 02 시도별 파일 (파일 이름 순) [S0]."""
    files = sorted((SILVER_DIR / "store_info").glob("02_silver__store_info__*.parquet"))
    if not files:
        raise FileNotFoundError("store_info: 02 silver 파일이 없음. 02 단계를 먼저 실행하세요")
    return files


def clean_store(meta: R.Meta, ldong: pd.DataFrame, log: Log) -> tuple[dict, list[str]]:
    """상가정보 03: 시도별 02 파일을 하나로 합침 (전국 유지, 02 컬럼 그대로) [S0].
    LDONG_CD 가 현행 코드표에 없으면 SGG_CD + LDONG_NM 으로 다시 찾고, 못 찾으면 NULL (SGG_CD 유지) [S1].
    층 변환 실패(FLR_NUM)는 02 STD_ERR_TXT 에 있으므로 건수만 [S2]."""
    ds = "store_info"
    files = store02()
    if len(files) != (n_expect := int(meta.p("STORE_SIDO_FILE_CNT", ds))):
        raise FileNotFoundError(f"store_info: 02 시도별 파일이 {len(files)}개 ({n_expect}개여야 함). 02 단계를 먼저 실행하세요")
    tables = [pq.read_table(f) for f in files]
    problems: list[str] = []
    schema02 = tables[0].schema
    for f, t in zip(files[1:], tables[1:]):      # concat_tables 는 스키마가 다르면 이유 없이 실패하므로 먼저 알린다
        if not t.schema.equals(schema02):
            diff = sorted(set(t.schema.names) ^ set(schema02.names)) or "컬럼 타입·순서"
            raise ValueError(f"S0: {f.name} 의 스키마가 {files[0].name} 과 다름 ({diff})")
    table = pa.concat_tables(tables)
    rows02 = sum(t.num_rows for t in tables)
    for f, t in zip(files, tables):
        log.add("S0", f.name.split("__")[-1].replace(".parquet", ""), t.num_rows, "03 에 합친 02 파일")
    df = table.select(["STORE_KEY", "SGG_CD", "LDONG_CD", "LDONG_NM", "STD_ERR_TXT"]).to_pandas()
    if df["STORE_KEY"].duplicated().any():
        problems.append("S0: 시도별 파일을 합친 뒤 STORE_KEY 중복")
    seoul = df["SGG_CD"].str.startswith(meta.p("SEOUL_SGG_PREFIX", ds))

    # [S1] 법정동: 현행 코드면 그대로, 아니면 SGG_CD + LDONG_NM 재조회, 못 찾으면 NULL
    current = set(ldong.loc[~ldong["ABL_YN"].astype(bool), "LDONG_CD"])
    code, src = R.trade_ldong(df.rename(columns={"LDONG_NM": "UMD_NM"}), current, R.sgg_umd_lookup(ldong))
    changed = code.ne(df["LDONG_CD"]).fillna(True) & df["LDONG_CD"].notna()
    log.counts("LDONG_SRC_CD", src)
    log.counts("LDONG_SRC_CD_서울", src[seoul], "SGG_CD 앞 2자리 11")
    log.add("S1", "SGG_CD_LDONG_CD앞5자리_다름", int((df["SGG_CD"] != df["LDONG_CD"].str[:5]).sum()), "값 유지 (원천 그대로)")
    log.add("S1", "SGG_CD_LDONG_CD앞5자리_다름_서울", int((seoul & (df["SGG_CD"] != df["LDONG_CD"].str[:5])).sum()))
    log.issue("LDONG_NOT_CURRENT", df.loc[changed, "STORE_KEY"], "LDONG_CD",
              df.loc[changed, "LDONG_CD"] + " → " + code[changed].fillna("(NULL)") + " / " + src[changed]
              + " / SGG_CD " + df.loc[changed, "SGG_CD"] + " LDONG_NM " + df.loc[changed, "LDONG_NM"].fillna(""))

    # [S2] 02 에서 넘어온 층 변환 실패 (NULL 유지)
    flr_fail = df["STD_ERR_TXT"].fillna("").str.contains("FLR_NUM")
    log.add("S2", "FLR_NUM_변환실패", int(flr_fail.sum()), "02 STD_ERR_TXT, NULL 유지 (원문 FLR_INFO_TXT)")
    log.add("S2", "FLR_NUM_변환실패_서울", int((seoul & flr_fail).sum()))
    log.add("S0", "서울_업소", int(seoul.sum()), "SGG_CD 앞 2자리 11, 골드에서 거름")

    fail = src == "실패"
    if bad := set(src) - meta.codes("LDONG_SRC_CD"):
        problems.append(f"조건3: 코드표에 없는 LDONG_SRC_CD {sorted(bad)}")
    if (code.notna() & ~code.isin(current)).any():
        problems.append("S1: 현행 코드표에 없는 LDONG_CD 가 남음")
    if not (code.isna() == fail).all():
        problems.append("S1: LDONG_CD NULL 과 LDONG_SRC_CD = 실패 가 일치하지 않음")
    if df["SGG_CD"].isna().any():
        problems.append("S1: SGG_CD 가 빈 행이 있음")

    i = table.schema.get_field_index("LDONG_CD")
    table = table.set_column(i, table.schema.field(i), pa.array(code, type=pa.string(), from_pandas=True))
    for c in R.STORE_NEW_COLUMNS:
        table = table.append_column(pa.field(c, pa.string()), pa.array(src, type=pa.string(), from_pandas=True))
    out = SILVER_DIR / ds / f"03_silver__{ds}.parquet"
    temp = out.with_name(out.name + ".tmp")
    pq.write_table(table, temp, compression=COMPRESSION, row_group_size=ROW_GROUP)
    status, sha = replace_if_changed(temp, out)
    row_ok = rows02 == table.num_rows
    if not row_ok:
        problems.append(f"조건2: 행 수 02 {rows02} / 03 {table.num_rows}")
    print(f"[03] {ds}: {len(files)}개 파일 {rows02:,}행 → {relative(out)} ({status}) | 법정동 실패 {int(fail.sum())}행")
    return {"dataset": ds, "silver02_file": ";".join(relative(f) for f in files), "silver03_file": relative(out),
            "rows_02": rows02, "dup_removed": 0, "rows_03_written": table.num_rows, "rows_03_parquet": table.num_rows,
            "row_check": row_ok, "columns_count": table.num_columns, "file_sha256": sha, "status": status}, problems

# ──────────────────────────────────────────────────────────────
# 법정동코드 [L0]·[L1]
# ──────────────────────────────────────────────────────────────
def clean_ldong(meta: R.Meta, ldong: pd.DataFrame, log: Log) -> tuple[dict, list[str]]:
    """법정동코드 03 (골드 dim_region 원천): 전국·폐지 포함 모든 행 유지, 02 컬럼 그대로 [L0].
    구분·시도·시군구·읍면동·리 계층 컬럼을 붙인다 [L1]. 다른 03 단계는 지금처럼 02 코드표를 읽는다."""
    ds = "ldong_code"
    src = silver02(ds)
    df, schema02 = read02(src)
    problems: list[str] = []
    if df["LDONG_CD"].duplicated().any():
        problems.append("L0: LDONG_CD 중복")
    if (df["LDONG_CD"].str.len() != 10).any():
        problems.append("L0: 10자리가 아닌 LDONG_CD")
    h = R.ldong_hierarchy(df)
    df = pd.concat([df, h], axis=1)
    seoul = df["SIDO_CD"] == meta.p("SEOUL_SGG_PREFIX", ds)
    cur = ~df["ABL_YN"].astype(bool)

    for se in ["시도", "시군구", "읍면동", "리"]:
        sel = df["LDONG_SE_CD"] == se
        log.add("L1", f"{se}_현행", int((sel & cur).sum()), "ABL_YN = False")
        log.add("L1", f"{se}_폐지", int((sel & ~cur).sum()), "ABL_YN = True, 행 유지")
        log.add("L1", f"서울_{se}_현행", int((sel & cur & seoul).sum()))
        log.add("L1", f"서울_{se}_폐지", int((sel & ~cur & seoul).sum()))
    log.add("L1", "서울_현행", int((cur & seoul).sum()), "다른 데이터셋 법정동 기준 (시도·구 행 포함)")
    log.add("L1", "SGG_NM_없음_시군구이하", int((df["SGG_CD"].notna() & df["SGG_NM"].isna()).sum()), "세종 등 시군구가 없는 시도")

    # 계층 이름 검사: 이름을 이어 붙이면 원래 LDONG_NM 과 같아야 한다
    parts = df[["SIDO_NM", "SGG_NM", "UMD_NM", "RI_NM"]]
    joined = parts.apply(lambda r: " ".join(v for v in r if isinstance(v, str)), axis=1)
    if n := int((joined != df["LDONG_NM"].str.split().str.join(" ")).sum()):
        problems.append(f"L1: 계층 이름을 이어 붙인 값이 LDONG_NM 과 다른 행 {n}")
    if bad := set(df["LDONG_SE_CD"]) - meta.codes("LDONG_SE_CD"):
        problems.append(f"조건3: 코드표에 없는 LDONG_SE_CD {sorted(bad)}")
    if (df.loc[df["LDONG_SE_CD"].isin(["읍면동", "리"]), "UMD_NM"].isna()).any():
        problems.append("L1: 읍면동·리 행인데 UMD_NM 이 빈 행이 있음")

    out = SILVER_DIR / ds / f"03_silver__{ds}.parquet"
    status, sha, n_written = write_parquet(df, schema02, out, new_columns=R.LDONG_NEW_COLUMNS)
    rows02 = pq.read_metadata(src).num_rows
    row_ok = rows02 == n_written
    if not row_ok:
        problems.append(f"조건2: 행 수 02 {rows02} / 03 {n_written}")
    print(f"[03] {ds}: {rows02:,}행 → {relative(out)} ({status}) | 서울 현행 {int((cur & seoul).sum())}")
    return {"dataset": ds, "silver02_file": relative(src), "silver03_file": relative(out), "rows_02": rows02,
            "dup_removed": 0, "rows_03_written": n_written, "rows_03_parquet": n_written, "row_check": row_ok,
            "columns_count": len(schema02) + len(R.LDONG_NEW_COLUMNS), "file_sha256": sha, "status": status}, problems


# ──────────────────────────────────────────────────────────────
# 실행
# ──────────────────────────────────────────────────────────────
def snapshot02() -> dict[str, str]:
    return snapshot_files(SILVER_DIR.rglob("02_silver__*.parquet"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dataset", nargs="*", choices=ALL_DATASETS, help="처리할 데이터셋 (기본: 전부)")
    parser.add_argument("--check", action="store_true", help="metadata 검사만 하고 파일은 쓰지 않음")
    args = parser.parse_args()
    started = now_kst()
    datasets = args.dataset or ALL_DATASETS

    # 1. 사전 검사
    meta = R.load_meta(METADATA_DIR)
    problems = R.check_meta(meta)
    try:
        for ds in datasets + (["food_general_file"] if "food_general" in datasets else []) + ["ldong_code"]:
            silver02(ds)
    except FileNotFoundError as exc:
        problems.append(str(exc))
    if problems:
        print("[03] 사전 검사 실패 — 아무 파일도 쓰지 않았습니다:\n  " + "\n  ".join(problems))
        return 1
    print(f"[03] 사전 검사 통과: cln_* 8개 파일, 데이터셋 {len(datasets)}개")
    if args.check:
        return 0

    # 2. 정제
    before = snapshot02()
    ldong, _ = read02(silver02("ldong_code"))
    table = R.ldong_lookup(ldong)
    records, logs, fails = [], [], {}
    for ds in datasets:
        log = Log(ds)
        if ds == "apt_trade":
            rec, probs = clean_trade(meta, ldong, log)
        elif ds == "apt_rent":
            rec, probs = clean_rent(meta, ldong, log)
        elif ds == "hira_inst":
            rec, probs = clean_hira(meta, ldong, log)
        elif ds == "store_info":
            rec, probs = clean_store(meta, ldong, log)
        elif ds == "ldong_code":
            rec, probs = clean_ldong(meta, ldong, log)
        else:
            rec, probs = clean_license(ds, meta, table, log)
        records.append(rec)
        logs.append(log)
        fails[ds] = probs
    unchanged02 = snapshot02() == before

    # 3. 기록
    issue_run = pd.concat([l.issue_frame() for l in logs], ignore_index=True)
    issue_run = issue_run.sort_values(["dataset", "issue_cd", "rec_key", "column", "value"], kind="stable").reset_index(drop=True)
    for l in logs:
        mine = issue_run[issue_run["dataset"] == l.dataset]
        for code, cnt in mine["issue_cd"].value_counts().sort_index().items():
            l.add("이슈", code, int(cnt))
    change_run = pd.DataFrame([r for l in logs for r in l.rows])

    bad_issue = set(issue_run["issue_cd"]) - meta.codes("ISSUE_CD")
    for ds in datasets:
        if bad_issue & set(issue_run.loc[issue_run["dataset"] == ds, "issue_cd"]):
            fails[ds].append(f"조건3: 코드표에 없는 issue_cd {sorted(bad_issue)}")
        if not unchanged02:
            fails[ds].append("조건1: 02 silver 파일이 바뀜")
    manifest_run = pd.DataFrame(records)
    manifest_run["cond_fail_txt"] = manifest_run["dataset"].map(lambda d: " | ".join(fails[d]))
    manifest_run["cond_ok"] = manifest_run["cond_fail_txt"] == ""

    paths = {name: REPORT_SILVER_DIR / stage_file_name(IDX, name, ext="csv") for name in ["manifest", "change_log", "issue_list"]}
    frames = {"manifest": manifest_run, "change_log": change_run, "issue_list": issue_run}
    if args.dataset:
        frames = {k: merge_dataset_rows(paths[k], v, datasets) for k, v in frames.items()}
    for k, v in frames.items():
        write_csv(paths[k], v)

    # 조건 7: 써진 issue_list 건수 = change_log 이슈별 건수
    il = pd.read_csv(paths["issue_list"], dtype=str, keep_default_na=False, encoding="utf-8-sig")
    cl = pd.read_csv(paths["change_log"], dtype=str, keep_default_na=False, encoding="utf-8-sig")
    a = il.groupby(["dataset", "issue_cd"]).size().astype(int).sort_index()
    b = cl[cl["section"] == "이슈"].set_index(["dataset", "item"])["value"].astype(int).sort_index()
    b.index.names = a.index.names
    cond7 = all(p.exists() for p in paths.values()) and a.equals(b)

    # 4. 결과
    ok = all(not fails[d] for d in datasets) and cond7
    unchanged = int((manifest_run["status"] == "unchanged").sum())
    files03 = int((manifest_run["silver03_file"] != "").sum())
    print(f"\n[03] 완료 조건: {'통과' if ok else '실패'} | 02 불변 {'예' if unchanged02 else '아니오'} "
          f"| 기록 건수 일치 {'예' if cond7 else '아니오'} | 재실행 동일 {unchanged}/{files03} (처음 실행은 created)")
    for d in datasets:
        for p in fails[d]:
            print(f"  - {d}: {p}")
    print(f"[03] 시작 {started}, 종료 {now_kst()}")
    print(f"[03] 결과: {', '.join(relative(p) for p in paths.values())}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
