# 데이터 수집 설명서 (data_collecting.md)

이 프로젝트(서울 · 법정동 아파트 매매가 예측, `INTENT.md` 참고)의 원천 데이터를 **어디서, 어떤 방법으로, 어떤 형태로** 가져오는지 정리한 문서입니다.
수집 결과는 모두 `data/source/` 폴더에 원본 그대로 저장되며, 이후 단계는 이 폴더를 읽기만 합니다.
수집 코드는 `pipeline/source/00_collect.py`, 출처 정의는 `metadata/src_source.csv`, 실거래 수집 계획은 `metadata/src_collect_plan.csv` 에 있습니다. 명령은 모두 프로젝트 루트(`mlo-03-p2-team1/`)에서 실행합니다.

## 1. 원천 데이터 목록

| # | 데이터셋 (`metadata/` 이름) | 제공기관 | 수집 방식 | 형식 | 갱신 주기 | 출처 페이지 | 인증키 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 아파트 매매 실거래가 상세 (`apt_trade`) | 국토교통부 | Open API | XML | 수시 (신고 기준) | https://www.data.go.kr/data/15126468/openapi.do | 필요 |
| 2 | 아파트 전월세 실거래가 (`apt_rent`) | 국토교통부 | Open API | XML | 수시 | https://www.data.go.kr/data/15126474/openapi.do | 필요 |
| 3 | 상가(상권)정보 (`store_info`) | 소상공인시장진흥공단 | 파일 다운로드 | ZIP(CSV) | 분기 | https://www.data.go.kr/data/15083033/fileData.do | 불필요 |
| 4 | 전국 병의원 및 약국 현황 (`hira_inst`) | 건강보험심사평가원 | 파일 다운로드 | ZIP(XLSX) | 분기·연말 | https://www.data.go.kr/data/15051059/fileData.do | 불필요 |
| 5 | 법정동코드 전체자료 (`ldong_code`) | 행정안전부 (행정표준코드관리시스템) | 파일 다운로드 | ZIP(TXT, 탭 구분) | 수시 | https://www.code.go.kr | 불필요 |
| 6 | 서울시 일반음식점 인허가 정보 (`food_general`) | 서울특별시 (서울 열린데이터광장) | Open API | XML | 매일 | https://data.seoul.go.kr/dataList/OA-23056/S/1/datasetView.do | 필요 (서울) |
| 7 | 서울시 휴게음식점 인허가 정보 (`food_rest`) | 서울특별시 (서울 열린데이터광장) | Open API | XML | 매일 (3일 전 자료) | https://data.seoul.go.kr/dataList/OA-16095/S/1/datasetView.do | 필요 (서울) |
| 8 | 서울시 의원 인허가 정보 (`clinic`) | 서울특별시 (서울 열린데이터광장) | Open API | XML | 매일 | https://data.seoul.go.kr/dataList/OA-16480/S/1/datasetView.do | 필요 (서울) |
| 9 | 서울시 약국 인허가 정보 (`pharmacy`) | 서울특별시 (서울 열린데이터광장) | Open API | XML | 매일 | https://data.seoul.go.kr/dataList/OA-16484/S/1/datasetView.do | 필요 (서울) |
| 10 | 서울시 미용업 인허가 정보 (`beauty`) | 서울특별시 (서울 열린데이터광장) | Open API | XML | 매일 | https://data.seoul.go.kr/dataList/OA-16063/S/1/datasetView.do | 필요 (서울) |
| 11 | 서울시 일반음식점 인허가 정보 CSV, 보조 원천 (`food_general_file`) | 서울특별시 (서울 열린데이터광장) | 파일 다운로드 | CSV (cp949, 42개 컬럼) | 매일 (월 1회 받기 권장) | https://data.seoul.go.kr/dataList/OA-16094/S/1/datasetView.do | 불필요 |

- 병원·약국은 API(건강보험심사평가원 병원정보서비스·약국정보서비스)도 있지만, 인증키 없이 받을 수 있고 같은 API 데이터를 분기마다 추출해 둔 파일 데이터(#4)를 1차 원천으로 씁니다.
- 실거래가 API 의 지역 조건(`LAWD_CD`)은 법정동코드(#5)의 앞 5자리(시군구)입니다. 예: 서울 종로구 11110.
- 일반음식점은 API (#6)를 기본 원천으로 쓰고, API에 없는 `법정동코드`·`X좌표`·`Y좌표`(EPSG:5179 추정)를 보완하려고 42개 컬럼 CSV (#11)를 보조 원천으로 함께 받습니다 (2026-11-19 추가).
  두 원천은 관리번호 (`MGTNO` = `관리번호`)로 연결되며, 2026-11-19 기준 540,008건이 모두 일치합니다.
  3차에서 인허가 공통 테이블 `lcns` 의 법정동 (`ldong_src_cd`)·좌표 (`coord_src_cd`)를 채울 때 보조 원천 값을 먼저 쓰고 API 값·주소 매칭으로 보완합니다 (`설계서_초안.md` ERD).
- 이용 조건(라이선스)은 각 출처 페이지의 "이용허락범위"를 따릅니다.

## 2. 인증키 발급 (API 데이터 #1, #2)

1. https://www.data.go.kr 회원가입 후 로그인
2. 위 표의 출처 페이지(#1, #2)에서 **활용신청** → 활용 목적 입력 → 신청 (자동 승인)
3. 마이페이지 → 데이터활용 → Open API → 개발계정 → **일반 인증키(Decoding)** 복사
4. 프로젝트 폴더의 `.env` 파일에 붙여넣기 (`.env.example` 을 복사해서 만든다)

   ```text
   DATA_GO_KR_KEY=여기에_Decoding_키
   ```

- 인증키는 `.env` 에만 두고, 코드·문서·로그·채팅에 남기지 않습니다. `00_collect.py` 는 호출 기록(`_collect_log.csv`)에 인증키를 쓰지 않습니다.
- 개발계정은 하루 호출 수 제한이 있습니다(마이페이지에서 확인). 승인 직후에는 키가 동작하기까지 시간이 조금 걸릴 수 있습니다.

## 3. API 호출 방법

### 3.1 공통

| 항목 | 내용 |
| --- | --- |
| 방식 | HTTP GET, REST |
| 응답 | XML (UTF-8) |
| 정상 판별 | `response/header/resultCode` 가 `000` (구 버전 `00`) |
| 페이지 | `pageNo`(1부터), `numOfRows`(최대 1000). `totalCount` 를 넘을 때까지 pageNo 를 올려 반복 |
| 인증 | 쿼리 파라미터 `serviceKey` = Decoding 키 (requests 가 URL 인코딩) |

### 3.2 아파트 매매 실거래가 상세 (`apt_trade`)

- 요청 주소: `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev`

| 파라미터 | 필수 | 예시 | 설명 |
| --- | --- | --- | --- |
| serviceKey | 예 | (Decoding 키) | 인증키 |
| LAWD_CD | 예 | 11680 | 법정동코드 앞 5자리 (시군구) |
| DEAL_YMD | 예 | 202501 | 계약년월 (YYYYMM) |
| pageNo | 아니오 | 1 | 페이지 번호 |
| numOfRows | 아니오 | 1000 | 한 페이지 결과 수 |

요청 예시 (키는 가림):

```text
GET https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev
    ?serviceKey=****&LAWD_CD=11680&DEAL_YMD=202501&pageNo=1&numOfRows=1000
```

응답 구조 (주요 항목):

```xml
<response>
  <header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header>
  <body>
    <items>
      <item>
        <aptNm>단지명</aptNm><aptSeq>단지 일련번호</aptSeq><buildYear>건축년도</buildYear>
        <dealAmount>   82,500</dealAmount>   <!-- 만원, 쉼표·앞 공백 포함 문자열 -->
        <dealYear>2025</dealYear><dealMonth>1</dealMonth><dealDay>15</dealDay>
        <excluUseAr>84.97</excluUseAr><floor>12</floor><jibun>지번</jibun>
        <sggCd>11680</sggCd><umdCd>10300</umdCd><umdNm>법정동명</umdNm>
        <cdealType>해제여부</cdealType><cdealDay>해제사유발생일</cdealDay><dealingGbn>거래유형</dealingGbn>
      </item>
    </items>
    <numOfRows>1000</numOfRows><pageNo>1</pageNo><totalCount>143</totalCount>
  </body>
</response>
```

필드 이름·항목은 출처 페이지의 참고문서가 기준입니다. 첫 수집 후 실제 응답과 대조하세요.

### 3.3 아파트 전월세 실거래가 (`apt_rent`)

- 요청 주소: `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent`
- 파라미터: 매매와 같음 (`serviceKey`, `LAWD_CD`, `DEAL_YMD`, `pageNo`, `numOfRows`)
- 주요 응답 항목: 단지명, 건축년도, 보증금액(`deposit`, 만원), 월세금액(`monthlyRent`), 전용면적, 층, 계약기간, 계약구분, 법정동 정보
- 개인정보 보호를 위해 동·호 정보는 제공되지 않습니다.

### 3.4 수집 범위 (`metadata/src_collect_plan.csv`)

수집 범위는 "계획" 목록으로 관리합니다. 활성화된 계획의 (시군구 × 계약년월) 조합을 모두 합친 뒤,
이미 받은 조합(`_done_{시군구}` 표시가 있는 것)을 빼고 남은 조합만 호출합니다. 위에 있는 계획부터, 같은 계획 안에서는 최근 달부터 받습니다.

| 계획 | 데이터 | 시군구 | 계약년월 | 상태 | 조합 수 |
| --- | --- | --- | --- | --- | --- |
| 1차 기본 | 매매·전월세 | 마포·강남·송파 | 2024-07 ~ 2026-09 | 수집 완료 | 각 81 |
| 2차-A 기간 확장 | 매매·전월세 | 마포·강남·송파 | 2020-01 ~ 2024-06 | 수집 완료 | 각 162 |
| 2차-B 지역 확장 | 매매·전월세 | 서울 25개 구 | 2020-01 ~ 2026-09 | 수집 완료 | 각 1,782 |
| 3차-A 서울 과거 이력 | 매매 | 서울 25개 구 | 2006-01 ~ 2019-12 | 수집 완료 (2026-11-18) | 4,200 |
| 3차-A 서울 과거 이력 | 전월세 | 서울 25개 구 | 2011-01 ~ 2019-12 | 수집 완료 (2026-11-18) | 2,700 |
| 3차-B 수도권 확장 | 매매·전월세 | 인천·경기 69개 코드 | 2020-01 ~ 2026-09 | 수집 완료 (2026-11-19) | 각 5,589 |
| 4차 수도권 과거 이력 | 매매 | 인천·경기 74개 코드 | 2006-01 ~ 2019-12 | 수집 중 (11-19 7,769 완료) | 12,432 |
| 4차 수도권 과거 이력 | 전월세 | 인천·경기 74개 코드 | 2011-01 ~ 2019-12 | 수집 중 (11-19 7,355 완료) | 7,992 |
| 최신월 | 매매·전월세 | 서울 25개 구 | 2026-10 | 비활성 | 각 25 |

- API 제공 시작 시점: 매매 2006-01, 전월세 2011-01. 그 이전 달은 빈 응답이라 계획에 넣지 않았습니다.
- 3차 수집은 2026-11-18 ~ 11-19 이틀에 끝났습니다 (11-18 API별 9,900회로 한도 소진, 11-19 매매 2,074회·전월세 2,389회로 남은 조합 0개).
  실제 조합당 평균 페이지는 매매 약 1.01, 전월세 약 1.19 였습니다.
- 수집 결과 (2026-11-19, bronze 기준): 매매 2,633,635건 (서울 1,443,128 · 경기 972,049 · 인천 218,458),
  전월세 6,050,483건 (서울 3,107,551 · 경기 2,485,382 · 인천 457,550). 원천 XML 매매 11,974개 · 전월세 12,289개.
- 4차 수도권 과거 이력은 2026-11-19에 활성화했습니다. 활성화하면서 바꾼 점:
  - 매매·전월세 계획을 나눴습니다(전월세는 2011-01부터). 한 계획으로 두면 전월세 2006~2010 빈 호출이 약 4,400회 생깁니다.
  - 조회 코드(`src_collect_plan.csv` 4차 줄의 `sido:28;41` + `extra_sgg`)는 74개입니다: 3차-B와 같은 69개(인천·경기 현존 66개 + 인천 개편 전 3개)
    + 옛 코드 5개(인천 남구 28170, 부천시 옛 구 41195·41197·41199, 여주군 41730). 여주군(2013년 여주시로 전환)은 이번에 추가했습니다.
  - 2020년 이후 생긴 코드(인천 제물포·영종·서해·검단구, 부천·화성 새 구 등)는 과거 달에 빈 응답이 옵니다. 하루 일정에 영향이 없어 그대로 둡니다.
- 4차 진행 (2026-11-19): 매매 7,826회·전월세 7,511회 호출로 한도 소진. 받은 조합 매매 7,769 / 12,432, 전월세 7,355 / 7,992,
  받은 건수 매매 1,631,845건 · 전월세 1,950,649건 (빈 응답 매매 1,785회 · 전월세 1,692회).
  남은 조합(매매 4,663개 ≈ 4,700회, 전월세 637개 ≈ 700회)은 다음 날 `python pipeline/source/00_collect.py api` 한 번으로 끝납니다.
- 4차를 마치면 남는 계획은 최신월(비활성)뿐입니다.
- 수도권 시군구 코드는 법정동코드 원천(`data/source/files/ldong_code`)에서 인천(28)·경기(41)의 현존 시군구를 자동으로 뽑고,
  2025~2026 인천 행정구역 개편 전 코드(중구 28110, 동구 28140, 서구 28260)를 더했습니다. 개편 전 기간의 거래는 옛 코드로 조회됩니다.
- 구가 있는 시(수원시 41110 등)는 구 신설·폐지 시기 대비로 시 코드도 함께 조회합니다. 시 코드 응답이 구 코드 응답과 겹치면
  Bronze 에는 원본대로 두고 Silver 단계에서 자연키로 중복을 제거합니다.
- 최신월은 신고 기한(계약 후 30일)이 지나지 않아 건수가 계속 늘어나므로, 해당 월이 끝나고 한 달이 지난 뒤 `src_collect_plan.csv` 의 `enabled` 를 `Y` 로 바꿉니다.

### 3.5 일일 한도와 실행

- 개발계정 한도는 **API 하나당 하루 10,000회**이며, 매매와 전월세는 서로 다른 API 라 한도도 따로 계산합니다 (`pipeline/source/00_collect.py` 의 `API_DAILY_LIMIT`).
- 실행할 때마다 `_collect_log.csv` 에서 오늘(KST) 이미 호출한 수를 세어 **API 별 남은 한도 − 여유분 100회**까지만 호출합니다.
  별도 지정이 없으면 남은 한도를 전부 씁니다 (줄이려면 `--max-calls`).
- 한 API 가 한도에 닿으면(자체 계산 또는 resultCode 22·HTTP 429 응답) 그 API 만 멈추고 다른 API 는 계속 받습니다.

```bash
python pipeline/source/00_collect.py api --plan               # 호출 없이 계획별 남은 조합, 예상 호출 수, 오늘 남은 한도 확인
python pipeline/source/00_collect.py api                      # 오늘 남은 한도까지 수집 (다음 날 다시 실행하면 이어서)
python pipeline/source/00_collect.py api --dataset apt_trade  # 하나만
python pipeline/source/00_collect.py api --max-calls 3000     # 이번 실행에서 API 하나당 최대 3,000회만
```

- 저장: `data/source/api/{데이터셋}/{계약년월}/{데이터셋}__{시군구}_{계약년월}__p{페이지}.xml` (응답 원문 그대로)
- 기록: `data/source/logs/_collect_log.csv` 에 호출 시각, 요청주소, 파라미터, totalCount, 받은 건수, 저장 파일, SHA-256 이 이어서 쌓입니다 (인증키 제외).
- 중간에 끊긴 조합은 이미 저장한 페이지를 다시 호출하지 않고, 이어지는 페이지만 받습니다.
- 저장한 XML 은 읽기 전용이 되고, 다시 실행해도 덮어쓰지 않습니다.
- 수집 후 `python pipeline/bronze/01_bronze.py` 를 다시 실행하면 apt_trade / apt_rent 의 bronze parquet 가 늘어난 원천으로 다시 만들어집니다 (재실행 열 `updated`).

### 3.6 서울 열린데이터광장 API (`food_general`, `food_rest`, `clinic`, `pharmacy`, `beauty`)

| 항목 | 내용 |
| --- | --- |
| 인증키 | https://data.seoul.go.kr → 인증키 신청 (일반 인증키). `.env` 에 `DATA_SEOUL_GO_KR_KEY=...` |
| 요청 주소 | `http://openapi.seoul.go.kr:8088/{인증키}/xml/{서비스명}/{시작}/{끝}/` (인증키가 경로에 들어감, http 만 제공) |
| 서비스명 | 일반음식점 `LOCALDATA_072404` / 휴게음식점 `LOCALDATA_072405` / 의원 `LOCALDATA_010102` / 약국 `LOCALDATA_010106` / 미용업 `LOCALDATA_051801` (의원·약국·미용업은 출처 페이지에 서비스명이 없어 개방서비스ID 규칙으로 찾고 전체 건수로 확인, 2026-11-19) |
| 응답 | XML (UTF-8). 루트 = 서비스명, `list_total_count`, `RESULT/CODE`, 데이터 행 = `row` |
| 정상 판별 | `RESULT/CODE` 가 `INFO-000`. `INFO-200`(데이터 없음)은 끝으로 처리, `ERROR-500/600/601` 은 재시도, 그 밖의 코드(인증키 오류 `INFO-100` 등)는 즉시 멈춤 |
| 제한 | **1회 호출 최대 1,000건**, 호출 횟수 제한 없음 (`SEOUL_API_PAGE_SIZE = 1000`) |
| 지역·기간 조건 | 없음. 서울 전체 목록을 1번 행부터 끝까지 받는다 (일반 약 54만 건 ≈ 541회, 휴게 약 15만 건 ≈ 149회, 의원 약 3.8만 건 ≈ 38회, 약국 2.3만 건 ≈ 23회, 미용업 약 10만 건 ≈ 101회) |

```bash
python pipeline/source/00_collect.py seoul --plan                   # 전체 건수와 필요한 호출 수 (1건 조회만, 저장 안 함)
python pipeline/source/00_collect.py seoul                          # 서울 인허가 5개 데이터셋 전체 수집 → 오늘(KST) 스냅샷
python pipeline/source/00_collect.py seoul --dataset food_rest      # 하나만
python pipeline/source/00_collect.py seoul --max-calls 100          # 이번 실행에서 데이터셋 하나당 100회만 (다시 실행하면 이어서)
python pipeline/source/00_collect.py seoul --force                  # 이번 달 스냅샷이 있어도 오늘 스냅샷을 추가로 받음
```

- 저장: `data/source/api/{데이터셋}/{수집일 YYYYMMDD}/{데이터셋}__{수집일}__r{시작:7자리}-{끝:7자리}.xml` (응답 원문 그대로, 읽기 전용)
- 완료 표시: 끝까지 받으면 그 날짜 폴더에 `_done_snapshot` (받은 건수, 시작·끝 시점 전체 건수, 1,000건이 안 된 구간)을 남긴다.
  완료 표시가 없는 스냅샷은 중간에 끊긴 것이므로 bronze 대상에서 제외한다 (`metadata/ds_dataset.csv` 의 `per_dir` + `done_marker`).
  bronze 는 스냅샷 폴더마다 `data/bronze/{데이터셋}/01_bronze__{데이터셋}__{YYYYMMDD}.parquet` 하나.
- 기록: `data/source/logs/_seoul_collect_log.csv` (호출 시각, 서비스명, 수집일, 시작·끝, 결과코드, 전체 건수, 받은 건수, 파일, SHA-256 / 인증키 제외).
  오류 메시지에 요청 주소가 섞여도 인증키는 `***` 로 가린다.
- 원천은 매일 갱신되지만 **월 1회 스냅샷**으로 쌓는다 (`SEOUL_SNAPSHOT_EVERY = "month"`, 매월 1일 기준).
  - 이번 달에 완료 스냅샷이 있으면 호출하지 않고 끝난다 (inventory 도 생략). 그래서 매일 예약 실행해 두면 1일에 받고, PC 가 꺼져 있었으면 그 달 처음 실행한 날 받는다.
  - 같은 날 다시 실행하면 받아 둔 구간은 건너뛰고 이어 받는다. 이번 달 스냅샷을 하나 더 받으려면 `--force` (기존 스냅샷은 그대로 보존).
  - 주기 선택 근거: 하루 변경은 전체의 약 0.01%(수십~백여 건)이고, 개업·폐업 건수와 영업 업소 수는 행의 인허가일·폐업일로 계산되므로 월 스냅샷으로 충분하다.
    Gold 는 법정동 × 분기로 집계하고(2026-11-19 결정), 월 스냅샷은 상태·상호·업태 변경 이력(`lcns_hist`, SCD2)을 만드는 데 쓴다.
    1회 5종 합계 약 852회 호출 · 약 930MB(XML: 일반 594 · 휴게 166 · 미용업 113 · 의원 42 · 약국 19MB), 1년 약 11GB.
- 수집 도중(수 분) 원천이 갱신되면 행이 구간 경계를 넘어 일부 중복·누락될 수 있다. 전체 건수가 늘면 끝까지 따라가 받고,
  시작·끝 건수를 `_done_snapshot` 에 남긴다. 업소 단위 중복(`MGTNO`)은 3차에서 공통 테이블 `lcns` 의 업소 1행으로 정리한다.
- 수집 후 `python pipeline/bronze/01_bronze.py --dataset food_general food_rest clinic pharmacy beauty` 로 새 스냅샷의 bronze parquet 를 만든다 (기존 스냅샷 파일은 `unchanged`).
- 현재 스냅샷: 음식점 2종 20261118, 의원·약국·미용업 20261119 (모두 silver 까지 변환 완료).

### 3.7 정기 실행 등록 가이드 (Windows 작업 스케줄러, 선택)

> 현재 등록하지 않았습니다. 월 스냅샷을 자동으로 받고 싶을 때 아래 순서로 직접 등록합니다.

**방식: '매일' 예약 + 수집기의 월 1회 판단.** 수집기는 이번 달 완료 스냅샷이 있으면 호출 없이 바로 끝나므로(수 초),
매일 실행으로 등록하면 매월 1일에 받고, 1일에 PC 가 꺼져 있었으면 다음에 켜진 날 받습니다.
작업 스케줄러의 '매월 1일' 트리거만 쓰면 그날 PC 가 꺼져 있을 때 그 달 스냅샷을 놓칩니다.

**1) 준비 확인** (PowerShell, 프로젝트 폴더에서)

```powershell
(Get-Command python).Source               # 예약에 쓸 python.exe 경로 확인 (.venv 를 쓰면 .venv\Scripts\python.exe)
python pipeline/source/00_collect.py seoul --plan         # 인증키·네트워크 확인 (1건 조회만, 저장 안 함)
New-Item -ItemType Directory -Force logs  # 실행 기록 폴더 (data/source 밖)
```

**2) 등록** — 경로 두 개(`$py`, `$proj`)를 1)에서 확인한 값으로 바꾼 뒤 실행합니다.

```powershell
$py   = "C:\Users\Playdata\AppData\Local\Programs\Python\Python314\python.exe"
$proj = "C:\mlo-03-p2-team1"
$cmd  = "set PYTHONIOENCODING=utf-8&& `"$py`" pipeline\source\00_collect.py seoul >> logs\seoul_collect.log 2>&1"

$action   = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c $cmd" -WorkingDirectory $proj
$trigger  = New-ScheduledTaskTrigger -Daily -At 9am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
Register-ScheduledTask -TaskName "mlo-team1 seoul snapshot" -Action $action -Trigger $trigger -Settings $settings `
    -Description "서울 인허가 5종 월 1회 스냅샷 (00_collect.py seoul)"
```

- `-StartWhenAvailable`: 예약 시각에 PC 가 꺼져 있었으면 켜진 뒤 실행합니다.
- `-ExecutionTimeLimit 2시간`: 1회 수집(5종)은 약 13분이라 넉넉한 상한입니다.
- 사용자가 로그인해 있을 때만 실행됩니다 (기본값). 로그아웃 상태에서도 돌리려면 작업 스케줄러 화면에서
  '사용자의 로그온 여부에 관계없이 실행'을 선택하고 암호를 입력합니다.
- 로그(`logs\seoul_collect.log`)에는 인증키가 남지 않습니다 (수집기가 가림).

**3) 확인 · 수동 실행**

```powershell
Get-ScheduledTask -TaskName "mlo-team1 seoul snapshot" | Get-ScheduledTaskInfo   # 마지막·다음 실행 시각, 결과 코드(0 = 정상)
Start-ScheduledTask -TaskName "mlo-team1 seoul snapshot"                          # 지금 한 번 실행
Get-Content logs\seoul_collect.log -Tail 20                                                 # 실행 기록
```

이번 달 스냅샷이 이미 있으면 로그에 `이번 주기(YYYYMM) 스냅샷 ... 이미 완료 → 건너뜀` 이 남는 것이 정상입니다.

**4) 변경 · 해제**

```powershell
Set-ScheduledTask -TaskName "mlo-team1 seoul snapshot" -Trigger (New-ScheduledTaskTrigger -Daily -At 7am)   # 시각 변경
Disable-ScheduledTask -TaskName "mlo-team1 seoul snapshot"                                                  # 잠시 중지
Unregister-ScheduledTask -TaskName "mlo-team1 seoul snapshot" -Confirm:$false                               # 삭제
```

**참고: '매월 1일' 트리거로만 등록하려면** (PowerShell 의 `New-ScheduledTaskTrigger` 에는 월 단위가 없어 `schtasks` 사용)

```powershell
schtasks /Create /TN "mlo-team1 seoul snapshot" /SC MONTHLY /D 1 /ST 09:00 `
    /TR "cmd.exe /c cd /d C:\mlo-03-p2-team1 && set PYTHONIOENCODING=utf-8&& python pipeline/source/00_collect.py seoul >> logs\seoul_collect.log 2>&1"
```

- 이 방식은 1일에 PC 가 꺼져 있으면 그 달을 건너뜁니다. 그럴 때는 그 달 안에 `python pipeline/source/00_collect.py seoul` 을 직접 한 번 실행합니다.

**예약 실행 뒤 할 일**: 새 스냅샷이 생기면 `python pipeline/bronze/01_bronze.py --dataset food_general food_rest clinic pharmacy beauty` →
`python pipeline/silver/02_normalize.py --dataset food_general food_rest clinic pharmacy beauty` 로 다음 단계를 갱신합니다
(예약에는 수집만 넣고, bronze·silver 는 결과를 확인한 뒤 직접 실행하는 것을 권장).

## 4. 파일 다운로드 방법 (#3, #4, #5, #11)

| 데이터셋 | 받는 방법 | Downloads 에서 찾는 이름 패턴 | 저장 위치 |
| --- | --- | --- | --- |
| store_info | 출처 페이지 → **다운로드** (전국 시도별 CSV 가 든 zip) | `*상가*상권*정보*.zip` | `data/source/files/store_info/` |
| hira_inst | 출처 페이지 → **다운로드** (병원·약국·시설 등 xlsx 가 든 zip) | `*병의원*약국*` | `data/source/files/hira_inst/` |
| ldong_code | code.go.kr → 법정동코드 목록조회 → **법정동코드 전체자료** 다운로드 | `*법정동*` | `data/source/files/ldong_code/` |
| food_general_file | 출처 페이지(OA-16094) → **CSV 내려받기**. 받은 파일이 **42개 컬럼**(마지막이 `X좌표`·`Y좌표`·`법정동코드`)인지 확인. 이름 끝에 받은 날짜를 붙임 (예: `서울시 일반음식점 인허가 정보_20261201.csv`) | `*일반음식점*인허가*.csv` | `data/source/files/food_general_file/` |

받은 다음 아래 명령으로 Downloads 의 파일을 `data/source/files/` 로 **복사**합니다 (Downloads 원본은 그대로 남음).

```bash
python pipeline/source/00_collect.py import                     # 기본: 사용자 Downloads 폴더
python pipeline/source/00_collect.py import --from D:\받은파일   # 다른 폴더에서
```

- zip 은 **압축을 풀지 않고** 그대로 보관합니다. 01 단계가 zip 안의 파일을 읽기 전용으로 직접 읽습니다.
- 같은 이름의 다른 파일이 이미 있으면 덮어쓰지 않고 멈춥니다. 새 분기 파일은 파일명(기준일 포함)이 달라서 나란히 쌓입니다.
- 패턴이 실제 파일명과 다르면 `metadata/src_source.csv` 의 `download_pattern` 을 고칩니다.
- **food_general_file 주의 사항**
  - 같은 페이지에서 39개 컬럼(API와 같은 구성) 파일이 받아진 적이 있습니다. 이 파일에는 보완할 3개 컬럼이 없으므로 42개 컬럼인지 먼저 확인합니다.
  - 원천 이름에 날짜가 없어 다음 달 파일을 같은 이름으로 받으면 import 가 덮어쓰지 않고 건너뜁니다. 받을 때마다 이름 끝에 날짜를 붙입니다. 첫 파일(2026-11-19)은 날짜 없이 저장돼 있습니다.
  - cp949 이고 원천 자체에 깨진 바이트가 4건(1978~2000년 레코드) 있어, `metadata/ds_dataset.csv` 에서 `encoding_errors=replace` 로 읽습니다 (깨진 자리는 U+FFFD 로 보존).
  - 받은 뒤: `python pipeline/source/00_collect.py import` → `python pipeline/bronze/01_bronze.py --dataset food_general_file` → `python pipeline/silver/02_normalize.py --dataset food_general_file`
  - 2026-11-19 결과: 540,008행, 228.6MB. 2017년 이후 인허가의 법정동코드 98.5%, 좌표(TM 또는 UTM-K) 99.8% 채움.

## 5. 수집 결과 확인

```bash
python pipeline/source/00_collect.py inventory
```

- `data/source/SOURCE_README.md`: 파일 목록, 크기, SHA-256, 읽기 전용 여부, 출처, 데이터셋별 행 수
- `data/source/_source_manifest.csv`: 전체 SHA-256 값

## 6. 원천 보존 원칙

1. `data/source/` 의 원천 파일은 수정·이동·덮어쓰기·압축 해제를 하지 않는다.
2. 모든 원천 파일은 저장 직후 읽기 전용 속성이 된다.
3. 01 단계(`pipeline/bronze/01_bronze.py`)는 원천을 읽기 모드로만 열고, 실행 전후 SHA-256 을 비교해 하나라도 바뀌면 실패한다.
4. 출력은 원천 폴더 밖(`data/bronze/`)에만 쓴다.
