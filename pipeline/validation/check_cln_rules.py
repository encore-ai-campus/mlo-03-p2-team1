"""03 정제 규칙(pipeline/silver/cln_rules.py) 단위 검사. docs/silver_정제_테스트계획.md L1.

사용법
  python pipeline/validation/check_cln_rules.py

작은 예시 행으로 규칙 함수만 검사한다. metadata/cln_*.csv 는 실제 파일을 쓴다. 하나라도 틀리면 종료 코드 1.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
sys.path.insert(0, str(ROOT / "pipeline" / "silver"))

import cln_rules as R  # noqa: E402

META = R.load_meta(ROOT / "metadata")
TABLE = {("종로구", "종로6가"): "1111017500", ("강남구", "대치동"): "1168010600", ("강동구", "상일동"): "1174010100",
         ("송파구", "방이동"): "1171010900", ("종로구", "세종로"): "1111011900"}
results: list[tuple[str, bool, object]] = []


def nn(values) -> list:
    """결측값 표기(None·nan)를 None 으로 통일."""
    return [None if pd.isna(v) else v for v in values]


def check(name: str, got, expected) -> None:
    results.append((name, got == expected, f"기대 {expected!r} / 결과 {got!r}"))


# [D1] 지번·도로명 동명
check("D1 지번 ~가", R.parse_jibun("서울특별시 종로구 종로6가 12-3", TABLE), ("종로구", "1111017500", False, "12-3"))
check("D1 지번 ~로", R.parse_jibun("서울특별시 종로구 세종로 1", TABLE)[1], "1111011900")
check("D1 지번 붙은 번지", R.parse_jibun("서울특별시 강남구 대치동603", TABLE)[1:], ("1168010600", False, "603"))
check("D1 지번 산번지", R.parse_jibun("서울특별시 강남구 대치동 산 12", TABLE)[3], "산12")
check("D1 동명부터 시작 → 지번 실패", R.parse_jibun("대치동 603 201호", TABLE), (None, None, False, None))
check("D1 도로명 괄호", R.parse_road("서울특별시 종로구 율곡로 286 (종로6가)", TABLE), ("종로구", "1111017500", False))
check("D1 도로명 중간 괄호 건너뜀", R.parse_road("서울특별시 강남구 선릉로 1, (주)상경빌딩 4층 (대치동)", TABLE)[1], "1168010600")
check("D1 도로명 괄호 여럿",R.parse_road("서울특별시 강남구 삼성로 1 (대치동, 래미안)", TABLE)[1], "1168010600")
# [D2] 행정동식
check("D2 상일제1동", R.parse_jibun("서울특별시 강동구 상일제1동 100", TABLE)[1:3], ("1174010100", True))
check("D2 방이1동", R.parse_road("서울특별시 송파구 오금로 1 (방이1동)", TABLE), ("송파구", "1171010900", True))

# [C6][C4] 비교 키
tel = R.valid_tel(pd.Series(["02-0000-0000", "02-000-0000", None, "02-123-4567"]), META)
check("C6 자리표시 전화번호는 없음", tel.isna().tolist(), [True, True, True, False])
check("C4 깨진 문자 무시", R.name_key(pd.Series(["카페�스", "카페 스(본점)"])).tolist(), ["카페스", "카페스본점"])

# [C1] 상태 매핑
st = pd.DataFrame({
    "TRD_STATE_NM": ["영업/정상", "휴업", "폐업", "폐업", "제외/삭제/전출", "폐업"],
    "DTL_TRD_STATE_NM": ["영업중", "휴업", "폐업", "폐업", "전출", "없는상태"],
    "CLSBIZ_DTM": pd.to_datetime([None, None, "2020-01-02", None, None, None]),
    "LAST_MDFCN_DTM": pd.to_datetime(["2020-01-01 10:00"] * 6),
})
out, unmapped = R.map_state(st, META)
check("C1 상태 출처", out["TRD_STATE_SRC_CD"].tolist()[:5], ["원본매핑", "휴업_영업간주", "원본매핑", "원본매핑", "전출_폐업"])
check("C2 폐업일 출처", out["CLSBIZ_SRC_CD"].tolist()[:5], ["해당없음", "해당없음", "원본", "최종수정일자_대용", "최종수정일자_전출"])
check("C2 대용 폐업일 = 최종수정일 날짜", str(out["ANLS_CLSBIZ_DTM"].iloc[3].date()), "2020-01-01")
check("C1 매핑표에 없는 조합", len(unmapped), 1)

# [E] 업종 분류
food = pd.DataFrame({"UPTAE_NM": ["전통찻집", "라이브카페", "한식", "한식", "한식", "까페", "편의점", "한식"],
                     "BPLC_NM": ["다향", "재즈 커피", "스터디카페 OO", "커피명가", "치킨로스터", "아무개", "GS25", "CU 역삼점"]})
cls, _, _ = R.classify(food, META, "food_general")
check("E4 분류 순서", cls["INDUTY_RULE_CD"].tolist(),
      ["업태예외_전통찻집", "업태예외_라이브카페", "나머지", "카페C", "카페C", "카페B", "편의점_업태", "편의점_브랜드"])
cubes = pd.DataFrame({"UPTAE_NM": ["한식"], "BPLC_NM": ["CUBE 커피"]})
check("E3 CU 는 단어 단위", R.classify(cubes, META, "food_general")[0]["INDUTY_RULE_CD"].tolist(), ["카페C"])
clinic = pd.DataFrame({"UPTAE_NM": ["치과의원", "보건소"], "BPLC_NM": ["a", "b"]})
check("E5 대상외", R.classify(clinic, META, "clinic")[0]["ANLS_INDUTY_CD"].tolist(), ["치과의원", "대상외"])


# [F] 연결
def links(rows: list[tuple]) -> R.LinkResult:
    cols = ["LCNS_KEY", "NAME_KEY", "LCNS_DTM", "END", "LGOV_CD", "TEL", "LDONG_CD", "BUNJI", "JIBUN_KEY"]
    d = pd.DataFrame(rows, columns=cols)
    d["LCNS_DTM"] = pd.to_datetime(d["LCNS_DTM"])
    d["END"] = pd.to_datetime(d["END"])
    return R.find_links(d, 7)


# 이전: 14일동안 (서대문 → 마포, 전화번호 일치)
r = links([("A", "14일동안", "2010-02-17", "2014-03-24", "3120000", "02-1", "L1", "1", "x"),
           ("B", "14일동안", "2010-02-17", "2016-04-22", "3130000", "02-1", "L2", "2", "y")])
check("F3 이전 연결", (nn(r.move_pre), str(r.anls_lcns.iloc[1].date()), r.lcns_src.iloc[1]),
      ([None, "A"], "2014-03-24", "이전_앞레코드종료일"))
# 가마솥진국: 종료일 같음 → 연결 안 함
r = links([("A", "가마솥진국", "2021-03-09", "2021-03-25", "3180000", "02-1", "L1", "1", "x"),
           ("B", "가마솥진국", "2021-03-09", "2021-03-25", "3210000", "02-1", "L2", "2", "y")])
check("F3 종료일 동률 → AMBIG_LINK", (r.move_pre.notna().sum(), [i["issue_cd"] for i in r.issues]), (0, ["AMBIG_LINK", "AMBIG_LINK"]))
# 전화번호 없으면 이전 아님
r = links([("A", "가게", "2010-01-01", "2012-01-01", "3120000", None, "L1", "1", "x"),
           ("B", "가게", "2010-01-01", None, "3130000", None, "L2", "2", "y")])
check("F3 전화번호 없으면 연결 안 함", r.move_pre.notna().sum(), 0)
# 재등록: 제이약국
r = links([("A", "제이약국", "2010-01-01", "2019-06-30", "3000000", None, "L1", "10-1", "x"),
           ("B", "제이약국", "2019-07-01", None, "3000000", None, "L1", "10-1", "x 2층")])
check("F1 재등록", (nn(r.repl_pre), nn(r.repl_type)), ([None, "A"], [None, "재등록"]))
# 교체: 같은 지번, 다른 상호, 3일 뒤
r = links([("C", "미용실가", "2015-01-01", "2020-05-01", "3000000", None, "L1", "5", "종로 5"),
           ("D", "헤어나", "2020-05-04", None, "3000000", None, "L1", "5", "종로 5")])
check("F2 교체", (nn(r.repl_pre), nn(r.repl_type)), ([None, "C"], [None, "교체"]))
# A 하나에 B 후보 둘 → 연결 안 함
r = links([("A", "약국", "2010-01-01", "2019-06-30", "3000000", None, "L1", "1", "x"),
           ("B1", "약국", "2019-07-01", None, "3000000", None, "L1", "1", "x"),
           ("B2", "약국", "2019-07-02", None, "3000000", None, "L1", "1", "x")])
check("F0 후보 여럿 → AMBIG_LINK", (r.repl_pre.notna().sum(), sorted({i["issue_cd"] for i in r.issues})), (0, ["AMBIG_LINK"]))
# 대형 건물: 같은 지번 레코드가 기준 이상이면 교체 미확정은 MULTI_TENANT, 확정은 그대로
mall = [("A1", "가", "2015-01-01", "2020-05-01", "3220000", None, "L1", "159", "코엑스"),
        ("A2", "나", "2015-01-01", "2020-05-02", "3220000", None, "L1", "159", "코엑스"),
        ("B1", "다", "2020-05-03", None, "3220000", None, "L1", "159", "코엑스")]
r = R.find_links(pd.DataFrame(mall, columns=["LCNS_KEY", "NAME_KEY", "LCNS_DTM", "END", "LGOV_CD", "TEL", "LDONG_CD", "BUNJI", "JIBUN_KEY"])
                 .assign(LCNS_DTM=lambda x: pd.to_datetime(x["LCNS_DTM"]), END=lambda x: pd.to_datetime(x["END"])), 7, 3)
check("F2 대형 건물 미확정 → MULTI_TENANT", (r.repl_pre.notna().sum(), [i["issue_cd"] for i in r.issues]), (0, ["MULTI_TENANT"]))
r = links(mall)
check("F2 기준 없으면 AMBIG_LINK", [i["issue_cd"] for i in r.issues], ["AMBIG_LINK"])
# 시간 조건: B 개업일 ≤ A 개업일
r = links([("A", "약국", "2019-07-01", "2019-07-03", "3000000", None, "L1", "1", "x"),
           ("B", "약국", "2019-06-30", None, "3000000", None, "L1", "1", "x")])
check("F0 시간 조건 → TIME_CONFLICT", (r.repl_pre.notna().sum(), [i["issue_cd"] for i in r.issues]), (0, ["TIME_CONFLICT"]))

# 완료 조건 6 검사 함수
bad = pd.DataFrame({"LCNS_KEY": ["A", "B"], "MOVE_PRE_KEY": [None, "B"], "REPL_PRE_KEY": [None, None],
                    "ANLS_LCNS_DTM": pd.to_datetime(["2020-01-01", "2020-01-01"])})
check("조건6 자기 자신 탐지", any("자기 자신" in p for p in R.check_links(bad)), True)

failed = [r for r in results if not r[1]]
for name, ok, detail in results:
    print(f"{'OK ' if ok else 'NG '} {name}" + ("" if ok else f"  ({detail})"))
print(f"\n{len(results) - len(failed)}/{len(results)} 통과")
sys.exit(1 if failed else 0)
