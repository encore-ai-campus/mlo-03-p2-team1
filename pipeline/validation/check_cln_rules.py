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
check("D1 지번 'N번지 M호' = 'N-M'", R.parse_jibun("서울특별시 강남구 대치동 1690번지 1호 삼풍프라자", TABLE)[3], "1690-1")
check("D1 지번 'N번지 M호 호실' 부번만", R.parse_jibun("서울특별시 강남구 대치동 820번지 9호 501호", TABLE)[3], "820-9")
check("D1 지번 'N번지 N층'은 부번 아님", R.parse_jibun("서울특별시 강남구 대치동 103번지 2층", TABLE)[3], "103")
check("F2 교체 키 번지 표기 통일", R.jibun_key(pd.Series(["서울 서초구 서초동 1690번지 1호  1층", "서울 서초구 서초동 1690-1 1층"])).nunique(), 1)
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
# [E7] 휴게음식점: PC방 표기 변형은 모두 비음식입지, 업태 커피숍은 카페A 우선, 상호 카페 키워드가 있어도 PC방류는 카페C 제외
rest = pd.DataFrame({
    "UPTAE_NM": ["기타 휴게음식점"] * 7 + ["일반조리판매", "커피숍", "과자점", "기타 휴게음식점", "기타 휴게음식점"],
    "BPLC_NM": ["언니네 피시방", "제노PC방", "본피씨방", "레벨업 PC CAFE", "옵티멈존 피씨카페", "짐박스피트니스", "하이롤러보드카페",
                "보드게임까페 레드버튼", "랭스터디카페", "고려당", "신전떡볶이", "피시프레소"],
})
rest_cls = R.classify(rest, META, "food_rest")[0]
check("E7 비음식입지 표기별", rest_cls["INDUTY_RULE_CD"].tolist(),
      ["비음식입지"] * 8 + ["카페A", "과자점_업태", "나머지", "나머지"])
check("E7 휴게음식점 코드", rest_cls["ANLS_INDUTY_CD"].tolist()[-2:], ["휴게음식점", "휴게음식점"])


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

# [G5] 실거래가 법정동: 현행 코드 유지 / SGG_CD + UMD_NM 재조회 / 실패면 NULL
ld = pd.DataFrame({"LDONG_CD": ["1114016200", "1120004900", "1162010100", "4113510100", "4113710100"],
                   "LDONG_NM": ["서울특별시 중구 신당동", "서울특별시 성동구 신당동", "서울특별시 관악구 봉천동",
                                "경기도 성남시 분당구 정자동", "경기도 성남시 수정구 정자동"],
                   "ABL_YN": [False, True, False, False, False]})
tr = pd.DataFrame({"LDONG_CD": ["1114016200", "1162099900", "1120016200"], "SGG_CD": ["11140", "11620", "11200"],
                   "UMD_NM": ["신당동", "봉천동", "신당동"]})
code, src = R.trade_ldong(tr, set(ld.loc[~ld["ABL_YN"], "LDONG_CD"]), R.sgg_umd_lookup(ld))
check("G5 현행 코드 유지 / 재조회 / 폐지 동명은 실패(NULL)", (nn(code), list(src)),
      (["1114016200", "1162010100", None], ["원본코드", "시군구_동명", "실패"]))
check("G5 폐지 코드는 재조회 표에 없음", ("11200", "신당동") in R.sgg_umd_lookup(ld), False)
# [G5] 읍면 + 리 이름 (전월세 UMD_NM 형식 '강화읍 갑곳리'), 시군구 안에 같은 리 이름이 둘이면 마지막 이름만으로는 찾지 않음
ld2 = pd.DataFrame({"LDONG_CD": ["2871000000", "2871025021", "2871031021", "2871032021"],
                    "LDONG_NM": ["인천광역시 강화군", "인천광역시 강화군 강화읍 갑곳리", "인천광역시 강화군 선원면 창리",
                                 "인천광역시 강화군 불은면 창리"], "ABL_YN": [False, False, False, False]})
lk2 = R.sgg_umd_lookup(ld2)
check("G5 읍면+리 전체 이름 / 리 이름만 (유일할 때만)",
      (lk2.get(("28710", "강화읍 갑곳리")), lk2.get(("28710", "갑곳리")), lk2.get(("28710", "선원면 창리")), lk2.get(("28710", "창리"))),
      ("2871025021", "2871025021", "2871031021", None))
# [L1] 법정동 계층: 구분과 이름 (세종처럼 시군구가 없으면 SGG_NM NULL)
ld4 = pd.DataFrame({"LDONG_CD": ["4100000000", "4111000000", "4111100000", "4111110100", "4182025021", "3611010100", "3611000000"],
                    "LDONG_NM": ["경기도", "경기도 수원시", "경기도 수원시 장안구", "경기도 수원시 장안구 파장동",
                                 "경기도 가평군 가평읍 읍내리", "세종특별자치시 반곡동", "세종특별자치시"], "ABL_YN": [False] * 7})
h = R.ldong_hierarchy(ld4.assign(LDONG_CD=ld4["LDONG_CD"]).iloc[[0, 1, 2, 3, 5, 6]].reset_index(drop=True))
check("L1 구분 (시도/시군구/일반구/읍면동)", list(h["LDONG_SE_CD"]), ["시도", "시군구", "시군구", "읍면동", "읍면동", "시군구"])
check("L1 이름 (일반구, 세종)", (nn(h["SGG_NM"]), nn(h["UMD_NM"])),
      ([None, "수원시", "수원시 장안구", "수원시 장안구", None, None], [None, None, None, "파장동", "반곡동", None]))
ld5 = pd.concat([ld4, pd.DataFrame({"LDONG_CD": ["4182000000", "4182025000"], "LDONG_NM": ["경기도 가평군", "경기도 가평군 가평읍"],
                                    "ABL_YN": [False, False]})], ignore_index=True)
h5 = R.ldong_hierarchy(ld5).iloc[4]
check("L1 리 (읍면 + 리)", [h5["LDONG_SE_CD"], h5["SGG_NM"], h5["UMD_NM"], h5["RI_NM"]], ["리", "가평군", "가평읍", "읍내리"])
ld6 = pd.DataFrame({"LDONG_CD": ["4176000000", "4176001000", "4176001002"], "LDONG_NM": ["경기도 시흥군", "경기도 시흥군 소하읍",
                    "경기도 시흥군 소래면 옥길리"], "ABL_YN": [True] * 3})
h6 = R.ldong_hierarchy(ld6).iloc[2]
check("L1 옛 리: 상위 읍면 이름이 다르면 자기 이름에서 나눔", [h6["UMD_NM"], h6["RI_NM"]], ["소래면", "옥길리"])
# [H1] 심평원: 도로명 주소의 정식 시군구 이름(가장 긴 이름 우선) → SGG_CD, UMD_NM → 도로명 괄호 동명 → 정규화 → 실패
ld3 = pd.DataFrame({"LDONG_CD": ["4111000000", "4111500000", "4111510100", "1171000000", "1171010900"],
                    "LDONG_NM": ["경기도 수원시", "경기도 수원시 팔달구", "경기도 수원시 팔달구 매산로3가", "서울특별시 송파구",
                                 "서울특별시 송파구 방이동"], "ABL_YN": [False] * 5})
addr = pd.Series(["경기도 수원시 팔달구 고화로 1, (매산로3가)", "서울특별시 송파구 오금로 1 (방이1동)", "광주광역시 동구 1 (계림동)"])
sgg = R.sgg_by_addr(addr, ld3)
check("H1 도로명 주소 → 법정 시군구 (가장 긴 이름, 옛 시도 이름은 실패)", nn(sgg), ["41115", "11710", None])
code, src, _ = R.hira_ldong(sgg, pd.Series(["매산로3가", None, "계림동"]), addr, R.sgg_umd_lookup(ld3))
check("H1 동명 / 괄호 동명 정규화 / 시군구 실패", (nn(code), list(src)),
      (["4111510100", "1171010900", None], ["시군구_동명", "도로명_정규화", "실패"]))
# [G2] 동일 조건 거래: 해제 행은 묶음에서 빼고, 키 7개가 같은 해제 아닌 행만 묶음
k = dict(APT_KEY="A1", DEAL_DTM=pd.Timestamp("2024-01-05"), DEAL_AMT_NUM=1e9, EXCL_AREA_NUM=84.9, FLR_NUM=10, APT_DONG_TXT=None)
deals = pd.DataFrame([dict(k, LDONG_CD="1111010100", CNCL_YN=False), dict(k, LDONG_CD="1111010100", CNCL_YN=False),
                      dict(k, LDONG_CD="1111010100", CNCL_YN=True), dict(k, LDONG_CD="1111010200", CNCL_YN=False)])
check("G2 동일 조건 묶음 (해제·다른 동 제외)", list(R.same_deal(deals).notna()), [True, True, False, False])

# 완료 조건 6 검사 함수
bad = pd.DataFrame({"LCNS_KEY": ["A", "B"], "MOVE_PRE_KEY": [None, "B"], "REPL_PRE_KEY": [None, None],
                    "ANLS_LCNS_DTM": pd.to_datetime(["2020-01-01", "2020-01-01"])})
check("조건6 자기 자신 탐지", any("자기 자신" in p for p in R.check_links(bad)), True)

failed = [r for r in results if not r[1]]
for name, ok, detail in results:
    print(f"{'OK ' if ok else 'NG '} {name}" + ("" if ok else f"  ({detail})"))
print(f"\n{len(results) - len(failed)}/{len(results)} 통과")
sys.exit(1 if failed else 0)
