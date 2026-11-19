# Silver 표준화 (Bronze → Silver)

Nov 19, 2026

Bronze에 원본 그대로 쌓아 둔 데이터를 **팀 표준 이름과 표준 형식으로 바꿔서** Silver에 저장하는 단계입니다.
처음 보는 팀원도 이 문서만 읽고 실행하고 고칠 수 있게 정리했습니다.

---

## 1. 한 줄 요약

> 컬럼 이름과 값 형식만 바꾼다. 행은 하나도 지우지 않는다.
> 무엇을 어떻게 바꿀지는 코드가 아니라 **`metadata/std_term.csv`** 에 적혀 있다.

```
data/bronze/                         data/silver/
  상호명 = "세븐１４호점（본점）"   →    STORE_NM = "세븐14호점(본점)"
  dealAmount = "82,000"  (문자)    →    DEAL_AMT_NUM = 820000000  (정수, 원)
  APVPERMYMD = "2015-06-29     "   →    LCNS_DTM = 2015-06-29  (날짜)
  층정보 = "B1"                     →    FLR_NUM = -1
```

---

## 2. 이번에 정한 것 (2026-11-19)

| 질문 | 결정 | 이유 |
|---|---|---|
| Silver에서 어디까지 하나? | **표준화만** (이름·타입·표기). 행 수 = Bronze | 단계마다 "몇 건이 어디서 왜 바뀌었나"를 따로 확인할 수 있게. 중복 제거·법정동 부여는 다음 단계 |
| 어떤 데이터셋? | **bronze 11개 전부** | 상가·심평원도 검증용으로 쓰므로 같은 표준으로 맞춰 둔다 |
| 사전은 어떤 형식? | **`metadata/` CSV** | 팀 README 규칙("기준은 `metadata/`, 코드는 CSV를 읽기만"). 엑셀로 열어서 고칠 수 있음 |
| 코드는 어디에? | **`pipeline/`** | 팀 README 폴더 규칙 (`pipeline/silver/`, `pipeline/common/`) |

---

## 3. 파일 구성

```
metadata/                         ← 기준 (사람이 고치는 곳)
├── std_suffix.csv     9줄        접미사 → 허용 타입  (_NUM → INT64 / FLOAT64)
├── std_word.csv       189줄      표준 단어           (DEAL = 거래)
├── std_domain.csv     17줄       변환 규칙            (MANWON = 만원 → 원)
└── std_term.csv       419줄      원천 컬럼 → 표준 컬럼 + 규칙  ← 코드가 실제로 읽는 표

pipeline/
├── common/                 두 단계 이상에서 쓰는 코드
│   ├── paths.py            경로와 파일명 규칙
│   ├── files.py            SHA-256, 실행 전후 비교, 읽기 전용, 내용이 같으면 기존 파일 유지
│   ├── report.py           manifest CSV · README 기록
│   ├── source_reader.py    원천 읽기 (zip 안쪽 CSV, 인코딩 판별, XML) — 00 inventory · 01 이 같이 씀
│   ├── std_rules.py        변환 규칙 17개 (규칙 하나 = 함수 하나)
│   └── std_dictionary.py   사전 읽기·검증
├── source/                 00 단계 (metadata/src_source.csv, src_collect_plan.csv 를 읽음)
│   └── 00_collect.py       API·내려받은 파일 → data/source
├── bronze/                 01 단계 (metadata/ds_dataset.csv 를 읽음)
│   └── 01_bronze.py        data/source → data/bronze
├── silver/
│   └── 02_normalize.py     bronze → silver 실행 파일
└── validation/
    └── check_std_rules.py  변환 규칙 예시 검사 (19개)

data/silver/                      ← 결과 (git 에는 README.md 만 올라감)
├── {데이터셋}/02_silver__{데이터셋}[__{세부}].parquet
└── README.md                     실행 요약 (자동 생성)

report/silver/                    ← 실행 기록 (git 에 올림)
├── 02_silver__manifest.csv       파일별 행 수 검증·실패 칸 수·재실행 상태
└── 02_silver__change_log.csv     컬럼별 빈 값→NULL, 바뀐 건수, 실패 건수, 변경 전→후 예시
```

`data/` 아래는 `.gitignore`로 데이터 파일이 올라가지 않습니다. 그래서 다른 팀원이 볼 실행 기록은 `report/silver/`에 둡니다.

---

## 4. 실행 방법

```bash
python pipeline/validation/check_std_rules.py         # 1) 변환 규칙 검사 (19/19 통과해야 함)
python pipeline/silver/02_normalize.py --check        # 2) 사전 검증만 (파일을 쓰지 않음)
python pipeline/silver/02_normalize.py                # 3) 전체 실행
python pipeline/silver/02_normalize.py                # 4) 한 번 더 → 모든 파일이 unchanged 인지 확인
python pipeline/silver/02_normalize.py --dataset apt_trade apt_rent   # 일부만 다시 실행
```

- 프로젝트 루트(`mlo-03-p2-team1/`)에서 실행합니다.
- 필요한 패키지: `pandas`, `pyarrow` (pytest는 필요 없음)
- 일부만 실행해도 `report/silver/`의 다른 데이터셋 행은 이전 결과가 그대로 남습니다.

---

## 5. 완료 조건

네 가지를 **모두** 만족해야 Silver 완료입니다. 하나라도 어기면 종료 코드 1로 끝납니다.

| # | 조건 | 어디서 확인 |
|---|---|---|
| 1 | bronze의 모든 컬럼이 사전에 있고, 사전 형식이 맞다 | `--check` 결과 |
| 2 | silver 행 수 = bronze 행 수 (모든 파일) | manifest의 `row_match` |
| 3 | bronze 파일이 바뀌지 않았다 | 실행 전후 SHA-256 비교 |
| 4 | 다시 실행하면 같은 파일이 나온다 | 두 번째 실행에서 `status = unchanged` |

재실행 동일성을 지키려고 배치 크기(10만 행)와 압축 방식을 고정했고, 파일 안에 실행 시각을 넣지 않습니다.

---

## 6. 이름 짓는 규칙

**표준 단어를 `_`로 잇고, 마지막 단어(접미사)가 값의 종류를 정합니다.** (`docs/설계서_초안.md` 표준용어 정의서와 같음)

```
DEAL _ AMT _ NUM          TRD _ STATE _ CD         MED _ INST _ TEL
거래   금액   숫자          영업   상태    코드          의료   기관    전화번호
```

| 접미사 | 뜻 | 타입 | 예 |
|---|---|---|---|
| `_KEY` | 식별자 | STRING | `STORE_KEY`, `LCNS_KEY`, `APT_KEY` |
| `_CD` | 코드 | STRING | `LDONG_CD`, `SGG_CD` |
| `_NM` | 이름 | STRING | `STORE_NM`, `BPLC_NM` |
| `_DTM` | 날짜·일시·시각 | DATE / DATETIME / TIME | `DEAL_DTM`, `UPD_DTM`, `TRMT_MON_BGN_DTM` |
| `_NUM` | 숫자 | INT64 / FLOAT64 | `DEAL_AMT_NUM`, `FLR_NUM` |
| `_YN` | 여부 | BOOL | `CNCL_YN`, `MULTI_USE_YN` |
| `_ADDR` | 주소 | STRING | `ROAD_ADDR`, `JIBUN_ADDR` |
| `_TEL` | 전화번호 | STRING | `SITE_TEL` |
| `_TXT` | 형식이 없는 텍스트·원문 | STRING | `FLR_INFO_TXT`, `CNTRCT_TERM_TXT` |

검사기(`--check`)가 자동으로 확인하는 것:
- 이름이 영문 대문자·숫자·`_` 형식인가
- 접미사가 `std_suffix.csv`에 있고, 타입이 그 접미사에 허용된 타입인가
- 이름의 모든 단어가 `std_word.csv`에 있는가
- 규칙의 결과 타입이 사전의 타입과 같은가 (`MANWON` → `INT64`)

### 이름을 정할 때 지킨 원칙

| 원칙 | 예 |
|---|---|
| 같은 뜻이면 데이터셋이 달라도 같은 이름 | 인허가 5종의 `MGTNO`, 일반음식점 CSV의 `관리번호` → 모두 `LCNS_KEY` |
| 같은 이름이라도 **체계가 다르면** 다른 이름 | 상가의 `시도코드`(법정동 체계) → `SIDO_CD` / 심평원의 `시도코드`(심평원 자체 6자리) → `HIRA_SIDO_CD` |
| 좌표계가 다르면 다른 이름 | 경도·위도 → `LON_NUM`/`LAT_NUM`, 인허가 TM → `TM_X_NUM`, 일반음식점 CSV → `UTMK_X_NUM` |
| 해석이 갈리는 값은 원문도 같이 남김 | 층정보 → `FLR_INFO_TXT`(원문) + `FLR_NUM`(정수) / 계약기간 → `CNTRCT_TERM_TXT` + 시작·종료월 |

---

## 7. 변환 규칙 (`std_domain.csv`)

| 규칙 | 하는 일 | 바꾸기 전 → 후 | 실패로 보는 경우 |
|---|---|---|---|
| `TRIM` | 앞뒤 공백 제거 | `" 강남구 "` → `"강남구"` | 없음 |
| `TEXT` | TRIM + 연속 공백 1칸 | `"서울  중구"` → `"서울 중구"` | 없음 |
| `NAME` | TEXT + 전각→반각 | `"１４호점（본점）"` → `"14호점(본점)"` | 없음 |
| `CODE(n)` | 대문자, n자리 0 채움 | `"6035"` → `"06035"` | 없음 |
| `CONCAT` | 여러 컬럼 이어 붙이기 | `11680` + `10300` → `"1168010300"` | 일부만 비어 있음 |
| `TEL` | 하이픈 표준형 | `"0212345678"` → `"02-1234-5678"` | 없음 |
| `INT` | 정수 | `"0004"` → `4` | 정수가 아님 |
| `MANWON` | 만원 → 원 | `"82,000"` → `820000000` | 정수가 아님 |
| `FLOOR` | 층 → 정수 | `"B1"` → `-1` | `지` 처럼 숫자가 아님 |
| `FLOAT(n)` | 실수, 소수 n자리 | `"1,234.567"` → `1234.57` | 숫자가 아님 |
| `DATE(형식)` | 날짜 | `"2015-06-29   "` → 2015-06-29 | 형식이 다름, 없는 날짜 |
| `DATETIME(형식)` | 날짜+시각 | `"2015-06-29 12:51:00"` → 일시 | 형식이 다름 |
| `YMD` | 년+월+일 → 날짜 | `2011`, `1`, `3` → 2011-01-03 | 없는 날짜 |
| `TERM_BGN` / `TERM_END` | 기간 시작·끝 달 | `"25.02~27.02"` → 2025-02-01 / 2027-02-01 | 형식이 다름 |
| `HHMM` | 시각 | `"900"` → 09:00, `"0"` → NULL(진료 없음) | `2410` 처럼 범위 밖 |
| `YN(참;거짓)` | 여부 | `YN(O;BLANK)`: `"O"` → True, 빈 값 → False | 목록에 없는 값 |

**변환에 실패해도 행은 지우지 않습니다.** 그 칸만 `NULL`이 되고, 같은 행의 `STD_ERR_TXT`에 실패한 컬럼 이름이 남습니다.
원래 값은 `SRC_FILE_NM`(원천 파일) + `SRC_ROW_NUM`(원천 행 번호)으로 bronze에서 찾을 수 있습니다.

> `DATETIME`은 설계서 초안의 도메인 표에 없던 규칙입니다. 인허가 데이터의 `최종수정일자`·`데이터갱신일자`에 시각까지 들어 있어서, 날짜로만 바꾸면 정보가 사라지므로 추가했습니다.

---

## 8. 실행 결과 (2026-11-19)

**완료 조건 4개 모두 통과**: 사전 검증 통과 · 행 수 일치 37/37 · bronze 불변 · 두 번째 실행 재실행 동일 37/37

| 데이터셋 | 파일 | 행 수 (= bronze) | 변환 실패 칸 | 크기 |
|---|---|---|---|---|
| apt_trade | 1 | 4,265,480 | 0 | 105.0 MB |
| apt_rent | 1 | 8,001,132 | 24,246 | 186.3 MB |
| ldong_code | 1 | 53,403 | 0 | 1.1 MB |
| store_info | 16 | 2,753,778 | 14,984 | 312.9 MB |
| hira_inst | 12 | 915,009 | 27 | 34.7 MB |
| food_general | 1 | 540,008 | 0 | 44.0 MB |
| food_general_file | 1 | 540,008 | 0 | 50.2 MB |
| food_rest | 1 | 148,778 | 0 | 12.9 MB |
| clinic | 1 | 37,791 | 0 | 3.5 MB |
| pharmacy | 1 | 22,500 | 0 | 1.7 MB |
| beauty | 1 | 100,349 | 1 | 9.3 MB |
| **합계** | **37** | **17,378,236** | **39,258** | **762 MB** |

### 변환 실패 (모두 원천 값 자체의 문제)

규칙은 바꾸지 않고 `NULL` + `STD_ERR_TXT` 기록으로 둡니다. 다음 단계(정제)에서 어떻게 처리할지 정합니다.

| 데이터셋 | 표준 컬럼 | 원천 값 예시 | 실패 칸 | 이유 |
|---|---|---|---|---|
| apt_rent | `CNTRCT_BGN_DTM` | `~20.11` | 24,246 | 계약기간에 시작월이 없음. 종료월(`CNTRCT_END_DTM`)은 정상, 원문은 `CNTRCT_TERM_TXT`에 있음 |
| store_info | `FLR_NUM` | `지` | 14,984 | 숫자 층으로 바꿀 수 없음. 원문은 `FLR_INFO_TXT`에 있음 (서울 8,674칸) |
| hira_inst | 진료 시작·종료 `*_DTM` | `2410`, `93` | 27 | 시·분 범위 밖 (같은 기관이 요일마다 반복) |
| beauty | `CLSBIZ_DTM` | `20060229` | 1 | 없는 날짜 (2006년은 윤년이 아님) |

컬럼별 상세(빈 값→NULL 건수, 값이 바뀐 건수, 변경 전→후 예시)는 `report/silver/02_silver__change_log.csv`에 있습니다.

---

## 9. 사전을 고칠 때

1. **코드는 고치지 않고 `metadata/std_term.csv`만 고칩니다.** 엑셀로 열어도 됩니다 (`utf-8-sig`로 저장되어 있어 한글이 깨지지 않음).
2. 새 단어가 필요하면 `std_word.csv`에 먼저 한 줄 추가합니다.
3. `python pipeline/silver/02_normalize.py --check` 로 검사합니다. 틀리면 몇 번째 줄이 왜 틀렸는지 알려 줍니다.
4. 해당 데이터셋만 다시 실행합니다: `--dataset 데이터셋이름`
5. 아래 "변경 이력"에 한 줄을 남깁니다.

### `std_term.csv` 한 줄 읽는 법

| dataset | file_glob | source_column | standard_column | korean_name | type | rule | description |
|---|---|---|---|---|---|---|---|
| apt_trade | `*` | `dealAmount` | `DEAL_AMT_NUM` | 거래금액(원) | INT64 | `MANWON` | 원천 단위 만원 |
| apt_trade | `*` | `dealYear+dealMonth+dealDay` | `DEAL_DTM` | 계약일 | DATE | `YMD` | 세 컬럼을 하나로 |
| hira_inst | `*식대가산정보*` | `유형코드` | `MEAL_ADD_TYPE_CD` | 식대가산 유형코드 | STRING | `CODE(2)` | |
| `*` | `*` | `_source_file` | `SRC_FILE_NM` | 원천 파일 경로 | STRING | `TRIM` | |

- `dataset`: bronze 하위 폴더 이름. `*`는 모든 데이터셋에 붙는 줄(원천 추적 컬럼)입니다.
- `file_glob`: 이 줄을 적용할 bronze 파일 이름 패턴. 거의 다 `*`(전체)입니다. 심평원처럼 **같은 컬럼 이름이 파일마다 뜻이 다를 때만** 파일 이름을 적습니다 (`유형코드`가 식대가산 파일과 간호등급 파일에서 다른 뜻).
- `source_column`: 여러 컬럼을 합칠 때는 `a+b+c` (`YMD`, `CONCAT` 규칙만).
- silver 컬럼 순서 = 이 표의 순서 → 공통 컬럼(`SRC_FILE_NM`, `SRC_ROW_NUM`) → `STD_ERR_TXT`.

### 새 데이터셋을 추가할 때

1. 01 단계로 `data/bronze/{새 데이터셋}/`을 만든다.
2. `std_term.csv`에 그 데이터셋의 컬럼마다 한 줄씩 추가한다.
3. `--check` → `--dataset 새데이터셋` 으로 실행한다.

---

## 10. 아직 정해야 할 것

| # | 내용 | 제안 |
|---|---|---|
| 1 | ~~01 단계가 `data/`에 있고 `common/`이 없어 실행되지 않음~~ | **해결 (2026-11-19)**: `pipeline/bronze/01_bronze.py`로 옮김. 데이터셋 정의는 `metadata/ds_dataset.csv`. 00 단계도 `pipeline/source/00_collect.py`로 옮기고 `data/config.py`는 삭제 (출처·수집 계획은 `metadata/src_*.csv`) |
| 2 | ~~설계서가 `Dictionary.md` 기준으로 적혀 있음~~ | **해결 (2026-11-19)**: 설계서를 `metadata/std_*.csv` 기준으로 고치고 `DATETIME` 규칙 추가 |
| 3 | 이름을 새로 정한 컬럼 (아래 표) 확인 | 팀 리뷰 후 `std_term.csv`만 고치면 됨 (검토 중) |

새로 정한 이름 중 확인이 필요한 것:

| 원천 | 표준 이름 | 고민한 점 |
|---|---|---|
| 심평원 `시도코드`, `시군구코드` | `HIRA_SIDO_CD`, `HIRA_SGG_CD` | 법정동 체계가 아니라 같은 이름을 쓰면 잘못 조인될 위험 |
| 전월세 `roadnm` | `ROAD_NM_TXT` | 매매 `roadNm`과 달리 건물번호까지 붙어 있음 (`창신길 140-21`) |
| 법정동 `폐지여부` | `ABL_YN` | `폐지` → True, `존재` → False |
| 전월세 `useRRRight` | `RNW_RQST_USE_YN` | `사용` → True, 빈 값 → NULL (False 로 볼 수 있는지는 원천 문서 확인 필요) |
| 인허가 `JTUPSOASGNNO` | `TRAD_ASGN_NO_TXT` | 숫자 번호지만 깨진 값(`` ` ``, `.`)이 섞여 있어 원문 보존 |

---

## 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-11-19 | 최초 작성. 11개 데이터셋 419줄 사전, 변환 규칙 17개, `02_normalize.py` |
| 2026-11-19 | 01 단계 `pipeline/bronze/`로 이동, 공통 코드(`files.py`, `report.py`) 분리, `metadata/ds_dataset.csv` 추가, 설계서에 `DATETIME` 규칙 반영 (사전 내용 변경 없음) |
