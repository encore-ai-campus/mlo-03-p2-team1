# silver — 2차 표준화 (parquet)

- 실행: `python pipeline/silver/02_normalize.py` (시작 2026-11-21T22:30:53+09:00, 종료 2026-11-21T22:37:16+09:00)
- 입력: `data/bronze/` (읽기만 함) · 기준: `metadata/std_*.csv`
- 상세 기록: `report/silver/02_silver__manifest.csv`, `report/silver/02_silver__change_log.csv`
- **완료 조건 결과: 통과**
  - silver 행 수 = bronze 행 수: 37/37 파일
  - bronze 불변 (실행 전후 SHA-256 동일): 예
  - 재실행 동일성: `재실행` 이 `unchanged` 면 기존 파일과 바이트까지 같음 (처음 실행은 `created`)

## 파일

| 데이터셋 | 파일 (silver/ 기준) | bronze 행 | silver 행 | 행 수 | 열 수 | 변환 실패 칸 | 크기 | 재실행 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| apt_rent | apt_rent/02_silver__apt_rent.parquet | 8,001,132 | 8,001,132 | OK | 28 | 24,246 | 186.3 MB | created |
| apt_trade | apt_trade/02_silver__apt_trade.parquet | 4,265,480 | 4,265,480 | OK | 34 | 0 | 105.0 MB | created |
| beauty | beauty/02_silver__beauty__20261119.parquet | 100,349 | 100,349 | OK | 40 | 1 | 9.3 MB | created |
| clinic | clinic/02_silver__clinic__20261119.parquet | 37,791 | 37,791 | OK | 33 | 0 | 3.5 MB | created |
| food_general | food_general/02_silver__food_general__20261118.parquet | 540,008 | 540,008 | OK | 42 | 0 | 44.0 MB | created |
| food_general_file | food_general_file/02_silver__food_general_file__서울시_일반음식점_인허가_정보.parquet | 540,008 | 540,008 | OK | 45 | 0 | 50.2 MB | created |
| food_rest | food_rest/02_silver__food_rest__20261118.parquet | 148,778 | 148,778 | OK | 42 | 0 | 12.9 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__1.병원정보서비스(2026.9.).parquet | 79,899 | 79,899 | OK | 33 | 0 | 8.1 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__10.의료기관별상세정보서비스_08_특수진료정보서비스(2026.9.).parquet | 66,494 | 66,494 | OK | 7 | 0 | 1.6 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__11.의료기관별상세정보서비스_09_전문병원지정분야(2026.9.).parquet | 110 | 110 | OK | 7 | 0 | 7.9 KB | created |
| hira_inst | hira_inst/02_silver__hira_inst__12.의료기관별상세정보서비스_10_기타인력정보(2026.9.).parquet | 44,245 | 44,245 | OK | 8 | 0 | 1.3 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__2.약국정보서비스(2026.9.).parquet | 25,850 | 25,850 | OK | 18 | 0 | 2.6 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__3.의료기관별상세정보서비스_01_시설정보(2026.9.).parquet | 105,749 | 105,749 | OK | 33 | 0 | 9.0 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__4.의료기관별상세정보서비스_02_세부정보(2026.9.).parquet | 25,079 | 25,079 | OK | 37 | 27 | 2.3 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__5.의료기관별상세정보서비스_03_진료과목정보(2026.9.).parquet | 435,675 | 435,675 | OK | 9 | 0 | 6.2 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__6.의료기관별상세정보서비스_04_교통정보(2026.9.).parquet | 40,192 | 40,192 | OK | 11 | 0 | 1.3 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__7.의료기관별상세정보서비스_05_의료장비정보(2026.9.).parquet | 63,460 | 63,460 | OK | 8 | 0 | 1.7 MB | created |
| hira_inst | hira_inst/02_silver__hira_inst__8.의료기관별상세정보서비스_06_식대가산정보(2026.9.).parquet | 15,534 | 15,534 | OK | 10 | 0 | 363.6 KB | created |
| hira_inst | hira_inst/02_silver__hira_inst__9.의료기관별상세정보서비스_07_간호등급정보(2026.9.).parquet | 12,722 | 12,722 | OK | 8 | 0 | 216.8 KB | created |
| ldong_code | ldong_code/02_silver__ldong_code__법정동코드_전체자료.parquet | 53,403 | 53,403 | OK | 6 | 0 | 1.1 MB | created |
| pharmacy | pharmacy/02_silver__pharmacy__20261119.parquet | 22,500 | 22,500 | OK | 27 | 0 | 1.7 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_강원_202609.parquet | 109,517 | 109,517 | OK | 43 | 160 | 12.7 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_경기_202609.parquet | 666,254 | 666,254 | OK | 43 | 4,770 | 82.1 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_경남_202609.parquet | 170,781 | 170,781 | OK | 43 | 59 | 20.2 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_경북_202609.parquet | 143,799 | 143,799 | OK | 43 | 10 | 17.5 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_대구_202609.parquet | 116,628 | 116,628 | OK | 43 | 36 | 12.2 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_대전_202609.parquet | 79,691 | 79,691 | OK | 43 | 29 | 7.3 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_부산_202609.parquet | 157,296 | 157,296 | OK | 43 | 135 | 16.6 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_서울_202609.parquet | 552,422 | 552,422 | OK | 43 | 8,674 | 62.1 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_세종_202609.parquet | 15,637 | 15,637 | OK | 43 | 55 | 1.2 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_울산_202609.parquet | 53,777 | 53,777 | OK | 43 | 12 | 5.1 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_인천_202609.parquet | 136,379 | 136,379 | OK | 43 | 793 | 13.2 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_전남광주_202609.parquet | 178,050 | 178,050 | OK | 43 | 48 | 21.2 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_전북_202609.parquet | 97,942 | 97,942 | OK | 43 | 19 | 11.0 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_제주_202609.parquet | 59,101 | 59,101 | OK | 43 | 50 | 6.1 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_충남_202609.parquet | 123,567 | 123,567 | OK | 43 | 94 | 14.1 MB | created |
| store_info | store_info/02_silver__store_info__소상공인시장진흥공단_상가(상권)정보_충북_202609.parquet | 92,937 | 92,937 | OK | 43 | 40 | 10.2 MB | created |

## 변환 실패가 많은 컬럼 (상위 20)

| 데이터셋 | 표준 컬럼 | 규칙 | 실패 칸 | 실패 예시 |
| --- | --- | --- | --- | --- |
| apt_rent | CNTRCT_BGN_DTM | TERM_BGN(%y.%m) | 24246 | ~20.11 |
| store_info | FLR_NUM | FLOOR | 14984 | 지 |
| hira_inst | TRMT_SAT_END_DTM | HHMM | 3 | 2410 |
| hira_inst | TRMT_FRI_END_DTM | HHMM | 3 | 2410 |
| hira_inst | TRMT_THU_END_DTM | HHMM | 3 | 2410 |
| hira_inst | TRMT_TUE_END_DTM | HHMM | 3 | 2410 |
| hira_inst | TRMT_SUN_END_DTM | HHMM | 3 | 2410 |
| hira_inst | TRMT_MON_END_DTM | HHMM | 3 | 2410 |
| hira_inst | TRMT_WED_END_DTM | HHMM | 3 | 2410 |
| hira_inst | TRMT_MON_BGN_DTM | HHMM | 1 | 93 |
| beauty | CLSBIZ_DTM | DATE(%Y-%m-%d) | 1 | 20060229                 |
| hira_inst | TRMT_FRI_BGN_DTM | HHMM | 1 | 93 |
| hira_inst | TRMT_SAT_BGN_DTM | HHMM | 1 | 93 |
| hira_inst | TRMT_THU_BGN_DTM | HHMM | 1 | 93 |
| hira_inst | TRMT_TUE_BGN_DTM | HHMM | 1 | 93 |
| hira_inst | TRMT_WED_BGN_DTM | HHMM | 1 | 93 |

실패한 칸은 NULL 이고, 그 행의 `STD_ERR_TXT` 에 표준 컬럼명이 남는다. 원래 값은 `SRC_FILE_NM` + `SRC_ROW_NUM` 으로 bronze 에서 찾는다.
