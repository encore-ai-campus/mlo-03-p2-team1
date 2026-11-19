# Source — 원천 데이터 (읽기 전용)

- 갱신 시각: 2026-11-19T14:55:29+09:00 (`python 00_collect.py inventory`)
- 이 폴더의 원천 파일은 수정·이동·덮어쓰기 하지 않는다. 모든 파일은 읽기 전용 속성이다.
- 출처와 수집 방법: 프로젝트 루트의 `data_collecting.md`
- 전체 파일 수: 40458 / 전체 크기: 10.0 GB
- 전체 데이터 행 수(ROW): 17,378,236
- 전체 목록과 SHA-256 전체 값: `Source/_source_manifest.csv`

## 데이터 행 수 (ROW)

- 헤더 행 제외, 빈 줄 제외. zip 은 압축을 풀지 않고 안쪽 파일을 읽어서 센다.
- csv: `csv` 모듈로 센 레코드 수 / xml(API 응답): `<item>` 개수 (`common/source_io.count_source_rows`, 01_bronze.py 검증과 동일 기준)
- `source_units`: csv 는 zip 안쪽 파일 수, xml 은 응답 페이지 파일 수

| dataset | title | kind | source_units | rows |
| --- | --- | --- | --- | --- |
| store_info | 소상공인시장진흥공단_상가(상권)정보 | csv | 16 | 2,753,778 |
| hira_inst | 건강보험심사평가원_전국 병의원 및 약국 현황 | csv | 12 | 915,009 |
| ldong_code | 행정표준코드관리시스템_법정동코드 전체자료 | csv | 1 | 53,403 |
| apt_trade | 국토교통부_아파트 매매 실거래가 상세 자료 | xml | 19800 | 4,265,480 |
| apt_rent | 국토교통부_아파트 전월세 실거래가 자료 | xml | 19800 | 8,001,132 |
| food_general | 서울시 일반음식점 인허가 정보 | xml | 541 | 540,008 |
| food_general_file | 서울시 일반음식점 인허가 정보 (CSV, 42개 컬럼) | csv | 1 | 540,008 |
| food_rest | 서울시 휴게음식점 인허가 정보 | xml | 149 | 148,778 |
| clinic | 서울시 의원 인허가 정보 | xml | 38 | 37,791 |
| pharmacy | 서울시 약국 인허가 정보 | xml | 23 | 22,500 |
| beauty | 서울시 미용업 인허가 정보 | xml | 101 | 100,349 |
| **합계** |  |  | 40482 | 17,378,236 |

### 파일별 행 수 (Source/files)

| dataset | file | rows |
| --- | --- | --- |
| store_info | 소상공인시장진흥공단_상가(상권)정보_강원_202609.csv | 109,517 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_경기_202609.csv | 666,254 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_경남_202609.csv | 170,781 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_경북_202609.csv | 143,799 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_대구_202609.csv | 116,628 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_대전_202609.csv | 79,691 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_부산_202609.csv | 157,296 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_서울_202609.csv | 552,422 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_세종_202609.csv | 15,637 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_울산_202609.csv | 53,777 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_인천_202609.csv | 136,379 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_전남광주_202609.csv | 178,050 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_전북_202609.csv | 97,942 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_제주_202609.csv | 59,101 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_충남_202609.csv | 123,567 |
| store_info | 소상공인시장진흥공단_상가(상권)정보_충북_202609.csv | 92,937 |
| hira_inst | 1.병원정보서비스(2026.9.).csv | 79,899 |
| hira_inst | 10.의료기관별상세정보서비스_08_특수진료정보서비스(2026.9.).csv | 66,494 |
| hira_inst | 11.의료기관별상세정보서비스_09_전문병원지정분야(2026.9.).csv | 110 |
| hira_inst | 12.의료기관별상세정보서비스_10_기타인력정보(2026.9.).csv | 44,245 |
| hira_inst | 2.약국정보서비스(2026.9.).csv | 25,850 |
| hira_inst | 3.의료기관별상세정보서비스_01_시설정보(2026.9.).csv | 105,749 |
| hira_inst | 4.의료기관별상세정보서비스_02_세부정보(2026.9.).csv | 25,079 |
| hira_inst | 5.의료기관별상세정보서비스_03_진료과목정보(2026.9.).csv | 435,675 |
| hira_inst | 6.의료기관별상세정보서비스_04_교통정보(2026.9.).csv | 40,192 |
| hira_inst | 7.의료기관별상세정보서비스_05_의료장비정보(2026.9.).csv | 63,460 |
| hira_inst | 8.의료기관별상세정보서비스_06_식대가산정보(2026.9.).csv | 15,534 |
| hira_inst | 9.의료기관별상세정보서비스_07_간호등급정보(2026.9.).csv | 12,722 |
| ldong_code | 법정동코드 전체자료.txt | 53,403 |
| food_general_file | 서울시 일반음식점 인허가 정보.csv | 540,008 |

## 내려받은 파일 (Source/files)

| file | size | sha256 | read_only | dataset | source_page |
| --- | --- | --- | --- | --- | --- |
| Source/files/food_general_file/서울시 일반음식점 인허가 정보.csv | 228.6 MB | 1d8f308440d7f09d | True | 서울시 일반음식점 인허가 정보 (CSV, 42개 컬럼) | https://data.seoul.go.kr/dataList/OA-16094/S/1/datasetView.do |
| Source/files/hira_inst/건강보험심사평가원_전국 병의원 및 약국 현황_20260930.zip | 19.7 MB | ceff684b8eb1dc90 | True | 건강보험심사평가원_전국 병의원 및 약국 현황 | https://www.data.go.kr/data/15051059/fileData.do |
| Source/files/ldong_code/법정동코드 전체자료.zip | 403.8 KB | 44a3fe4cacf88ce9 | True | 행정표준코드관리시스템_법정동코드 전체자료 | https://www.code.go.kr |
| Source/files/store_info/소상공인시장진흥공단_상가(상권)정보_20260930.zip | 332.9 MB | c83b30e7a1d11448 | True | 소상공인시장진흥공단_상가(상권)정보 | https://www.data.go.kr/data/15083033/fileData.do |

## API 응답 (Source/api)

| ds | files | bytes |
| --- | --- | --- |
| apt_rent | 19800 | 5.2 GB |
| apt_trade | 19800 | 3.3 GB |
| beauty | 101 | 112.0 MB |
| clinic | 38 | 41.9 MB |
| food_general | 541 | 592.5 MB |
| food_rest | 149 | 164.7 MB |
| pharmacy | 23 | 18.6 MB |

## 폴더 구조

```text
Source/
├── files/{데이터셋}/   내려받은 원본 파일 (zip 은 압축을 풀지 않고 그대로 보관)
├── api/{데이터셋}/{계약년월}/   API 응답 XML (데이터셋__시군구_년월__p페이지.xml)
├── api/{데이터셋}/{수집일}/     서울 API 응답 XML (데이터셋__수집일__r시작-끝.xml, 1,000건 단위 스냅샷)
├── api/_collect_log.csv   API 호출 기록 (인증키 제외)
├── api/_seoul_collect_log.csv   서울 API 호출 기록 (인증키 제외)
├── _source_manifest.csv   전체 파일 목록·크기·SHA-256
└── README.md
```
