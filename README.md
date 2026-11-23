# SEOUL APT MLOps

**서울 아파트 실거래가와 생활 인프라 공공데이터를 AI Ready Data로 만드는 데이터 엔지니어링 프로젝트입니다.**

## 1. 팀 임장 Crew 소개

| 박완규 | 이세훈 | 정상효 | 조경호 |
| :---: | :---: | :---: | :---: |
| [@domomo](https://github.com/domomo) | [@hun117](https://github.com/hun117) | [@nomorehuman90](https://github.com/nomorehuman90) | [@naelonambul](https://github.com/naelonambul) |

---

## 2. 프로젝트 개요

**SEOUL APT MLOps**는 서로 다른 기관에서 따로 관리하는 아파트 매매가와 생활 인프라(음식점·카페·의원·약국·미용업) 원천 데이터 11종을 Source → Bronze → Silver → Gold → AI Ready 단계로 정제·통합해, 분석과 학습에 바로 쓸 수 있게 만드는 프로젝트입니다. 출처마다 제각각인 데이터는 **서울 법정동 × 분기**라는 공통 단위로 맞춰 결합합니다. 데이터의 양보다 **얼마나 더러운 데이터를 얼마나 깔끔하게 만드는지**에 집중합니다. 모든 처리는 기준(`metadata/`)에 따라 수행하고, 실행 결과는 `report/`에 남기는 것을 원칙으로 합니다.

### 수집 데이터

| 구분 | 데이터셋 | 제공기관 | 수집 방식 | 규모 (행 수) |
| --- | --- | --- | --- | ---: |
| 실거래 | 아파트 매매 (`apt_trade`) | 국토교통부 | Open API (XML) | 4,265,480 |
| 실거래 | 아파트 전월세 (`apt_rent`) | 국토교통부 | Open API (XML) | 8,001,132 |
| 인허가 | 일반음식점 (`food_general`) | 서울 열린데이터광장 | Open API | 540,008 |
| 인허가 | 휴게음식점 (`food_rest`) | 〃 | Open API | 148,778 |
| 인허가 | 의원 (`clinic`) | 〃 | Open API | 37,791 |
| 인허가 | 약국 (`pharmacy`) | 〃 | Open API | 22,500 |
| 인허가 | 미용업 (`beauty`) | 〃 | Open API | 100,349 |
| 인허가 보조 | 일반음식점 CSV (`food_general_file`) | 〃 | 파일 (CSV, cp949) | 540,008 |
| 대조용 스냅샷 | 상가(상권)정보 (`store_info`) | 소상공인시장진흥공단 | 파일 (ZIP·CSV) | 2,753,778 (16개 파일) |
| 대조용 스냅샷 | 병의원·약국 현황 (`hira_inst`) | 건강보험심사평가원 | 파일 (ZIP·CSV) | 915,009 (12개 파일) |
| 코드 | 법정동코드 (`ldong_code`) | 행정안전부 | 파일 (TXT) | 53,403 |
| **합계** | **11종** | | | **17,378,236** |

- 11종 중 8종을 분석에 사용하고, 대조용 스냅샷 2종(2026-09 기준)은 검증·보완에 씁니다. 전월세는 추후 확장 가능성을 고려해 정제까지 마치고 보존합니다.
- 인허가 데이터는 '현재 스냅샷'이지만 폐업 업소까지 남아 있어, 인허가일·폐업일로 **과거 분기의 영업 업소 수를 재구성**합니다.

### AS-IS: 원천 데이터의 문제

원천 데이터는 출처마다 형식과 기준이 달라, 그대로 합치면 결합이 안 되거나 집계가 왜곡됩니다. 분석과 학습에 쓰려면 아래 문제를 먼저 처리해야 합니다.

| 문제 | 예시 | 그대로 쓰면 |
| --- | --- | --- |
| 채널마다 다른 형식 | 인코딩, 행정코드, 시간 단위 | 결합 불가 |
| 폐업일자 없음 | 약국 4,795건, 의원 전출 812건 | 약국 약 4,800곳 부풂 |
| 중복 | 휴게음식점 323건, 매매 12,798행 | 이중 집계 |
| 법정동 정보 부족 | 코드 없이 주소만 있음 | 동 단위 집계 불가 |
| 업종 기준 불일치 | 카페가 여러 업종에 섞임 | 업종 지표 왜곡 |
| 이상값·자리표시 값 | 1950년 이전 인허가일, `02-0000-0000` | 개업 수 왜곡 |

전체 오염 목록과 기대 건수는 오염 정답지 [`metadata/known_issues.csv`](metadata/known_issues.csv)에 있습니다.

### 목표: AI가 바로 쓸 수 있는 데이터

- **형식 통일:** 채널마다 다른 형식을 행 손실 없이 하나의 표준 이름·타입·단위로 통일한다.
- **검증 가능한 정제:** 오염을 정제 전에 정답지로 먼저 정의하고, 정제 결과를 정답지와 대조해 검증한다.
- **쓰임에 맞는 구조:** 분석·학습·서비스에서 바로 쓸 수 있도록 법정동 × 분기 기준의 Gold 스타 스키마로 제공한다.
- **시점 누수 없는 학습 데이터:** 학습에 미래 정보가 섞이지 않는 AI Ready 피처셋을 만든다.

각 목표를 실제로 달성했는지는 수행결과에서 숫자로 보여 줍니다.

---

## 3. 기술 스택

| 영역 | 기술 |
| --- | --- |
| 데이터 파이프라인 | ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) ![Pandas](https://img.shields.io/badge/Pandas-150458?logo=pandas&logoColor=white) ![NumPy](https://img.shields.io/badge/NumPy-013243?logo=numpy&logoColor=white) ![Parquet](https://img.shields.io/badge/Parquet-50ABF1?logo=apacheparquet&logoColor=white) |
| 모델 | ![LightGBM](https://img.shields.io/badge/LightGBM-9ACD32) |
| DB · Backend | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) |
| Frontend | ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white) ![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white) ![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white) |

---

## 4. WBS

2026-11-23(월) 발표 기준 일정입니다. 세부 체크리스트는 [`plan.md`](plan.md)에 있습니다.

| 일정 | 작업 항목 | 담당 | 상태 |
| --- | --- | --- | --- |
| ~11-19 | 원천 11종 수집, Bronze 적재, Silver 표준화(표준 사전) | 정상효 | 완료 |
| 11-20(금) | Silver 정제 규칙·오염 정답지, 인허가 5종 정제·검증 | 이세훈 | 완료 |
| 11-20(금) | 실거래 매매·전월세, 상가정보, 심평원, 법정동코드 정제 | 정상효 | 완료 |
| 11-20(금) | Gold 요구사항·스타 스키마 설계 | 박완규 · 공동 | 완료 |
| 11-20(금) | Backend, 대시보드 계획 및 프로토타입 구현 | 조경호 | 완료 |
| 11-21(토) | Gold 구현·검증, 같은 단지 가격 지수, PostgreSQL 적재 | 박완규 | 완료 |
| 11-21(토) | AI Ready 피처셋·롤링 검증·시점 누수 검사, 업종 규칙 보완 | 이세훈 | 완료 |
| 11-22(일) | 3D 대시보드 실데이터 연동, Docker를 활용한 E2E 자동 피딩 테스트 | 조경호 | 완료 |
| 11-22(일) | 재현 실행, 발표 자료·데모 시나리오·1차 리허설 | 공동 | 완료 |
| 11-23(월) | 대시보드 배포 점검, README·문서 정리, 최종 리허설·발표 | 공동 | 진행 중 |

---

## 5. 요구사항 명세서

각 단계가 만족해야 할 요구사항과 검증 결과입니다.

| ID | 단계 | 요구사항 | 검증 | 결과 |
| --- | --- | --- | --- | --- |
| B-01 | Bronze | 원천 11종을 값 그대로 Parquet로 저장하고, 행 수가 원천과 같아야 한다. | `01_bronze__manifest.csv` | ✅ 37/37 파일 일치 |
| B-02 | Bronze | 모든 행에 원천 파일 경로와 행 번호(`_source_file`, `_source_row`)를 남겨야 한다. | Bronze Parquet 컬럼 | ✅ 추적 컬럼 확인 |
| B-03 | Bronze | 원천은 읽기 전용(SHA-256 불변)이고, 같은 입력으로 재실행하면 출력이 같아야 한다. | `data/bronze/README.md` | ✅ 원천 불변, 재실행 `unchanged` |
| S-01 | 표준화 | 원천 컬럼을 표준 사전의 이름·타입으로 바꾸고 변환 규칙을 적용해야 한다. | `check_std_rules.py` | ✅ 매핑 419개, 규칙 19/19 |
| S-02 | 표준화 | 날짜·금액을 정의된 타입·단위로 바꾸고, 변환할 수 없는 값은 NULL로 두고 `STD_ERR_TXT`에 기록해야 한다. | `02_silver__change_log.csv` | ✅ 오류 기록 확인 |
| S-03 | 표준화 | 행을 삭제하지 않고 Bronze 파일을 그대로 보존해야 한다. | `02_silver__manifest.csv` | ✅ 37/37 파일, 17,378,236행 |
| S-04 | 정제 | 기준(`cln_*.csv`)에 따라 영업 상태·분석용 개업/폐업일·분석 업종·법정동을 정하고 근거를 기록해야 한다. | `check_cln_rules.py` | ✅ 규칙 47/47 |
| S-05 | 정제 | 휴게음식점 중복 관리번호는 1행만 남기고, 매매의 동일 조건 거래·계약 해제는 플래그로 표시해야 한다. | `03_silver__manifest.csv` | ✅ 323행 제거, 매매는 플래그 |
| S-06 | 품질 검증 | 정제 산출물이 완료 조건을 충족하고, 알려진 오염의 기대 건수와 실제 탐지 건수가 일치해야 한다. | `check_cln_numbers.py` | ✅ 산출물 10/10, 이슈 39/39 |
| G-01 | Gold | 법정동·분기·업종 차원을 만들고 팩트·마트의 키를 연결해야 한다. | `check_gold_tables.py` | ✅ 8개 테이블 (467동 · 39분기 · 14업종) |
| G-02 | Gold | 유효 매매 1건을 1행으로 보존하고, 동·분기별 거래 수와 ㎡당 매매가 중앙값을 집계해야 한다. 표본 5건 미만은 `LOW_SAMPLE_YN`으로 표시한다. | `check_gold_tables.py`<br>`check_gold_numbers.py` | ✅ 611,300행 · 18,213행, 이슈 4/4 |
| G-03 | Gold | 동·분기·업종별 개업·폐업·기말 영업·순증을 집계하고, 거래 지표와 결합한 마트를 만들어야 한다. | `check_gold_tables.py` | ✅ 254,982행 · 마트 18,213행 |
| G-04 | Gold | 두 분기에 모두 거래된 같은 단지 기준으로 가격 변화율과 가격 지수를 산출해야 한다. | `check_gold_tables.py` | ✅ 18,213행 |
| AR-01 | AI Ready | 법정동 × 기준 분기 1행으로 만들고, 피처는 기준 분기까지의 값으로만 계산해야 한다. | `check_ai_ready.py` AR1·AR3 | ✅ 피처 48개, 시점 누수 없음 |
| AR-02 | AI Ready | 다음 분기 같은 단지 가격 로그 변화율을 타깃으로 하고, 마지막 분기는 예측용(타깃 NULL)으로 둔다. | `check_ai_ready.py` AR1·AR2 | ✅ 학습·평가 7,300행, 예측 221행 |
| AR-03 | AI Ready | 기준선·집값·집값+상권 모델을 롤링 검증으로 비교하고, 예측과 평가 결과를 저장해야 한다. | `check_ai_ready.py` AR4~AR6 | ✅ 예측 12,837행, 검사 25/25 |
| DB-01 | DB 적재 | Gold·AI Ready를 PostgreSQL에 적재하고, 로컬 파일과 행 수·값이 같아야 한다. | `postgresql_load_verification.csv` | ✅ Gold 8/8, AI Ready 2/2 일치 |

---

## 6. Gold 데이터 (스타 스키마)

Gold는 **법정동 × 분기 단위로 아파트 매매가를 예측하는 것**에서 출발해 설계했습니다. 실거래가가 법정동 기준이라 주소 변환 없이 결합되고, 월 단위로 나누면 동별 거래·개업 수가 대부분 0이 되기 때문에 분기를 택했습니다. 팩트는 거래, 가격 변화, 인허가처럼 측정 단위별로 나누고, 모두 법정동과 분기로 연결해 쓰임마다 필요한 테이블을 골라 쓸 수 있게 했습니다.

| 쓰임 | 필요한 것 | 쓰는 테이블 |
| --- | --- | --- |
| 예측 모델 | 타깃인 같은 단지 가격 변화율과 가격·거래 구성·상권 피처 | `fact_apt_idx_qtr`, `fact_apt_trd_qtr`, `fact_apt_trd`, `mart_ldong_infra_qtr`<br>→ AI Ready `feature_set` (모델 전용 테이블) |
| 대시보드 | 동·분기별 매매가와 업종 지표를 한 행에 모은 값, 표본이 적은 값 표시 | `mart_ldong_infra_qtr` |
| 검증·재집계 | 집계 전 매매 거래 1건 단위 원본과 업종별 인허가 집계 | `fact_apt_trd`, `fact_lcns_qtr` |

![Gold ERD](docs/erd/gold_star_schema.png)

| 테이블 | 한 행의 의미 | 키 | 행 수 |
| --- | --- | --- | ---: |
| `dim_region` | 서울 법정동 하나 (상위 자치구 포함) | `LDONG_CD` | 467 |
| `dim_date` | 분기 하나 (시작·종료일) | `YQ` | 39 |
| `dim_lcns_induty` | 분석 업종 하나 (참고 지표 여부 포함) | `ANLS_INDUTY_CD` | 14 |
| `fact_apt_trd` | 유효한 아파트 매매 거래 1건 | 원천 파일명 × 행 번호 | 611,300 |
| `fact_apt_trd_qtr` | 법정동 × 분기의 거래 수, ㎡당 매매가 중앙값 | `LDONG_CD` × `YQ` | 18,213 |
| `fact_apt_idx_qtr` | 법정동 × 분기의 같은 단지 기준 가격 변화율과 가격 지수 | `LDONG_CD` × `YQ` | 18,213 |
| `fact_lcns_qtr` | 법정동 × 분기 × 업종의 개업·폐업·분기 말 영업·순증 수 | `LDONG_CD` × `YQ` × `ANLS_INDUTY_CD` | 254,982 |
| `mart_ldong_infra_qtr` | 법정동 × 분기 1행: 매매가 + 인프라 지표 + 희소 표본 플래그 | `LDONG_CD` × `YQ` | 18,213 |

- **인허가:** 분기 말 영업 수 = 분석용 개업일 ≤ 분기 말 < 분석용 폐업일.
- **매매:** 계약 해제 거래는 빼고, 동일 조건 중복 거래는 묶음마다 1건만 남겨 집계합니다.
- 가격 표본이 5건 미만인 셀(9,593개)은 `LOW_SAMPLE_YN`으로 표시하고 값은 보존합니다.

측정값의 의미와 계산 방법: [`docs/erd/gold_measures.md`](docs/erd/gold_measures.md)

자세한 집계 과정: [`report/gold/04_gold__work_summary.md`](report/gold/04_gold__work_summary.md)

---

## 7. 주요 프로시저

![처리 구조](docs/architecture/pipeline_overview.png)

| 단계 | 입력 → 출력 | 주요 처리 | 실행 파일 | 기준 (`metadata/`) |
| --- | --- | --- | --- | --- |
| 00 Source | API·파일 → `source` | API 응답 원문 저장, 파일 수집 | `00_collect.py` | `src_*.csv` |
| 01 Bronze | `source` → `bronze` | 원천을 값 그대로 parquet로, 추적 컬럼 추가 | `01_bronze.py` | `ds_dataset.csv` |
| 02 Silver 표준화 | `bronze` → `silver` | 표준 사전으로 컬럼명·타입·단위 통일 | `02_normalize.py` | `std_*.csv` |
| 03 Silver 정제 | `silver` 02 → 03 | 중복·영업 상태·대용 폐업일·법정동·분석 업종 판정 | `03_clean.py` | `cln_*.csv`<br>`known_issues.csv` |
| 04 Gold | `silver` 03 → `gold` | 법정동 × 분기 집계, 같은 단지 가격 지수, 스타 스키마 | `04_gold.py` | `rule_gold_*.csv` |
| 05 AI Ready | `gold` → `ai_ready` | 피처셋 생성, 롤링 검증, 다음 분기 예측 | `05_feature_set.py`<br>`05_train.py` | `rule_ai_ready_*.csv` |
| 적재 | `gold`·`ai_ready` → PostgreSQL | 스키마별 적재 | `load_postgres.py` | `db/01_schema.sql` |

실행 파일은 `pipeline/` 아래 단계별 폴더에 있고, 적재 스크립트만 `pipeline_container/`에 있습니다.

**처리 원칙**

- 정제 규칙은 코드에 하드코딩하지 않고 `metadata/` CSV에서 읽습니다. 실행 결과는 `report/`에 남깁니다.
- 원본 컬럼은 덮어쓰지 않습니다. 판단으로 만든 값은 분석용 컬럼과 출처 컬럼으로 붙입니다.
- 행을 지우는 것은 관리번호 중복뿐입니다. 무엇을 집계에서 뺄지는 Gold가 플래그를 보고 정합니다.
- 같은 입력으로 다시 실행하면 같은 파일이 나옵니다(`status=unchanged`).

### 7.1 원천 → Bronze

API 응답은 받은 그대로 XML로, 파일은 원본 그대로 `data/source/`에 저장합니다. 원천은 읽기 전용으로 두고, 목록·크기·SHA-256을 `data/source/SOURCE_README.md`, `_source_manifest.csv`에 기록합니다. 데이터 파일은 git에 올리지 않습니다.

Bronze는 원천 값을 바꾸지 않고 parquet로 옮깁니다. 모든 행에 원천 파일 경로(`_source_file`, ZIP 안쪽 파일 포함)와 행 번호(`_source_row`)를 붙여, 어느 원천의 몇 번째 행인지 끝까지 추적할 수 있게 합니다.

### 7.2 Silver 표준화

**표준 사전**: 같은 "인허가일자"도 API에서는 `APVPERMYMD`, CSV에서는 `인허가일자`로 옵니다. 이런 원천 컬럼 419개를 사전 하나로 `LCNS_DTM` 같은 표준 이름·타입·단위로 통일했습니다. 사전은 표준 단어 199개와 접미사 9개(`_DTM` 날짜, `_CD` 코드, `_NM` 이름 등)로 이름을 짓고, 변환 규칙 17개(공백 제거, 만원 → 원 등)로 값을 맞춥니다.

변환할 수 없는 값은 NULL로 두고, 그 행의 `STD_ERR_TXT`에 실패한 컬럼명을 남깁니다. 원래 값은 추적 컬럼으로 Bronze에서 찾을 수 있습니다.

### 7.3 Silver 정제

개요의 AS-IS 문제를 `metadata/cln_*.csv` 규칙으로 처리합니다. 행을 지우는 것은 관리번호 중복뿐이고, 나머지는 판단 결과를 분석용 컬럼과 플래그로 붙입니다.

| 문제 | 처리 |
| --- | --- |
| 채널마다 다른 형식 | 표준 사전으로 이름·타입·단위 통일 (7.2) |
| 폐업일자 없음 | 최종수정일자를 대용 폐업일로 |
| 중복 | 관리번호 중복은 최신 1행, 동일 조건 거래는 첫 행만 |
| 법정동 정보 부족 | 원본코드 → 지번 → 도로명 순으로 부여 |
| 업종 기준 불일치 | 업태 + 상호 키워드로 카페 분류 |
| 이상값·자리표시 값 | 값은 유지하고 플래그·이슈 목록으로 표시 |

### 7.4 Gold

Silver 03을 직접 읽어 법정동 × 분기 단위로 집계합니다. 매매는 계약 해제를 빼고 동일 조건 중복은 1건만 남겨 거래 수와 ㎡당 매매가 중앙값을 내고, 두 분기에 모두 거래된 같은 단지끼리 비교해 가격 지수를 만듭니다. 인허가는 분석용 개업·폐업일로 분기 말 영업 수를 재구성합니다. 테이블 구성과 한 행의 의미는 [6. Gold 데이터](#6-gold-데이터-스타-스키마)에 있습니다.

### 7.5 AI Ready

Gold를 **법정동 × 분기 t** 한 행으로 모아 학습용 피처셋(`feature_set`)을 만듭니다. 피처 48개(가격 흐름 16 · 상권 32)는 분기 t까지의 값만 씁니다.

타깃은 매매가 수준이 아니라 **다음 분기 같은 단지 기준 ㎡당 매매가 변화율**입니다. 동 중앙값은 그 분기에 어떤 단지가 팔렸는지에 따라 출렁여서, 두 분기에 모두 거래된 같은 단지끼리 비교할 수 있도록 구성했습니다.

피처 이름·묶음·설명: [`metadata/rule_ai_ready_feature.csv`](metadata/rule_ai_ready_feature.csv)

---

## 8. 수행결과

단계마다 처리 코드와 검증 코드, 실행 결과를 정리했습니다. 실행 기록은 `report/`에 있습니다.

### 8.1 Source

![00 Source: API 응답 XML 원문](docs/images/result_00_source.png)

- **처리 코드:** [`pipeline/source/00_collect.py`](pipeline/source/00_collect.py)
- **검증:** 원천 파일마다 크기·SHA-256 기록
- **기록:** [`data/source/SOURCE_README.md`](data/source/SOURCE_README.md), [`_source_manifest.csv`](data/source/_source_manifest.csv)

모든 단계의 출발점인 원본입니다. 국토교통부·서울 열린데이터광장 Open API 응답은 받은 그대로 XML로, 소상공인시장진흥공단·건강보험심사평가원·행정안전부 파일은 원본 그대로 저장했습니다. 원천 11종, 17,378,236행을 수집했고 파일마다 크기와 SHA-256을 기록했습니다.

### 8.2 Bronze

![01 Bronze: 원천 값 그대로 Parquet](docs/images/result_01_bronze.png)

- **처리 코드:** [`pipeline/bronze/01_bronze.py`](pipeline/bronze/01_bronze.py)
- **검증:** 원천 행 수를 다른 방법(csv 모듈, XML 태그 개수)으로 따로 세어 대조 ([`pipeline/common/source_reader.py`](pipeline/common/source_reader.py)의 `count_source_rows`)
- **기록:** [`report/bronze/01_bronze__manifest.csv`](report/bronze/01_bronze__manifest.csv), [`data/bronze/README.md`](data/bronze/README.md)

Source의 원천(XML·CSV·TXT)을 값은 바꾸지 않고 Parquet로 옮겼습니다. XML 태그 하나가 컬럼 하나가 되고 값은 모두 문자열 그대로 두며, 모든 행에 `_source_file`·`_source_row`를 붙였습니다. 37개 파일 모두 원천과 행 수가 일치했고, 실행 전후 원천 SHA-256이 같았으며, 재실행 결과는 `unchanged`였습니다.

### 8.3 Silver 표준화

![02 Silver 표준화: 표준 컬럼명·타입](docs/images/result_02_silver_std.png)

- **처리 코드:** [`pipeline/silver/02_normalize.py`](pipeline/silver/02_normalize.py)
- **검증 코드:** [`pipeline/validation/check_std_rules.py`](pipeline/validation/check_std_rules.py)
- **기록:** [`report/silver/02_silver__manifest.csv`](report/silver/02_silver__manifest.csv), [`02_silver__change_log.csv`](report/silver/02_silver__change_log.csv)

Bronze의 원천 컬럼명을 표준 사전에 맞춰 바꾸고, 문자열이던 값을 정의된 타입·단위로 변환했습니다. `APVPERMYMD` → `LCNS_DTM`처럼 이름을 바꾸고, 계약일 년·월·일 3개 컬럼은 날짜 하나로, 거래금액은 만원 → 원으로 맞췄습니다. 원천 컬럼 419개에 적용했습니다. 변환 규칙 검사 19/19를 통과했고, 37개 파일 17,378,236행을 한 행도 잃지 않고 표준화했습니다.

### 8.4 Silver 정제 · 품질 검증

![03 Silver 정제: 법정동 출처·동일 조건 거래 플래그](docs/images/result_03_silver_clean.png)

- **처리 코드:** [`pipeline/silver/03_clean.py`](pipeline/silver/03_clean.py), [`cln_rules.py`](pipeline/silver/cln_rules.py)
- **검증 코드:** [`pipeline/validation/check_cln_rules.py`](pipeline/validation/check_cln_rules.py), [`check_cln_numbers.py`](pipeline/validation/check_cln_numbers.py)
- **기록:** [`report/silver/03_silver__known_issues_check.csv`](report/silver/03_silver__known_issues_check.csv)

Silver 표준화 단계의 표준 컬럼은 그대로 두고, 판단 결과를 새 컬럼으로 붙였습니다. 매매에는 법정동 출처(`LDONG_SRC_CD`)와 동일 조건 거래 플래그(`SAME_DEAL_YN`)를, 인허가에는 영업 상태·대용 폐업일·법정동·분석 업종을 붙였습니다. 행은 휴게음식점 관리번호 중복 323행만 정리했습니다. 정제 규칙 검사 47/47, 산출물 10개 완료 조건을 통과했고, 오염 정답지 39개 항목 모두 기대 건수와 실제 탐지 건수가 일치했습니다(차이 0).

### 8.5 Gold

![04 Gold: mart_ldong_infra_qtr](docs/images/result_04_gold.png)

- **처리 코드:** [`pipeline/gold/04_gold.py`](pipeline/gold/04_gold.py), [`price_index.py`](pipeline/gold/price_index.py)
- **검증 코드:** [`pipeline/validation/check_gold_tables.py`](pipeline/validation/check_gold_tables.py), [`check_gold_numbers.py`](pipeline/validation/check_gold_numbers.py)
- **기록:** [`report/gold/04_gold__work_summary.md`](report/gold/04_gold__work_summary.md)

Silver 정제 단계의 행 단위 데이터를 법정동 × 분기로 집계했습니다. 사진의 `mart_ldong_infra_qtr`처럼 동·분기마다 거래 수, ㎡당 매매가 중앙값, 표본 부족 플래그(`LOW_SAMPLE_YN`)가 한 행에 모이고, 전체는 스타 스키마 8개 테이블로 구성됩니다. 매매 상세 611,300행, 법정동 × 분기 18,213행, 인허가 팩트 254,982행이며, 차원 연결 100%, Gold 재확인 이슈 4/4가 일치했습니다.

### 8.6 AI Ready

![05 AI Ready: feature_set](docs/images/result_05_ai_ready.png)

- **처리 코드:** [`pipeline/ai_ready/05_feature_set.py`](pipeline/ai_ready/05_feature_set.py), [`05_train.py`](pipeline/ai_ready/05_train.py)
- **검증 코드:** [`pipeline/validation/check_ai_ready.py`](pipeline/validation/check_ai_ready.py)
- **기록:** [검사 결과](report/ai_ready/05_ai_ready__check.csv) · [예측 요약 (모델별 오차·연도별 결과)](report/ai_ready/05_ai_ready__summary.md)

Gold의 법정동 × 분기 데이터를 학습용 한 행(법정동 × 기준 분기 t)으로 모으고, 다음 분기(`TARGET_YQ`)의 같은 단지 가격 변화율을 타깃(`TARGET_RET`)으로 붙였습니다. 학습에 미래 정보가 섞이는 **시점 누수**를 막는 데 집중했습니다. 구현 코드를 쓰지 않고 Gold에서 따로 계산해 대조하는 검사 25개(시점 누수·타깃 재계산·키 연결 포함)를 모두 통과했습니다. 모델은 테스트 연도(2021~2026)마다 그 이전 데이터로만 학습하는 **롤링 검증**으로 기준선·집값·집값+상권 세 가지를 비교했습니다.

### 8.7 대시보드

대시보드는 앞서 정제·통합한 **Gold와 AI Ready 데이터를 화면에 띄웁니다.** PostgreSQL에 적재한 테이블을 FastAPI 백엔드가 읽어 프론트엔드(React + React Three Fiber)에 전달합니다.

배포한 대시보드는 <https://apartapart-team-dashboard.mlo-3-5476.chatgpt.site>에서 확인할 수 있습니다.

**실거래 시세**: 법정동별 실제 가격 변화율을 색으로 보여 줍니다. 빨간색은 상승, 파란색은 하락입니다. 기둥 높이는 ㎡당 매매가를 의미하고, 선택한 업종이 많은 동은 파동으로 표시합니다. (데이터: `gold.mart_ldong_infra_qtr`, `gold.fact_apt_idx_qtr`)

![실거래 시세](docs/images/dashboard_real.gif)

**AI 예측 시세**: 지난 분기는 예측 변화율이 실제와 얼마나 차이 났는지 4단계 색으로 보여 줍니다. 초록색은 0\~2%p, 하늘색은 2\~4%p, 주황색은 4\~6%p, 빨간색은 6%p 이상입니다. 다음 분기는 예측한 가격 변화율을 실거래 시세와 같은 색(빨간색 상승, 파란색 하락)으로 보여 주고, 법정동을 클릭하면 예측 매매가도 볼 수 있습니다. (데이터: `ai_ready.prediction`)

![AI 예측 시세](docs/images/dashboard_predict.gif)

- 상단 탭에서 실거래 시세와 AI 예측 시세를 전환하고, 하단 타임라인으로 분기를 옮깁니다.
- 법정동을 클릭하면 그 동의 매매가, 실제와 예측 변화율, 업종별 증감을 볼 수 있습니다.

---

## 9. 저장소 구성과 산출물

```text
mlo-03-p2-team1/
├── data/          단계별 데이터 (source, bronze, silver, gold, ai_ready) — git 제외
├── pipeline/      단계별 변환 코드 + validation + common
├── pipeline_container/  자동 실행·DB 적재 스크립트 (테스트 환경)
├── metadata/      기준 CSV: 표준 사전, 정제 규칙, Gold·AI Ready 규칙, 오염 정답지
├── report/        실행 결과: manifest, 변경 로그, 정답지 대조, 적재 검증
├── samples/       비식별 샘플 원천 (전체 흐름 재현용)
├── db/            PostgreSQL 스키마
├── docs/          설계 문서(manual), ERD, 실행 증거(evidence)
├── backend/       FastAPI API 서버
├── frontend/      React 3D 대시보드
├── INTENT.md      기획 의도와 우선순위
├── SPEC.md        기술 스택·인프라 명세
└── plan.md        일정과 단계별 체크리스트
```

| 산출물 | 위치 |
| --- | --- |
| 원천 목록·해시 | `data/source/SOURCE_README.md`, `_source_manifest.csv` |
| 표준 사전 | `metadata/std_*.csv` |
| 정제 기준·오염 정답지 | `metadata/cln_*.csv`, `metadata/known_issues.csv` |
| Gold·AI Ready 규칙 | `metadata/rule_gold_*.csv`, `metadata/rule_ai_ready_*.csv` |
| 단계별 실행 기록 | `report/bronze/`, `report/silver/`, `report/gold/`, `report/ai_ready/` |
| PostgreSQL 적재 검증 | `report/postgresql_load_verification.csv` |
| 데이터 모델 ERD | `docs/erd/gold_star_schema.png` |

---

## 10. 한계와 향후 과제

| 한계 | 향후 과제 |
| --- | --- |
| **과거 분기 외부 검증 불가**<br>대조용 스냅샷(심평원·상가정보)이 2026년 9월 한 시점뿐이라, 중간에 삭제된 인허가 레코드가 있다면 과거 영업 수가 적게 잡힐 수 있습니다. | 의원·약국은 심평원 연말 기준 요양기관 개설 현황으로 연도별 대조, 이후 분기는 스냅샷을 모아 검증 |
| **정제 규칙의 오차**<br>이전·교체는 확실할 때만 연결해 일부 이중 집계가 남고, 카페는 업태와 상호 키워드로 분류해 일부 오분류가 있을 수 있습니다. | 상가정보 카페 위치와의 대조율로 규칙 보정 |
| **최근 분기 폐업 누락**<br>폐업 신고가 늦게 들어와 최근 분기의 폐업이 덜 잡힐 수 있습니다. | 잠정치 표시(`PROVISIONAL_YN`) 기준 마련 |
| **개업·폐업에 이전·재등록 포함**<br>Gold는 전체 기준으로 집계해, 가게가 자리를 옮기기만 해도 폐업 1건과 개업 1건으로 잡힙니다. | Silver의 이전·교체 연결을 활용해 이를 뺀 개업·폐업 지표를 Gold에 추가 |
| **거래가 적은 동의 가격 불안정**<br>유효 매매가 없는 동이 129개, 가격 표본 5건 미만 셀이 9,593개입니다. | 인접 동이나 구 단위로 보완하는 지표 검토 |
| **일부 집계가 AI Ready에 있음**<br>거래 구성(건물 나이·면적)과 구 단위 가격 집계를 AI Ready에서 계산해, 다른 쓰임에서 재사용할 수 없습니다. | Gold 분기 팩트로 옮기기 |

---

## 11. 한 줄 회고

| 이름 | 회고 |
| --- | --- |
| 박완규 | 팀 내에서 git hub 활용도가 좋았습니다. 각자 작업하고 commit 한 내역에 대한 설명을 읽고 pull 해와서 변화를 경험한 것이 git 숙련도 올리기에 좋았습니다. 스타 스키마(골드 계층)에 대한 개념이 부족해서 팀원들의 속도 따라가는 데 약간의 어려움이 있었습니다. AI 도움을 받고 나서 데이터의 속 내용들을 조금 더 직접 보고 이해하고 질문하는 과정이 좀 더 필요하다고 생각했습니다. 수업 때 배운 내용을 적용해본다는 경험을 한다는 것을 앞으로의 프로젝트에서도 이어가야겠다는 생각을 했습니다. |
| 이세훈 | PM으로 프로젝트를 진행하면서 새로운 시야를 경험해볼 수 있었습니다. 전체적인 일정 관리나 작업을 분배하는 능력이 더 필요하다고 느꼈고, 작업 중 결정이 필요할 때에는 먼저 테스트한 결과물을 가지고 팀원들에게 방향을 제시해야 한다는 것을 배웠습니다. 앞으로의 프로젝트에서 좀더 팀원과의 소통에 신경쓰며 작업해야겠다고 생각했습니다. |
| 정상효 | 팀장 지휘 아래 각자 맡은 임무를 해결하며 각자의 스킬들을 잘 발휘 해서 좋았습니다. github 에서 문제 없이 merge까지 잘 진행되어서 스트레스 없이 잘 마무리 된 점이 쭉 계속 되었으면 하는 바람입니다. 빠르게 기본적인 과제를 완료 하고 좀 더 새로운 것 좋은 것을 더 이어 나가려고 했던 부분이 계속 시도 되고 발전되어 나가면 좋겠다는 점입니다.  ( 데이터 및 변화를 자동화 하려고 했던 점 , 새로운 대시보드를 사용하고 적용했던 점 등... )	 
| 조경호 | 기술스택이 간단해서 좋았습니다. 업무 배정이 좀 더뎌서 아쉬웠습니다. 커뮤니케이션 스킬이 좀더 필요할거 같습니다. 앞으로는 좀 쉽게쉽게 가겠습니다. |
