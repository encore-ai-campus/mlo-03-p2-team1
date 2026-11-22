# 서울 부동산 실거래가 × 생활 인프라 AI Ready Data (a.k.a 임장 crew)

**서로 다른 채널의 공공데이터를 Source → Bronze → Silver → Gold → AI Ready로 정제·통합해, 서울 법정동 × 분기 단위의 아파트 매매가와 생활 인프라 시계열을 하나의 스타 스키마로 묶은 데이터 엔지니어링 프로젝트입니다.**

### 팀 소개

| 박완규 | 이세훈 | 정상효 | 조경호 |
| :---: | :---: | :---: | :---: |
| [@domomo](https://github.com/domomo) | [@hun117](https://github.com/hun117) | [@nomorehuman90](https://github.com/nomorehuman90) | [@naelonambul](https://github.com/naelonambul) |

### 기술 스택

| 영역 | 기술 |
| --- | --- |
| 데이터 파이프라인 | ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) ![Pandas](https://img.shields.io/badge/Pandas-150458?logo=pandas&logoColor=white) ![NumPy](https://img.shields.io/badge/NumPy-013243?logo=numpy&logoColor=white) ![Parquet](https://img.shields.io/badge/Parquet-50ABF1?logo=apacheparquet&logoColor=white) |
| 모델 | ![LightGBM](https://img.shields.io/badge/LightGBM-9ACD32) |
| DB · Backend | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) |
| Frontend | ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white) ![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white) ![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white) |

---

## 1. 개요

서로 다른 기관에서 따로 관리하는 아파트 매매가와 생활 인프라(음식점·카페·의원·약국·미용업) 데이터를 **서울 법정동 × 분기** 단위로 결합해, 바로 분석할 수 있는 형태로 만드는 것이 목표입니다. 데이터의 양보다 **얼마나 더러운 데이터를 얼마나 깔끔하게 만들었는지**에 집중했습니다. 기준(`metadata/`)에 따라 데이터를 처리하고 실행 결과(`report/`)로 남겼습니다.

- **원천 11종을 표준화했습니다.** Silver 표준화 단계에서 37개 파일, 17,378,236행을 행 손실 없이 표준 이름·타입으로 바꿨습니다.
- **프로파일링으로 찾은 오염을 정답지로 남기고, 정제 결과와 대조했습니다.** 기대 건수와 실제 탐지 건수가 Silver 39개 항목, Gold 4개 항목에서 모두 일치합니다(차이 0).
- **Gold 스타 스키마와 AI Ready 피처셋을 PostgreSQL에 적재했습니다.** 적재한 Gold 8개·AI Ready 2개 테이블 모두 로컬 parquet와 행 수·값이 일치합니다.

| 원천 데이터 | 분석 단위 | 기간 | Gold 마트 |
| --- | --- | --- | --- |
| 11종 | 서울 법정동 × 분기 | 2017Q1 ~ 2026Q3 | 467개 동 × 39개 분기 = 18,213행 |

---

## 2. 수집 데이터와 AS-IS

### 2.1 원천 데이터

| 구분 | 데이터셋 | 제공기관 | 수집 방식 | 규모 (표준화 후 행 수) | 사용 |
| --- | --- | --- | --- | ---: | --- |
| 실거래 | 아파트 매매 (`apt_trade`) | 국토교통부 | Open API (XML) | 4,265,480 | 사용 |
| 실거래 | 아파트 전월세 (`apt_rent`) | 국토교통부 | Open API (XML) | 8,001,132 | 보존 |
| 인허가 | 일반음식점 (`food_general`) | 서울 열린데이터광장 | Open API | 540,008 | 사용 |
| 인허가 | 휴게음식점 (`food_rest`) | 〃 | Open API | 148,778 | 사용 |
| 인허가 | 의원 (`clinic`) | 〃 | Open API | 37,791 | 사용 |
| 인허가 | 약국 (`pharmacy`) | 〃 | Open API | 22,500 | 사용 |
| 인허가 | 미용업 (`beauty`) | 〃 | Open API | 100,349 | 사용 |
| 인허가 보조 | 일반음식점 CSV (`food_general_file`) | 〃 | 파일 (CSV, cp949) | 540,008 | 사용 |
| 대조용 스냅샷 | 상가(상권)정보 (`store_info`) | 소상공인시장진흥공단 | 파일 (ZIP·CSV) | 16개 파일, 2026-09 기준 | 보완 |
| 대조용 스냅샷 | 병의원·약국 현황 (`hira_inst`) | 건강보험심사평가원 | 파일 (ZIP·XLSX) | 12개 파일, 2026.9 기준 | 보완 |
| 코드 | 법정동코드 (`ldong_code`) | 행정안전부 | 파일 (TXT) | 53,403 | 사용 |

- 11종 중 8종을 분석에 사용하고 2종은 검증·보완에 썼습니다. 전월세는 추후 확장 가능성을 고려해 정제까지 마치고 보존했습니다.
- 인허가 데이터는 '현재 스냅샷'이지만 폐업 업소까지 남아 있어, 인허가일·폐업일로 **과거 분기의 영업 업소 수를 재구성**했습니다.
- 데이터 파일은 git에 올리지 않습니다. 원천 목록·크기·SHA-256은 `data/source/SOURCE_README.md`, `_source_manifest.csv`에 있습니다.

### 2.2 AS-IS: 원천 데이터의 문제

| 문제 | 예시 | 그대로 쓰면 | 처리 |
| --- | --- | --- | --- |
| 채널마다 다른 형식 | 인코딩, 행정코드, 시간 단위 | 결합 불가 | 표준 사전으로 이름·타입·단위 통일 |
| 폐업일자 없음 | 약국 4,795건, 의원 전출 812건 | 약국 약 4,800곳 부풂 | 최종수정일자를 대용 폐업일로 |
| 중복 | 휴게음식점 323건, 매매 12,798행 | 이중 집계 | 관리번호 중복은 최신 1행, 동일 조건 거래는 첫 행만 |
| 법정동 정보 부족 | 코드 없이 주소만 있음 | 동 단위 집계 불가 | 원본코드 → 지번 → 도로명 순으로 부여 |
| 업종 기준 불일치 | 카페가 여러 업종에 섞임 | 업종 지표 왜곡 | 업태 + 상호 키워드로 카페 분류 |
| 이상값·자리표시 값 | 1950년 이전 인허가일, `02-0000-0000` | 개업 수 왜곡 | 값은 유지하고 플래그·이슈 목록으로 표시 |

전체 오염 목록과 기대 건수는 오염 정답지 [`metadata/known_issues.csv`](metadata/known_issues.csv)에 있습니다.

---

## 3. 처리 구조 (파이프라인)

![처리 구조](docs/architecture/pipeline_overview.png)

| 단계 | 한 일 | 검증 | 실행 파일 | 기준 (`metadata/`) |
| --- | --- | --- | --- | --- |
| 00 Source | API 응답 원문 저장, 파일 수집 | 원천 읽기 전용, SHA-256 기록 | `pipeline/source/00_collect.py` | `src_*.csv` |
| 01 Bronze | 원천을 값 그대로 parquet로, 추적 컬럼 추가 | 행 수 = 원천, 원천 불변 | `pipeline/bronze/01_bronze.py` | `ds_dataset.csv` |
| 02 Silver 표준화 | 표준 사전으로 컬럼명·타입·단위 통일 | 행 수 = Bronze (37/37 파일) | `pipeline/silver/02_normalize.py` | `std_*.csv` |
| 03 Silver 정제 | 중복·영업 상태·대용 폐업일·법정동·분석 업종 판정 | 오염 정답지 39개 항목 차이 0, 행 수 = 02 − 중복 제거 (10/10 데이터셋) | `pipeline/silver/03_clean.py` | `cln_*.csv`, `known_issues.csv` |
| 04 Gold | 법정동 × 분기 집계, 같은 단지 가격 지수, 스타 스키마 | 정답지 4개 항목 차이 0, 차원 연결률 100%, 구 합계 = 동 합계 + 법정동 실패 | `pipeline/gold/04_gold.py` | `rule_gold_*.csv` |
| 05 AI Ready | 피처셋 생성, 롤링 검증, 다음 분기 예측 | AR1~AR6 전부 PASS (시점 누수 검사 포함) | `pipeline/ai_ready/05_feature_set.py`, `05_train.py` | `rule_ai_ready_*.csv` |
| 적재 | Gold·AI Ready를 PostgreSQL(`gold`, `ai_ready` 스키마)에 적재 | 적재 테이블 행 수·값 PASS (`report/postgresql_load_verification.csv`) | `pipeline_container/load_postgres.py` | `db/01_schema.sql` |

**표준 사전**: 표준 단어 199개 · 표준 용어(원천 컬럼 → 표준 컬럼) 419개 · 도메인(변환 규칙) 17개 · 접미사 9개

**구현 원칙**

- 정제 규칙은 코드에 하드코딩하지 않고 `metadata/` CSV에서 읽습니다. 실행 결과는 `report/`에 남깁니다.
- 원본 컬럼은 덮어쓰지 않습니다. 판단으로 만든 값은 분석용 컬럼과 출처 컬럼으로 붙입니다.
- 행을 지우는 것은 관리번호 중복뿐입니다. 무엇을 집계에서 뺄지는 Gold가 플래그를 보고 정합니다.
- 같은 입력으로 다시 실행하면 같은 파일이 나옵니다(`status=unchanged`).

단계별 자세한 내용: [`pipeline/README.md`](pipeline/README.md) · [`metadata/README.md`](metadata/README.md) · [`report/README.md`](report/README.md) · [`docs/manual/`](docs/manual/00_읽는순서_안내.md)

---

## 4. Gold 데이터 (스타 스키마)

Gold는 **법정동 × 분기 단위로 아파트 매매가를 예측하는 것**에서 출발해 설계했습니다. 실거래가가 법정동 기준이라 주소 변환 없이 결합되고, 월 단위로 나누면 동별 거래·개업 수가 대부분 0이 되기 때문에 분기를 택했습니다. 팩트는 거래, 가격 변화, 인허가처럼 측정 단위별로 나누고, 모두 법정동과 분기로 연결해 쓰임마다 필요한 테이블을 골라 쓸 수 있게 했습니다.

| 쓰임 | 필요한 것 | 쓰는 테이블 |
| --- | --- | --- |
| 예측 모델 | 타깃인 같은 단지 가격 변화율과 가격·거래 구성·상권 피처 | `fact_apt_idx_qtr`, `fact_apt_trd_qtr`, `fact_apt_trd`, `mart_ldong_infra_qtr`<br>→ AI Ready `feature_set` (모델 전용 테이블) |
| 대시보드·지역 비교 | 동·분기별 매매가와 업종 지표를 한 행에 모은 값, 표본이 적은 값 표시 | `mart_ldong_infra_qtr` |
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

- 분기 말 영업 수 = 분석용 개업일 ≤ 분기 말 < 분석용 폐업일. 계약 해제 거래와 동일 조건 중복 거래는 매매 집계에서 뺍니다.
- 가격 표본이 5건 미만인 셀(9,593개)은 `LOW_SAMPLE_YN`으로 표시하고 값은 보존합니다.

자세한 집계 과정: [`report/gold/04_gold__work_summary.md`](report/gold/04_gold__work_summary.md)

---

## 5. AI Ready 데이터

### 5.1 학습용 피처셋 (`feature_set`)

Gold 테이블을 법정동 × 분기 한 행으로 모아, 모델이 바로 학습할 수 있는 피처셋을 만들었습니다.

| 항목 | 내용 |
| --- | --- |
| 한 행 | 법정동 × 분기 t |
| 타깃 | 다음 분기(t+1) 같은 단지 기준 ㎡당 매매가 변화율 |
| 피처 | 48개: 가격 흐름(`PRICE`) 16개, 상권(`LCNS`) 32개. 분기 t까지의 값만 사용 |
| 규모 | 269개 법정동, 학습·평가 7,300행, 다음 분기 예측 221행 |
| 구분 | `labeled`(학습·평가) / `predict`(마지막 분기, 다음 분기 예측용) |

피처 이름·묶음·설명은 코드가 아니라 [`metadata/rule_ai_ready_feature.csv`](metadata/rule_ai_ready_feature.csv)에 정의했습니다.

### 5.2 왜 변화율인가

처음에는 법정동의 분기 매매가 수준을 예측하려 했지만, 두 가지 문제가 있었습니다.

- 동 매매가 중앙값은 **그 분기에 어떤 단지가 팔렸는지**에 따라 크게 출렁입니다. 비싼 단지가 몇 건 더 팔리면 실제 가격 변화가 없어도 값이 오릅니다.
- 가격 수준은 대부분 위치(구·동)로 설명되어, 모델이 맞혀도 새로 알려 주는 정보가 적습니다.

그래서 예측 대상을 **다음 분기 같은 단지 기준 ㎡당 매매가 변화율**로 바꿨습니다. 두 분기에 모두 거래된 같은 단지끼리만 비교하므로 거래 구성의 영향이 빠집니다.

모델은 변화율을 예측하지만, 처음 목표였던 매매가도 놓치지 않도록 예측 변화율을 기준 분기 매매가에 적용한 예측 매매가를 계산해 대시보드에 참고용으로 함께 보여 줍니다.

### 5.3 검증

AI Ready 데이터에서 가장 경계해야 할 문제는 학습에 미래 정보가 섞이는 **시점 누수**입니다. 구현 코드를 쓰지 않고 Gold에서 따로 계산해 대조하는 검사(`pipeline/validation/check_ai_ready.py`)를 두었고, 모든 항목이 통과했습니다.

| 검사 | 내용 | 결과 |
| --- | --- | --- |
| 시점 누수 | Gold를 분기 t까지 잘라 다시 만든 피처가 원래 피처와 같은지 (4개 시점) | PASS |
| 타깃 재계산 | 거래 원본에서 직접 계산한 변화율 = 타깃 | 7,300행 PASS |
| 키·연결 | 키 중복 0, Gold 차원 연결, 타깃 분기 = 다음 분기 | PASS |

전체 검사 결과: [`report/ai_ready/05_ai_ready__check.csv`](report/ai_ready/05_ai_ready__check.csv)

### 5.4 이 데이터로 돌려 본 예측

테스트 연도(2021~2026)마다 그 이전 데이터로만 학습하는 **롤링 검증**으로 평가했습니다.

| 모델 | 오차 (MAPE) | 방향 정확도 |
| --- | ---: | ---: |
| 기준선 ("다음 분기에도 그대로") | 4.74% | — |
| 집값 흐름 (LightGBM) | 4.38% | 72.3% |
| 집값 흐름 + 상권(인허가 증감) | 4.37% | 72.4% |

- **집값 흐름 모델은 기준선보다 오차를 0.36%p 줄였습니다** (95% 신뢰구간 [-0.47, -0.25]%p, 6개 연도 중 4개 연도 개선).
- **상권 피처를 더해도 정확도는 사실상 같았습니다** (차이 -0.002%p, 신뢰구간이 0을 포함).
- 금리 인상으로 시장이 꺾인 2022년에는 기준선보다 크게 틀렸습니다(방향 정확도 33%).

전체 결과: [`report/ai_ready/05_ai_ready__summary.md`](report/ai_ready/05_ai_ready__summary.md)

---

## 6. 대시보드

대시보드는 앞서 정제·통합한 **Gold와 AI Ready 데이터를 화면에 띄웁니다.** PostgreSQL에 적재한 테이블을 FastAPI 백엔드가 읽어 프론트엔드(React + React Three Fiber)에 전달하고, 지도와 상세 패널의 수치는 아래 표의 테이블에서 옵니다.

**실거래 시세**: 법정동별 분기 매매가 변화와 업종별 인프라 지표

![실거래 시세](docs/images/dashboard_real.gif)

**AI 예측 시세**: 다음 분기 예측 변화율과 예측 매매가

![AI 예측 시세](docs/images/dashboard_predict.gif)

| 화면 | 보여 주는 것 | 데이터 |
| --- | --- | --- |
| 3D 지도 (실거래 시세) | 법정동별 실제 가격 변화율(색), ㎡당 매매가(기둥 높이), 선택한 업종이 많은 동(파동) | `gold.mart_ldong_infra_qtr`, `gold.fact_apt_idx_qtr` |
| 3D 지도 (AI 예측 시세) | 지난 분기: 예측이 실제와 얼마나 빗나갔는지 4단계 색으로<br>다음 분기: 예측한 가격 변화율을 색으로 | `ai_ready.prediction` |
| 타임라인 | 2017Q1~2026Q3 분기 이동, 학습·검증 구간, 다음 분기 예측 | `ai_ready.prediction` |
| 지역 상세 (법정동 클릭 시 오른쪽 패널) | 동 ㎡당 매매가, 실제와 예측 변화율, 가격 지수 추이, 업종별 증감 | `gold.mart_ldong_infra_qtr`, `gold.fact_apt_idx_qtr`, `ai_ready.prediction` |
| 모델 비교 | 기준선·집값·집값+상권 모델의 오차(MAPE), 예측 오차 구간 | `ai_ready.prediction`, 롤링 검증 결과 |

- 상단 탭에서 실거래 시세와 AI 예측 시세를 전환하고, 하단 타임라인으로 분기를 옮깁니다.
- 법정동을 클릭하면 그 동의 매매가, 실제와 예측 변화율, 업종별 증감을 볼 수 있습니다.

---

## 7. 저장소 구성과 산출물

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
| 단계별 실행 기록 | `report/silver/`, `report/gold/`, `report/ai_ready/` |
| PostgreSQL 적재 검증 | `report/postgresql_load_verification.csv` |
| 데이터 모델 ERD | `docs/erd/gold_star_schema.png` |
| 설계·근거 문서 | `docs/manual/` (00 읽는 순서 안내부터) |

---

## 8. 한계와 향후 과제

| 한계 | 향후 과제 |
| --- | --- |
| **과거 분기 외부 검증 불가**<br>대조용 스냅샷(심평원·상가정보)이 2026년 9월 한 시점뿐이라, 중간에 삭제된 인허가 레코드가 있다면 과거 영업 수가 적게 잡힐 수 있습니다. | 의원·약국은 심평원 연말 기준 요양기관 개설 현황으로 연도별 대조, 이후 분기는 스냅샷을 모아 검증 |
| **정제 규칙의 오차**<br>이전·교체는 확실할 때만 연결해 일부 이중 집계가 남고, 카페는 업태와 상호 키워드로 분류해 일부 오분류가 있을 수 있습니다. | 상가정보 카페 위치와의 대조율로 규칙 보정 |
| **최근 분기 폐업 누락**<br>폐업 신고가 늦게 들어와 최근 분기의 폐업이 덜 잡힐 수 있습니다. | 잠정치 표시(`PROVISIONAL_YN`) 기준 마련 |
| **개업·폐업에 이전·재등록 포함**<br>Gold는 전체 기준으로 집계해, 가게가 자리를 옮기기만 해도 폐업 1건과 개업 1건으로 잡힙니다. | Silver의 이전·교체 연결을 활용해 이를 뺀 개업·폐업 지표를 Gold에 추가 |
| **거래가 적은 동의 가격 불안정**<br>유효 매매가 없는 동이 129개, 가격 표본 5건 미만 셀이 9,593개입니다. | 인접 동이나 구 단위로 보완하는 지표 검토 |
| **일부 집계가 AI Ready에 있음**<br>거래 구성(건물 나이·면적)과 구 단위 가격 집계를 AI Ready에서 계산해, 다른 쓰임에서 재사용할 수 없습니다. | Gold 분기 팩트로 옮기기 |
