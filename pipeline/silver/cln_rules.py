"""[03] 정제 규칙 함수 (docs/silver_정제.md). 입출력 없이 DataFrame → 결과만 다룬다.

03_clean.py 가 이 함수들을 순서대로 부르고, pipeline/validation/check_cln_rules.py 가 작은 예시로 검사한다.
기준값은 모두 metadata/cln_*.csv 에서 읽는다 (Meta).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

FFFD = "�"
LICENSE_DATASETS = ["food_general", "food_rest", "clinic", "pharmacy", "beauty"]
NEW_COLUMNS = [   # 03 이 붙이는 컬럼 (순서 고정)
    "ANLS_TRD_STATE_CD", "TRD_STATE_SRC_CD", "ANLS_CLSBIZ_DTM", "CLSBIZ_SRC_CD", "ANLS_LCNS_DTM", "LCNS_SRC_CD",
    "LDONG_CD", "LDONG_SRC_CD", "ANLS_INDUTY_CD", "INDUTY_RULE_CD", "MOVE_PRE_KEY", "REPL_PRE_KEY", "REPL_TYPE_CD",
    "ABNRM_LCNS_DTM_YN", "OUT_SEOUL_ADDR_YN", "OUT_SCOPE_YN",
]
TRADE_NEW_COLUMNS = ["LDONG_SRC_CD", "SAME_DEAL_YN"]   # 실거래가 매매 03 이 붙이는 컬럼 (LDONG_CD 는 02 컬럼을 고침) [G2]·[G5]
TRADE_SAME_DEAL_KEY = ["LDONG_CD", "APT_KEY", "DEAL_DTM", "DEAL_AMT_NUM", "EXCL_AREA_NUM", "FLR_NUM", "APT_DONG_TXT"]
CODE_COLUMNS = ["ANLS_TRD_STATE_CD", "TRD_STATE_SRC_CD", "CLSBIZ_SRC_CD", "LCNS_SRC_CD", "LDONG_SRC_CD",
                "ANLS_INDUTY_CD", "INDUTY_RULE_CD", "REPL_TYPE_CD"]


# ──────────────────────────────────────────────────────────────
# metadata
# ──────────────────────────────────────────────────────────────
def _read(path: Path) -> pd.DataFrame:
    return pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")


@dataclass
class Meta:
    flag: pd.DataFrame
    code_value: pd.DataFrame
    state_map: pd.DataFrame
    lgov: pd.DataFrame
    induty: pd.DataFrame
    param: pd.DataFrame
    placeholder: pd.DataFrame
    known: pd.DataFrame
    words: set[str] = field(default_factory=set)

    def p(self, name: str, dataset: str = "*") -> str:
        rows = self.param[self.param["param"] == name]
        hit = rows[rows["dataset"].str.split(";").apply(lambda l: dataset in l)]
        if hit.empty:
            hit = rows[rows["dataset"] == "*"]
        if hit.empty:
            raise KeyError(f"cln_param.csv 에 {name} ({dataset}) 없음")
        return hit["value"].iloc[0]

    def codes(self, column: str) -> set[str]:
        return set(self.code_value.loc[self.code_value["code_column"] == column, "code_value"])

    def gu_of_lgov(self) -> dict[str, str]:
        return dict(zip(self.lgov["LGOV_CD"], self.lgov["SGG_NM"]))


def load_meta(metadata_dir: Path) -> Meta:
    m = Meta(
        flag=_read(metadata_dir / "cln_flag.csv"),
        code_value=_read(metadata_dir / "cln_code_value.csv"),
        state_map=_read(metadata_dir / "cln_trd_state_map.csv"),
        lgov=_read(metadata_dir / "cln_lgov_sgg_map.csv"),
        induty=_read(metadata_dir / "cln_induty_rule.csv"),
        param=_read(metadata_dir / "cln_param.csv"),
        placeholder=_read(metadata_dir / "cln_placeholder.csv"),
        known=_read(metadata_dir / "known_issues.csv"),
    )
    m.words = set(_read(metadata_dir / "std_word.csv")["word"])
    return m


def check_meta(m: Meta) -> list[str]:
    """03 실행 전 metadata 검사. 문제 목록 (비면 통과)."""
    problems = []
    for col in NEW_COLUMNS + TRADE_NEW_COLUMNS:
        missing = [w for w in col.split("_") if w not in m.words]
        if missing:
            problems.append(f"std_word.csv 에 없는 단어 {missing} (컬럼 {col})")
    for col, values in [("ANLS_TRD_STATE_CD", m.state_map["ANLS_TRD_STATE_CD"]),
                        ("TRD_STATE_SRC_CD", m.state_map["TRD_STATE_SRC_CD"]),
                        ("ANLS_INDUTY_CD", m.induty.loc[m.induty["ANLS_INDUTY_CD"] != "", "ANLS_INDUTY_CD"]),
                        ("INDUTY_RULE_CD", m.induty.loc[m.induty["stage"] == "classify", "rule_cd"]),
                        ("ISSUE_CD", m.placeholder["issue_cd"])]:
        bad = set(values) - m.codes(col)
        if bad:
            problems.append(f"cln_code_value.csv 의 {col} 에 없는 값 {sorted(bad)}")
    clsbiz_rules = {"해당없음", "원본_없으면_최종수정일자_대용", "최종수정일자_전출"}
    if bad := set(m.state_map["clsbiz_rule"]) - clsbiz_rules:
        problems.append(f"cln_trd_state_map.csv clsbiz_rule 알 수 없는 값 {sorted(bad)}")
    if m.state_map.duplicated(["TRD_STATE_NM", "DTL_TRD_STATE_NM"]).any():
        problems.append("cln_trd_state_map.csv 상태 조합 중복")
    if len(m.lgov) != 25 or m.lgov["LGOV_CD"].duplicated().any():
        problems.append("cln_lgov_sgg_map.csv 는 구청 25행, LGOV_CD 중복 없음이어야 함")
    match_types = {"eq", "all", "contains", "contains_word", "excludes", "excludes_rule"}
    if bad := set(m.induty["match_type"]) - match_types:
        problems.append(f"cln_induty_rule.csv match_type 알 수 없는 값 {sorted(bad)}")
    try:
        end = pd.Timestamp(m.p("ANLS_END_DT"))
        for ds in LICENSE_DATASETS:
            if not end < pd.Timestamp(m.p("COLLECT_DT", ds)):
                problems.append(f"ANLS_END_DT({end.date()}) 가 {ds} 수집일보다 앞이 아님")
        for name in ["REPL_WINDOW_DAYS", "MULTI_TENANT_MIN_RECORDS", "ANLS_BGN_DT", "ABNRM_LCNS_BEFORE_DT", "SEOUL_TM_X_MIN", "SEOUL_TM_X_MAX",
                     "SEOUL_TM_Y_MIN", "SEOUL_TM_Y_MAX"]:
            m.p(name)
    except KeyError as exc:
        problems.append(str(exc))
    flags_made = [c for c in NEW_COLUMNS + TRADE_NEW_COLUMNS if c.endswith("_YN")]
    if bad := set(flags_made) - set(m.flag["flag"]):
        problems.append(f"cln_flag.csv 에 없는 플래그 {sorted(bad)}")
    return problems


# ──────────────────────────────────────────────────────────────
# 실거래가 매매 [G2]·[G5]
# ──────────────────────────────────────────────────────────────
def sgg_umd_lookup(ldong: pd.DataFrame) -> dict[tuple[str, str], str]:
    """현행(폐지 아님) 법정동 (시군구 코드 5자리, 마지막 이름) → 10자리 코드. 같은 키가 둘 이상이면 넣지 않는다."""
    cur = ldong[~ldong["ABL_YN"].astype(bool) & (ldong["LDONG_CD"].str[5:] != "00000")]
    keys = pd.DataFrame({"SGG": cur["LDONG_CD"].str[:5], "UMD": cur["LDONG_NM"].str.split().str[-1], "CD": cur["LDONG_CD"]})
    keys = keys.drop_duplicates(["SGG", "UMD"], keep=False)
    return dict(zip(zip(keys["SGG"], keys["UMD"]), keys["CD"]))


def trade_ldong(df: pd.DataFrame, current: set[str], lookup: dict) -> tuple[pd.Series, pd.Series]:
    """[G5] 실거래가 LDONG_CD 를 현행 법정동 코드표에 맞춘다. (03 LDONG_CD, LDONG_SRC_CD).
    현행 코드면 그대로(원본코드), 아니면 SGG_CD + UMD_NM 으로 다시 찾고(시군구_동명), 못 찾으면 NULL(실패).
    서울 필터는 하지 않는다 (82개 시군구 모두 같은 규칙)."""
    ok = df["LDONG_CD"].isin(current)
    found = pd.Series([lookup.get((g, u)) for g, u in zip(df["SGG_CD"], df["UMD_NM"])], index=df.index)
    code = df["LDONG_CD"].where(ok, found)
    src = pd.Series(np.select([ok, found.notna()], ["원본코드", "시군구_동명"], "실패"), index=df.index)
    return code, src


def same_deal(df: pd.DataFrame) -> pd.Series:
    """[G2] 해제 아닌 매매 중 키 7개가 같은 묶음 번호 (묶음에 안 들면 NA). 묶음 번호는 키 정렬 순서."""
    live = df[~df["CNCL_YN"].fillna(False).astype(bool)]
    dup = live[live.duplicated(TRADE_SAME_DEAL_KEY, keep=False)]
    grp = dup.groupby(TRADE_SAME_DEAL_KEY, dropna=False, sort=True).ngroup() + 1
    return grp.reindex(df.index).astype("Int64")


# ──────────────────────────────────────────────────────────────
# 공통 비교 키
# ──────────────────────────────────────────────────────────────
def name_key(names: pd.Series) -> pd.Series:
    """상호 비교 키: 대문자, U+FFFD·공백·괄호·특수문자 제거 [C4][F1]."""
    s = names.fillna("").str.upper().str.replace(FFFD, "", regex=False)
    return s.str.replace(r"[^0-9A-Z가-힣]", "", regex=True)


def placeholder_mask(values: pd.Series, column: str, m: Meta, tel_only: bool = False) -> pd.Series:
    """cln_placeholder.csv 의 eq / regex 값에 걸리는 칸."""
    rows = m.placeholder[m.placeholder["column"] == column]
    if tel_only:
        rows = rows[rows["tel_compare_excl_yn"] == "Y"]
    text = values.astype("string")
    hit = pd.Series(False, index=values.index)
    for r in rows.itertuples():
        if r.match_type == "eq":
            hit |= (text == r.value).fillna(False)
        elif r.match_type == "regex":
            hit |= text.str.match(r.value).fillna(False)
    return hit


def valid_tel(tel: pd.Series, m: Meta) -> pd.Series:
    """비교용 전화번호. 빈 값·자리표시 값은 NULL ("없음" → 일치로 세지 않음) [C6]."""
    return tel.where(tel.notna() & ~placeholder_mask(tel, "SITE_TEL", m, tel_only=True))


# ──────────────────────────────────────────────────────────────
# [C1][C2][C5] 상태·폐업일·이상 날짜
# ──────────────────────────────────────────────────────────────
def map_state(df: pd.DataFrame, m: Meta) -> tuple[pd.DataFrame, pd.DataFrame]:
    """분석용 상태·폐업일. 돌려주는 값: (새 컬럼 4개, 매핑표에 없는 조합)."""
    keys = ["TRD_STATE_NM", "DTL_TRD_STATE_NM"]
    merged = df[keys].merge(m.state_map, on=keys, how="left")
    merged.index = df.index
    unmapped = df.loc[merged["ANLS_TRD_STATE_CD"].isna(), keys].value_counts().reset_index()

    rule = merged["clsbiz_rule"]
    mdfcn = df["LAST_MDFCN_DTM"].dt.normalize()
    has_clsbiz = df["CLSBIZ_DTM"].notna()
    out = pd.DataFrame(index=df.index)
    out["ANLS_TRD_STATE_CD"] = merged["ANLS_TRD_STATE_CD"]
    out["TRD_STATE_SRC_CD"] = merged["TRD_STATE_SRC_CD"]
    out["ANLS_CLSBIZ_DTM"] = pd.Series(pd.NaT, index=df.index, dtype="datetime64[ms]")
    out["CLSBIZ_SRC_CD"] = "해당없음"
    orig = (rule == "원본_없으면_최종수정일자_대용") & has_clsbiz
    proxy = (rule == "원본_없으면_최종수정일자_대용") & ~has_clsbiz
    moved = rule == "최종수정일자_전출"
    out.loc[orig, "ANLS_CLSBIZ_DTM"] = df.loc[orig, "CLSBIZ_DTM"]
    out.loc[orig, "CLSBIZ_SRC_CD"] = "원본"
    out.loc[proxy, "ANLS_CLSBIZ_DTM"] = mdfcn[proxy]
    out.loc[proxy, "CLSBIZ_SRC_CD"] = "최종수정일자_대용"
    out.loc[moved, "ANLS_CLSBIZ_DTM"] = mdfcn[moved]
    out.loc[moved, "CLSBIZ_SRC_CD"] = "최종수정일자_전출"
    return out, unmapped


# ──────────────────────────────────────────────────────────────
# [D] 법정동
# ──────────────────────────────────────────────────────────────
SEOUL_PREFIX = re.compile(r"^\s*서울(?:특별시|시)?\s*(\S+구)\s+(.*)$")
OTHER_SIDO = re.compile(r"^\s*(부산|대구|인천|광주|대전|울산|세종|경기|강원|충청|충북|충남|전라|전북|전남|경상|경북|경남|제주)")
BUNJI = re.compile(r"^\s*(산\s*)?(\d+)(?:\s*-\s*(\d+))?")
# 옛 지번 표기 'N번지 M호'의 M은 부번이다 (의원·약국 2020년 전 레코드). 'N-M'으로 맞춘 뒤 비교한다.
# '820번지 9호 501호'처럼 뒤에 오는 호수는 건드리지 않는다.
BUNJI_HO = re.compile(r"(\d+)\s*번지\s*(\d+)\s*호")
BUNJI_ONLY = re.compile(r"(\d+)\s*번지")


def normalize_bunji_text(text: str) -> str:
    """'1690번지 1호' → '1690-1', '103번지' → '103'. 그 밖의 글자는 그대로."""
    return BUNJI_ONLY.sub(r"\1", BUNJI_HO.sub(r"\1-\2", text))


def jibun_key(addr: pd.Series) -> pd.Series:
    """교체 판정용 지번주소 키 [F2]: 공백을 하나로, 번지 표기를 'N-M'으로 맞춘다."""
    s = addr.str.replace(r"\s+", " ", regex=True).str.strip()
    return s.str.replace(BUNJI_HO, r"\1-\2", regex=True).str.replace(BUNJI_ONLY, r"\1", regex=True)


def ldong_lookup(ldong: pd.DataFrame) -> dict[tuple[str, str], str]:
    """현행 서울 법정동 (구, 동명) → 10자리 코드."""
    cur = ldong[ldong["LDONG_CD"].str.startswith("11") & ~ldong["ABL_YN"].astype(bool)]
    parts = cur["LDONG_NM"].str.split()
    cur = cur[parts.str.len() == 3]
    parts = parts[parts.str.len() == 3]
    return {(p[1], p[2]): code for p, code in zip(parts, cur["LDONG_CD"])}


def normalize_dong(name: str) -> str:
    """행정동식 동명 → 법정동식 [D2]. 상일제1동 → 상일동, 방이1동 → 방이동."""
    return re.sub(r"(제)?\d+동$", "동", name)


def _find_dong(gu: str, token: str, table: dict) -> tuple[str | None, str | None, bool]:
    """(코드, 쓴 동명, 정규화 여부). 토큰 끝의 번지 숫자는 떼어 보고 다시 찾는다."""
    for cand in dict.fromkeys([token, re.sub(r"[\d\-]+(번지)?$", "", token)]):
        if cand and (gu, cand) in table:
            return table[(gu, cand)], cand, False
    for cand in dict.fromkeys([token, re.sub(r"[\d\-]+(번지)?$", "", token)]):
        norm = normalize_dong(cand)
        if norm != cand and (gu, norm) in table:
            return table[(gu, norm)], cand, True
    return None, None, False


def parse_jibun(addr: str | None, table: dict) -> tuple[str | None, str | None, bool, str | None]:
    """'서울특별시 강남구 대치동 603 201호' → (구, 코드, 정규화 여부, 번지 '603' / '603-1' / '산12')."""
    if not isinstance(addr, str) or not (mt := SEOUL_PREFIX.match(addr)):
        return None, None, False, None
    gu, rest = mt.group(1), mt.group(2)
    token = rest.split()[0] if rest.split() else ""
    code, used, norm = _find_dong(gu, token, table)
    if code is None:
        return gu, None, False, None
    bm = BUNJI.match(normalize_bunji_text(rest[len(used):]))
    bunji = None
    if bm and int(bm.group(2)) > 0:
        bunji = ("산" if bm.group(1) else "") + str(int(bm.group(2)))
        if bm.group(3) and int(bm.group(3)) > 0:
            bunji += f"-{int(bm.group(3))}"
    return gu, code, norm, bunji


def parse_road(addr: str | None, table: dict) -> tuple[str | None, str | None, bool]:
    """'서울특별시 종로구 율곡로 286 (종로6가)' → (구, 코드, 정규화 여부). 괄호 안 첫 동명."""
    if not isinstance(addr, str) or not (mt := SEOUL_PREFIX.match(addr)):
        return None, None, False
    gu = mt.group(1)
    # 동명은 주소 끝 괄호에 있다. '(재)원불교', '(주)맥스아웃' 같은 중간 괄호는 건너뛴다
    groups = re.findall(r"\(([^()]*)\)", addr)
    if not groups:
        return gu, None, False
    token = groups[-1].split(",")[0].strip()
    code, _, norm = _find_dong(gu, token, table)
    return gu, code, norm


def assign_ldong(df: pd.DataFrame, table: dict, m: Meta, dataset: str,
                 orig_code: pd.Series | None = None) -> tuple[pd.DataFrame, pd.Series]:
    """[D1]~[D4]. 돌려주는 값: (LDONG_CD, LDONG_SRC_CD, OUT_SEOUL_ADDR_YN, 번지, 주소 구, 지번코드, 도로명코드), ADDR_MISMATCH 마스크."""
    jib = {a: parse_jibun(a, table) for a in df["JIBUN_ADDR"].dropna().unique()}
    road = {a: parse_road(a, table) for a in df["ROAD_ADDR"].dropna().unique()}
    none4, none3 = (None, None, False, None), (None, None, False)
    j = pd.DataFrame([jib.get(a, none4) if isinstance(a, str) else none4 for a in df["JIBUN_ADDR"]],
                     columns=["gu", "code", "norm", "bunji"], index=df.index)
    r = pd.DataFrame([road.get(a, none3) if isinstance(a, str) else none3 for a in df["ROAD_ADDR"]],
                     columns=["gu", "code", "norm"], index=df.index)

    out = pd.DataFrame(index=df.index)
    out["LDONG_CD"] = pd.Series(None, index=df.index, dtype="object")
    out["LDONG_SRC_CD"] = pd.Series(None, index=df.index, dtype="object")
    todo = pd.Series(True, index=df.index)

    def put(mask, code, src):
        nonlocal todo
        mask = mask & todo
        out.loc[mask, "LDONG_CD"] = code[mask] if isinstance(code, pd.Series) else code
        out.loc[mask, "LDONG_SRC_CD"] = src
        todo &= ~mask

    addr_gu = j["gu"].fillna(r["gu"])
    first_addr = df["JIBUN_ADDR"].fillna(df["ROAD_ADDR"]).fillna("")
    out_seoul = first_addr.str.match(OTHER_SIDO.pattern)
    # [D4] 전출 의원: 주소가 전출 뒤 새 주소 (LGOV 구 ≠ 주소 구, 서울 밖으로 옮긴 새 주소 포함)
    if "DTL_TRD_STATE_NM" in df:
        lgov_gu = df["LGOV_CD"].map(m.gu_of_lgov())
        moved_addr = (df["DTL_TRD_STATE_NM"] == "전출") & ((addr_gu.notna() & (addr_gu != lgov_gu)) | out_seoul)
        put(moved_addr, None, "실패_전출주소")
    # [D3] 서울 밖 주소
    put(out_seoul, None, "실패_서울밖")
    # [D1] 1. 원본 코드 (일반음식점 CSV)
    if orig_code is not None:
        valid = orig_code.isin(set(table.values()))
        put(valid, orig_code, "원본코드")
    # 2. 지번 → 3. 도로명 (정규화 없이 찾은 것 먼저)
    put(j["code"].notna() & ~j["norm"].astype(bool), j["code"], "지번")
    put(j["code"].notna() & j["norm"].astype(bool), j["code"], "지번_정규화")
    put(r["code"].notna() & ~r["norm"].astype(bool), r["code"], "도로명")
    put(r["code"].notna() & r["norm"].astype(bool), r["code"], "도로명_정규화")
    out.loc[todo, "LDONG_SRC_CD"] = "실패"
    out["OUT_SEOUL_ADDR_YN"] = out["LDONG_SRC_CD"] == "실패_서울밖"
    out["_BUNJI"] = j["bunji"]
    out["_JIBUN_CD"] = j["code"]
    out["_ROAD_CD"] = r["code"]
    mismatch = j["code"].notna() & r["code"].notna() & (j["code"] != r["code"])
    return out, mismatch


# ──────────────────────────────────────────────────────────────
# [E] 업종 분류
# ──────────────────────────────────────────────────────────────
def _name_for_match(names: pd.Series) -> pd.Series:
    return names.fillna("").str.upper().str.replace(FFFD, "", regex=False).str.replace(r"\s+", "", regex=True)


def _rule_hit(df: pd.DataFrame, row, names: pd.Series) -> pd.Series:
    if row.match_type == "all":
        return pd.Series(True, index=df.index)
    if row.match_column == "UPTAE_NM":
        col = df["UPTAE_NM"].fillna("(NULL)") if row.match_value == "(NULL)" else df["UPTAE_NM"]
        return (col == row.match_value).fillna(False)
    kw = re.sub(r"\s+", "", row.match_value.upper())
    if row.match_type == "contains_word":
        raw = df["BPLC_NM"].fillna("").str.upper().str.replace(FFFD, "", regex=False)
        return raw.str.contains(rf"(?<![A-Z]){re.escape(kw)}(?![A-Z])", regex=True)
    return names.str.contains(kw, regex=False)


def classify(df: pd.DataFrame, m: Meta, dataset: str) -> tuple[pd.DataFrame, pd.Series, dict]:
    """[E4] 순서대로 처음 맞는 규칙 하나. 돌려주는 값: (ANLS_INDUTY_CD, INDUTY_RULE_CD), ABNRM_UPTAE 마스크, 카페C 키워드 기록."""
    rules = m.induty[m.induty["dataset"].str.split(";").apply(lambda l: dataset in l)].copy()
    rules["rule_seq"] = rules["rule_seq"].astype(int)
    names = _name_for_match(df["BPLC_NM"]) if "BPLC_NM" in df else pd.Series("", index=df.index)
    out = pd.DataFrame({"ANLS_INDUTY_CD": pd.Series(None, index=df.index, dtype="object"),
                        "INDUTY_RULE_CD": pd.Series(None, index=df.index, dtype="object")})
    todo = pd.Series(True, index=df.index)
    keyword_hits = {}
    cls = rules[rules["stage"] == "classify"]
    hit_cache: dict[str, pd.Series] = {}
    for (seq, rule_cd), grp in cls.groupby(["rule_seq", "rule_cd"], sort=True):
        include = grp[grp["match_type"].isin(["eq", "all", "contains", "contains_word"])]
        exclude = grp[grp["match_type"] == "excludes"]
        excl_rule = grp[grp["match_type"] == "excludes_rule"]
        excl = pd.Series(False, index=df.index)
        for row in exclude.itertuples():
            excl |= names.str.contains(re.sub(r"\s+", "", row.match_value.upper()), regex=False)
        for row in excl_rule.itertuples():
            excl |= hit_cache.get(row.match_value, pd.Series(False, index=df.index))
        group_hit = pd.Series(False, index=df.index)
        for row in include.itertuples():
            hit = _rule_hit(df, row, names) & ~excl
            if rule_cd == "카페C":
                keyword_hits[row.match_value] = hit & todo
            group_hit |= hit
            take = hit & todo
            out.loc[take, "ANLS_INDUTY_CD"] = row.ANLS_INDUTY_CD
            out.loc[take, "INDUTY_RULE_CD"] = rule_cd
            todo &= ~take
        hit_cache[rule_cd] = hit_cache.get(rule_cd, pd.Series(False, index=df.index)) | group_hit
    abnrm = pd.Series(False, index=df.index)
    for row in rules[rules["stage"] == "issue"].itertuples():
        abnrm |= _rule_hit(df, row, names)
    return out, abnrm, keyword_hits


# ──────────────────────────────────────────────────────────────
# [F] 이전·재등록·교체
# ──────────────────────────────────────────────────────────────
@dataclass
class LinkResult:
    move_pre: pd.Series
    repl_pre: pd.Series
    repl_type: pd.Series
    anls_lcns: pd.Series
    lcns_src: pd.Series
    issues: list[dict]
    stats: dict


def find_links(d: pd.DataFrame, window_days: int, multi_tenant_min: int | None = None) -> LinkResult:
    """d: LCNS_KEY, NAME_KEY, LCNS_DTM, END(분석용 폐업일), LGOV_CD, TEL(비교용), LDONG_CD, BUNJI, JIBUN_KEY.

    순서: 이전 [F3] → 재등록 [F1] → 교체 [F2]. 각 종류에서 A·B 후보가 서로 하나뿐일 때만 확정 [F0].
    multi_tenant_min: 교체 미확정 중 같은 JIBUN_KEY 레코드가 이 수 이상인 것은 AMBIG_LINK 대신 MULTI_TENANT.
    """
    jibun_cnt = d["JIBUN_KEY"].map(d["JIBUN_KEY"].value_counts())
    n = len(d)
    idx = d.index
    key = d["LCNS_KEY"]
    move_pre = pd.Series(None, index=idx, dtype="object")
    repl_pre = pd.Series(None, index=idx, dtype="object")
    repl_type = pd.Series(None, index=idx, dtype="object")
    anls_lcns = d["LCNS_DTM"].copy()
    lcns_src = pd.Series("원본", index=idx, dtype="object")
    issues: list[dict] = []
    stats: dict = {}

    def issue(code, rec, value):
        issues.append({"issue_cd": code, "rec_key": rec, "column": "연결 후보", "value": value})

    # ── [F3] 구 간 이전: 같은 상호 + 같은 인허가일, 2개 이상 구
    g = d[(d["NAME_KEY"] != "") & d["LCNS_DTM"].notna()]
    grp_key = g["NAME_KEY"] + "|" + g["LCNS_DTM"].dt.strftime("%Y-%m-%d")
    multi = grp_key.map(grp_key.value_counts()) > 1
    g = g[multi].assign(GRP=grp_key[multi])
    g = g[g.groupby("GRP")["LGOV_CD"].transform("nunique") > 1]
    far = pd.Timestamp("2262-01-01")
    g = g.assign(END_SORT=g["END"].fillna(far)).sort_values(["GRP", "END_SORT", "LCNS_KEY"])
    tie_grp = set(g.loc[g.duplicated(["GRP", "END_SORT"], keep=False), "GRP"])
    stats["이전_후보묶음"] = int(g["GRP"].nunique())
    stats["이전_미확정_종료일동률묶음"] = len(tie_grp)
    for k in g.loc[g["GRP"].isin(tie_grp), "LCNS_KEY"]:
        issue("AMBIG_LINK", k, "이전: 같은 상호·인허가일 묶음에 종료일 같은 레코드")
    ok = g[~g["GRP"].isin(tie_grp)]
    nxt = ok.groupby("GRP")[["LCNS_KEY", "LGOV_CD", "TEL", "END"]].shift(-1)
    pair = pd.DataFrame({"A": ok["LCNS_KEY"], "A_LGOV": ok["LGOV_CD"], "A_TEL": ok["TEL"], "A_END": ok["END"],
                         "A_OPEN": ok["LCNS_DTM"], "B": nxt["LCNS_KEY"], "B_LGOV": nxt["LGOV_CD"], "B_TEL": nxt["TEL"]})
    pair = pair[pair["B"].notna() & pair["A_END"].notna() & (pair["A_LGOV"] != pair["B_LGOV"])]
    stats["이전_인접쌍_다른구"] = len(pair)
    pair = pair[pair["A_TEL"].notna() & (pair["A_TEL"] == pair["B_TEL"])]
    stats["이전_전화번호일치"] = len(pair)
    bad_time = pair["A_END"] <= pair["A_OPEN"]      # 예상 개업일(A 종료일) > A 개업일 [F0]②
    for b in pair.loc[bad_time, "B"]:
        issue("TIME_CONFLICT", b, "이전: 예상 개업일(앞 레코드 종료일) ≤ 앞 레코드 개업일")
    pair = pair[~bad_time]
    pos = pd.Series(np.arange(n), index=key.values)
    b_pos = pos[pair["B"].values].values
    move_pre.iloc[b_pos] = pair["A"].values
    anls_lcns.iloc[b_pos] = pair["A_END"].values
    lcns_src.iloc[b_pos] = "이전_앞레코드종료일"
    stats["이전_확정"] = len(pair)

    # 같은 자리 후보 (재등록·교체 공통): A 종료 레코드 × B (B 인허가일이 A 종료일 ±N일)
    win = pd.Timedelta(days=window_days)
    has_pre = move_pre.notna()
    repl_succ_used: set[str] = set()

    def same_place(kind: str, on: list[str], name_rule: str):
        nonlocal has_pre
        A = d.loc[d["END"].notna(), ["LCNS_KEY", "NAME_KEY", "END", *on]].rename(columns={"LCNS_KEY": "A", "NAME_KEY": "A_NM"})
        A = A.assign(A_OPEN=anls_lcns[A.index].values)
        A = A[~A["A"].isin(repl_succ_used)]
        B = d.loc[~has_pre, ["LCNS_KEY", "NAME_KEY", "LCNS_DTM", *on]].rename(columns={"LCNS_KEY": "B", "NAME_KEY": "B_NM"})
        B = B.assign(B_OPEN=anls_lcns[B.index].values)
        A = A.dropna(subset=on)
        B = B.dropna(subset=on)
        c = A.merge(B, on=on)
        c = c[(c["A"] != c["B"]) & ((c["LCNS_DTM"] - c["END"]).abs() <= win)]
        c = c[(c["A_NM"] == c["B_NM"]) & (c["A_NM"] != "")] if name_rule == "same" else c[c["A_NM"] != c["B_NM"]]
        stats[f"{kind}_후보쌍"] = len(c)
        bad = c["B_OPEN"] <= c["A_OPEN"]
        for b in c.loc[bad, "B"].unique():
            issue("TIME_CONFLICT", b, f"{kind}: 뒤 레코드 개업일 ≤ 앞 레코드 개업일")
        c = c[~bad]
        a_cnt = c["A"].map(c["A"].value_counts())
        b_cnt = c["B"].map(c["B"].value_counts())
        uniq = (a_cnt == 1) & (b_cnt == 1)
        amb = c.loc[~uniq]
        big = pd.Series(False, index=amb.index)
        if kind == "교체" and multi_tenant_min:
            big = jibun_cnt.iloc[pos[amb["B"].values].values].to_numpy() >= multi_tenant_min
            big = pd.Series(big, index=amb.index)
        for b, cnt in amb[~big].groupby("B").size().items():
            issue("AMBIG_LINK", b, f"{kind}: 후보 {cnt}쌍 (앞·뒤 레코드 중 한쪽 후보가 여럿)")
        for b, cnt in amb[big].groupby("B").size().items():
            issue("MULTI_TENANT", b, f"{kind}: 같은 지번 레코드 {int(jibun_cnt.iloc[pos[b]])}건인 대형 건물, 후보 {cnt}쌍")
        if kind == "교체":
            stats[f"{kind}_미확정_대형건물"] = int(big.sum())
        c = c[uniq]
        b_pos = pos[c["B"].values].values
        repl_pre.iloc[b_pos] = c["A"].values
        repl_type.iloc[b_pos] = kind
        repl_succ_used.update(c["A"])
        has_pre = has_pre | repl_pre.notna()
        stats[f"{kind}_확정"] = len(c)
        stats[f"{kind}_미확정"] = int((~uniq).sum())

    same_place("재등록", ["LDONG_CD", "BUNJI"], "same")
    same_place("교체", ["JIBUN_KEY"], "diff")
    return LinkResult(move_pre, repl_pre, repl_type, anls_lcns, lcns_src, issues, stats)


def check_links(df: pd.DataFrame) -> list[str]:
    """완료 조건 6. 문제 목록."""
    problems = []
    keys = set(df["LCNS_KEY"])
    open_by_key = dict(zip(df["LCNS_KEY"], df["ANLS_LCNS_DTM"]))
    for col in ["MOVE_PRE_KEY", "REPL_PRE_KEY"]:
        s = df[df[col].notna()]
        if bad := (~s[col].isin(keys)).sum():
            problems.append(f"{col} 가 없는 LCNS_KEY 를 가리킴 {bad}건")
        if bad := (s[col] == s["LCNS_KEY"]).sum():
            problems.append(f"{col} 자기 자신 {bad}건")
        if bad := s[col].duplicated().sum():
            problems.append(f"{col} 같은 앞 레코드 중복 {bad}건")
        pre_open = s[col].map(open_by_key)
        if bad := (~(s["ANLS_LCNS_DTM"] > pre_open)).sum():
            problems.append(f"{col} 뒤 레코드 분석용 개업일 ≤ 앞 레코드 {bad}건")
    if bad := (df["MOVE_PRE_KEY"].notna() & df["REPL_PRE_KEY"].notna()).sum():
        problems.append(f"MOVE_PRE_KEY·REPL_PRE_KEY 동시 {bad}건")
    return problems


# ──────────────────────────────────────────────────────────────
# 분기 말 재고 (검증·기록용, 골드 아님) — 3-6 기준: 개업일 ≤ 분기 말 < 폐업일
# ──────────────────────────────────────────────────────────────
def quarter_ends(m: Meta) -> pd.DatetimeIndex:
    return pd.date_range(m.p("ANLS_BGN_DT"), m.p("ANLS_END_DT"), freq="QE")


def stock(open_dt: pd.Series, close_dt: pd.Series, qends: pd.DatetimeIndex) -> np.ndarray:
    o = open_dt.to_numpy(dtype="datetime64[ms]")
    c = close_dt.to_numpy(dtype="datetime64[ms]")
    out = []
    for q in qends.to_numpy(dtype="datetime64[ms]"):
        alive = (o <= q) & (np.isnat(c) | (c > q))
        out.append(int(alive.sum()))
    return np.array(out)
