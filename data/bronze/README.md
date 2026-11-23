# bronze — 1차 Bronze (parquet)

- 실행 스크립트: `python 01_bronze.py` (시작 2026-11-19T15:43:37+09:00, 종료 2026-11-19T16:14:05+09:00)
- 입력: `Source/` (읽기 전용) · 설정: `config.py` 의 `DATASETS`, `BRONZE`
- **완료 조건 결과: 통과**
  - 원천 행 수 = bronze 행 수: 37/37 파일 일치
  - 원천 불변(실행 전후 SHA-256 동일): 예
  - 이번 실행에서 읽기 전용으로 바꾼 원천 파일: 0개
  - 재실행 동일성: '재실행' 열이 `unchanged` 면 기존 파일과 바이트까지 같음 (처음 실행은 `created`)

## 파일

| 데이터셋 | 파일 (bronze/ 기준) | 원천 행 | bronze 행 | 행 수 | 열 수 | 크기 | 재실행 | SHA-256(앞12) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_강원_202609.parquet | 109,517 | 109,517 | OK | 39 | 13.4 MB | unchanged | 5949c09dc565 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_경기_202609.parquet | 666,254 | 666,254 | OK | 39 | 86.1 MB | unchanged | af30d6ec1ff1 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_경남_202609.parquet | 170,781 | 170,781 | OK | 39 | 21.2 MB | unchanged | 74859deaf165 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_경북_202609.parquet | 143,799 | 143,799 | OK | 39 | 18.5 MB | unchanged | 661d8846c2c3 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_대구_202609.parquet | 116,628 | 116,628 | OK | 39 | 12.7 MB | unchanged | d051a8ef3176 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_대전_202609.parquet | 79,691 | 79,691 | OK | 39 | 7.6 MB | unchanged | ae8005d6d115 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_부산_202609.parquet | 157,296 | 157,296 | OK | 39 | 17.3 MB | unchanged | 9bcb9dab7e7b |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_서울_202609.parquet | 552,422 | 552,422 | OK | 39 | 64.8 MB | unchanged | d6e23454eff6 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_세종_202609.parquet | 15,637 | 15,637 | OK | 39 | 1.2 MB | unchanged | 087b7b491aac |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_울산_202609.parquet | 53,777 | 53,777 | OK | 39 | 5.2 MB | unchanged | aa383a4e277d |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_인천_202609.parquet | 136,379 | 136,379 | OK | 39 | 13.6 MB | unchanged | 84c7563b2454 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_전남광주_202609.parquet | 178,050 | 178,050 | OK | 39 | 22.3 MB | unchanged | ed0ef339810f |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_전북_202609.parquet | 97,942 | 97,942 | OK | 39 | 11.5 MB | unchanged | 1c9b20d38ff1 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_제주_202609.parquet | 59,101 | 59,101 | OK | 39 | 6.3 MB | unchanged | b117fcec9bf3 |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_충남_202609.parquet | 123,567 | 123,567 | OK | 39 | 14.8 MB | unchanged | 94c73b049aeb |
| store_info | store_info/01_bronze__store_info__소상공인시장진흥공단_상가(상권)정보_충북_202609.parquet | 92,937 | 92,937 | OK | 39 | 10.6 MB | unchanged | ff017b088bd6 |
| hira_inst | hira_inst/01_bronze__hira_inst__1.병원정보서비스(2026.9.).parquet | 79,899 | 79,899 | OK | 30 | 8.1 MB | unchanged | ed8e382a461c |
| hira_inst | hira_inst/01_bronze__hira_inst__10.의료기관별상세정보서비스_08_특수진료정보서비스(2026.9.).parquet | 66,494 | 66,494 | OK | 4 | 1.6 MB | unchanged | 365ae0ff7492 |
| hira_inst | hira_inst/01_bronze__hira_inst__11.의료기관별상세정보서비스_09_전문병원지정분야(2026.9.).parquet | 110 | 110 | OK | 4 | 7.7 KB | unchanged | 78aa3099895b |
| hira_inst | hira_inst/01_bronze__hira_inst__12.의료기관별상세정보서비스_10_기타인력정보(2026.9.).parquet | 44,245 | 44,245 | OK | 5 | 1.3 MB | unchanged | 5b1707fc7075 |
| hira_inst | hira_inst/01_bronze__hira_inst__2.약국정보서비스(2026.9.).parquet | 25,850 | 25,850 | OK | 15 | 2.6 MB | unchanged | b69a5802d171 |
| hira_inst | hira_inst/01_bronze__hira_inst__3.의료기관별상세정보서비스_01_시설정보(2026.9.).parquet | 105,749 | 105,749 | OK | 30 | 9.0 MB | unchanged | 22a28ec142c7 |
| hira_inst | hira_inst/01_bronze__hira_inst__4.의료기관별상세정보서비스_02_세부정보(2026.9.).parquet | 25,079 | 25,079 | OK | 34 | 2.4 MB | unchanged | 721d3f184923 |
| hira_inst | hira_inst/01_bronze__hira_inst__5.의료기관별상세정보서비스_03_진료과목정보(2026.9.).parquet | 435,675 | 435,675 | OK | 6 | 6.2 MB | unchanged | f18c3b16625c |
| hira_inst | hira_inst/01_bronze__hira_inst__6.의료기관별상세정보서비스_04_교통정보(2026.9.).parquet | 40,192 | 40,192 | OK | 8 | 1.3 MB | unchanged | 2c9e41eb5854 |
| hira_inst | hira_inst/01_bronze__hira_inst__7.의료기관별상세정보서비스_05_의료장비정보(2026.9.).parquet | 63,460 | 63,460 | OK | 5 | 1.7 MB | unchanged | 1f6c4b20539e |
| hira_inst | hira_inst/01_bronze__hira_inst__8.의료기관별상세정보서비스_06_식대가산정보(2026.9.).parquet | 15,534 | 15,534 | OK | 7 | 363.7 KB | unchanged | a0dd6ed391bc |
| hira_inst | hira_inst/01_bronze__hira_inst__9.의료기관별상세정보서비스_07_간호등급정보(2026.9.).parquet | 12,722 | 12,722 | OK | 5 | 216.6 KB | unchanged | de6696c87014 |
| ldong_code | ldong_code/01_bronze__ldong_code__법정동코드_전체자료.parquet | 53,403 | 53,403 | OK | 3 | 1.1 MB | unchanged | e72ad9ad640b |
| apt_trade | apt_trade/01_bronze__apt_trade.parquet | 4,265,480 | 4,265,480 | OK | 32 | 261.6 MB | updated | 9231d34b87d4 |
| apt_rent | apt_rent/01_bronze__apt_rent.parquet | 8,001,132 | 8,001,132 | OK | 25 | 330.0 MB | updated | 96877dcebefa |
| food_general | food_general/01_bronze__food_general__20261118.parquet | 540,008 | 540,008 | OK | 39 | 50.2 MB | unchanged | 0b65acefadff |
| food_general_file | food_general_file/01_bronze__food_general_file__서울시_일반음식점_인허가_정보.parquet | 540,008 | 540,008 | OK | 42 | 58.1 MB | unchanged | bae922cf3d91 |
| food_rest | food_rest/01_bronze__food_rest__20261118.parquet | 148,778 | 148,778 | OK | 39 | 14.6 MB | unchanged | b94aab4fe977 |
| clinic | clinic/01_bronze__clinic__20261119.parquet | 37,791 | 37,791 | OK | 30 | 3.9 MB | unchanged | d9185b86b806 |
| pharmacy | pharmacy/01_bronze__pharmacy__20261119.parquet | 22,500 | 22,500 | OK | 24 | 1.9 MB | unchanged | 0673ab46fab3 |
| beauty | beauty/01_bronze__beauty__20261119.parquet | 100,349 | 100,349 | OK | 37 | 10.7 MB | unchanged | a4ffffffc8f5 |

## 원천 대응

| 데이터셋 | 원천 (Source 기준 경로 !/zip 안쪽 #시트) | 인코딩 | 비고 |
| --- | --- | --- | --- |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_강원_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_경기_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_경남_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_경북_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_대구_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_대전_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_부산_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_서울_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_세종_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_울산_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_인천_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_전남광주_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_전북_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_제주_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_충남_202609.csv | utf-8-sig |  |
| store_info | Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip!/소상공인시장진흥공단_상가(상권)정보_충북_202609.csv | utf-8-sig |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/1.병원정보서비스(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/10.의료기관별상세정보서비스_08_특수진료정보서비스(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/11.의료기관별상세정보서비스_09_전문병원지정분야(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/12.의료기관별상세정보서비스_10_기타인력정보(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/2.약국정보서비스(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/3.의료기관별상세정보서비스_01_시설정보(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/4.의료기관별상세정보서비스_02_세부정보(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/5.의료기관별상세정보서비스_03_진료과목정보(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/6.의료기관별상세정보서비스_04_교통정보(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/7.의료기관별상세정보서비스_05_의료장비정보(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/8.의료기관별상세정보서비스_06_식대가산정보(2026.9.).csv | cp949 |  |
| hira_inst | Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip!/9.의료기관별상세정보서비스_07_간호등급정보(2026.9.).csv | cp949 |  |
| ldong_code | Source/files/ldong_code/법정동코드 전체자료.zip!/법정동코드 전체자료.txt | cp949 |  |
| apt_trade | Source/api/apt_trade/200601/apt_trade__11110_200601__p0001.xml 외 19799개 | - | 원천 19800개 파일 결합 |
| apt_rent | Source/api/apt_rent/201101/apt_rent__11110_201101__p0001.xml 외 19799개 | - | 원천 19800개 파일 결합 |
| food_general | Source/api/food_general/20261118/food_general__20261118__r0000001-0001000.xml 외 540개 | - | 20261118 폴더 원천 541개 파일 결합 |
| food_general_file | Source/files/food_general_file/서울시 일반음식점 인허가 정보.csv | cp949 |  |
| food_rest | Source/api/food_rest/20261118/food_rest__20261118__r0000001-0001000.xml 외 148개 | - | 20261118 폴더 원천 149개 파일 결합 |
| clinic | Source/api/clinic/20261119/clinic__20261119__r0000001-0001000.xml 외 37개 | - | 20261119 폴더 원천 38개 파일 결합 |
| pharmacy | Source/api/pharmacy/20261119/pharmacy__20261119__r0000001-0001000.xml 외 22개 | - | 20261119 폴더 원천 23개 파일 결합 |
| beauty | Source/api/beauty/20261119/beauty__20261119__r0000001-0001000.xml 외 100개 | - | 20261119 폴더 원천 101개 파일 결합 |

## Bronze 규칙

- 원천 값을 바꾸지 않는다: 모든 열을 문자열로 저장하고 공백·형식·단위·열 이름을 그대로 둔다.
- 추가하는 열은 두 개뿐이다: `_source_file`(원천 경로, zip 안쪽 파일은 `!/`, 시트는 `#`), `_source_row`(원천 데이터 행 번호, 1부터).
- 원천 행 수는 pandas 와 다른 방법(csv 모듈, openpyxl, XML item 개수)으로 따로 세어 비교한다. 빈 줄은 행으로 세지 않는다.
- 파일명: `01_bronze__{데이터셋}__{원천이름}.parquet` (API 처럼 작은 파일이 많은 원천은 `01_bronze__{데이터셋}.parquet` 하나로 결합, 스냅샷 원천은 `01_bronze__{데이터셋}__{스냅샷폴더}.parquet` 로 폴더마다 하나. 완료 표시가 없는 스냅샷은 만들지 않음).
- 재현성: 원천 정렬 순서·row group 크기·압축 방식을 고정하고, 실행 시각 같은 값을 파일에 넣지 않는다. 결과가 기존 파일과 같으면 기존 파일을 그대로 둔다. `content_sha256` 은 라이브러리 버전과 무관한 데이터 내용 해시다.
- Excel 은 셀 값을 문자열로 바꿔 저장하므로 숫자 `1` 은 `1`, 실수는 `37.5`, 날짜는 `2026-01-01 00:00:00` 처럼 보인다.

## 데이터셋 설정 (config.DATASETS)

| name | kind | source | zip_member | sheet_name | encoding | sep | header | usecols | output | done_marker | enabled |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| store_info | csv | files/store_info/*.zip | *.csv | - | auto | , | 0 | - | per_file | - | True |
| hira_inst | csv | files/hira_inst/*.zip | *.csv | * | - | - | 0 | - | per_file | - | True |
| ldong_code | csv | files/ldong_code/* | *.txt | - | auto | \t | 0 | - | per_file | - | True |
| apt_trade | xml | api/apt_trade/**/*.xml | - | - | - | - | - | - | combined | - | True |
| apt_rent | xml | api/apt_rent/**/*.xml | - | - | - | - | - | - | combined | - | True |
| food_general | xml | api/food_general/**/*.xml | - | - | - | - | - | - | per_dir | _done_snapshot | True |
| food_general_file | csv | files/food_general_file/*.csv | - | - | cp949 | , | 0 | - | per_file | - | True |
| food_rest | xml | api/food_rest/**/*.xml | - | - | - | - | - | - | per_dir | _done_snapshot | True |
| clinic | xml | api/clinic/**/*.xml | - | - | - | - | - | - | per_dir | _done_snapshot | True |
| pharmacy | xml | api/pharmacy/**/*.xml | - | - | - | - | - | - | per_dir | _done_snapshot | True |
| beauty | xml | api/beauty/**/*.xml | - | - | - | - | - | - | per_dir | _done_snapshot | True |

파일별 원천·Parquet 행 수, 행 수 일치 여부, 열 목록, Parquet SHA-256은 `report/bronze/01_bronze__manifest.csv`에서 확인할 수 있다.
