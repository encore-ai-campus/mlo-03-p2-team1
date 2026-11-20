# 05. Silver 표준화 (02 단계: Bronze → Silver)

> **이 문서의 출처**
> - `../archive/silver_표준화.md` — 1~9장 (L1–233)
> - `../archive/설계서_초안.md` — 표준용어 정의서: 접미사·사전 파일·표준단어·표준도메인·표준용어(컬럼) (L30–145), 데이터 사전과 변경 내역 (L574–579), 검증 결과 표 (L644–669)
>
> 두 문서에 같은 표(접미사, 변환 규칙, 실행 결과)가 있어 하나로 합쳤습니다.
>
> 이전 문서: `04_파이프라인_구조와_실행.md` · 다음 문서: `06_Silver_정제_03단계.md`

Bronze에 원본 그대로 쌓아 둔 데이터를 **팀 표준 이름과 표준 형식으로 바꿔서** Silver에 저장하는 단계입니다. 처음 보는 팀원도 이 문서만 읽고 실행하고 고칠 수 있게 정리했습니다.

---

## 1. 한 줄 요약

> 출처: `silver_표준화.md` § 1 (L10–21)

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

> 출처: `silver_표준화.md` § 2 (L25–32)

| 질문 | 결정 | 이유 |
|---|---|---|
| Silver에서 어디까지 하나? | **표준화만** (이름·타입·표기). 행 수 = Bronze | 단계마다 "몇 건이 어디서 왜 바뀌었나"를 따로 확인할 수 있게. 중복 제거·법정동 부여는 다음 단계 |
| 어떤 데이터셋? | **bronze 11개 전부** | 상가·심평원도 검증용으로 쓰므로 같은 표준으로 맞춰 둔다 |
| 사전은 어떤 형식? | **`metadata/` CSV** | 팀 README 규칙("기준은 `metadata/`, 코드는 CSV를 읽기만"). 엑셀로 열어서 고칠 수 있음 |
| 코드는 어디에? | **`pipeline/`** | 팀 README 폴더 규칙 (`pipeline/silver/`, `pipeline/common/`) |

---

## 3. 사전 파일과 산출물

> 출처: `silver_표준화.md` § 3 (L36–71) + `설계서_초안.md` § 사전 파일 (L50–62), § 데이터 사전과 변경 내역 (L574–579)

팀 규칙에 따라 기준은 모두 `metadata/`의 CSV(utf-8-sig, 엑셀로 열어 고칠 수 있음)로 두고, 코드는 읽기만 합니다.

| 파일 | 내용 | 줄 수 | 누가 읽나 |
| --- | --- | --- | --- |
| `ds_dataset.csv` | 데이터셋 정의: 원천 경로, zip 안쪽 파일, 인코딩, 구분자, XML 행 경로, 출력 방식 | 11 | 01 단계 |
| `std_suffix.csv` | 접미사 → 허용 저장 타입 (`_NUM` → INT64 / FLOAT64) | 9 | 02 단계 |
| `std_word.csv` | 표준단어와 뜻 (`DEAL` = 거래) | 189 | 02 단계 |
| `std_domain.csv` | 변환 규칙과 결과 타입, 실패로 보는 경우 (`MANWON` = 만원 → 원) | 17 | 02 단계 |
| `std_term.csv` | 표준용어: 데이터셋 · 파일 패턴 · 원천 컬럼 → 표준 컬럼 · 한글명 · 타입 · 규칙 ← **코드가 실제로 읽는 표** | 419 (11개 데이터셋) | 02 단계 |

**02 단계는 변환 전에 사전을 먼저 검사합니다.** 이름 형식, 접미사와 타입의 짝, 모든 단어가 `std_word.csv`에 있는지, 규칙의 결과 타입이 사전 타입과 같은지, bronze의 모든 컬럼이 사전에 있는지를 봅니다. 하나라도 틀리면 몇 번째 줄이 왜 틀렸는지 알려 주고 아무 파일도 쓰지 않습니다.

**산출물과 기록**

```
data/silver/                      ← 결과 (git 에는 README.md 만 올라감)
├── {데이터셋}/02_silver__{데이터셋}[__{세부}].parquet
└── README.md                     실행 요약 (자동 생성)

report/silver/                    ← 실행 기록 (git 에 올림)
├── 02_silver__manifest.csv       파일별 행 수 검증·실패 칸 수·재실행 상태
└── 02_silver__change_log.csv     컬럼별 빈 값→NULL, 바뀐 건수, 실패 건수, 변경 전→후 예시
```

- silver 모든 행에 `SRC_FILE_NM` + `SRC_ROW_NUM`(원천 위치)과 `STD_ERR_TXT`(변환 실패 컬럼)를 둡니다.
- `data/` 아래는 `.gitignore`로 데이터 파일이 올라가지 않습니다. 그래서 다른 팀원이 볼 실행 기록은 `report/silver/`에 둡니다.
- 사람이 읽는 설명과 사전 변경 이력은 원래 `../archive/silver_표준화.md`에 둡니다(변경 이력은 `10_진행현황_체크리스트와_미결사항.md`에도 모음).

---

## 4. 이름 짓는 규칙 (표준용어)

### 4-1. 접미사

> 출처: `설계서_초안.md` § 표준용어 정의서 (L32–48) = `silver_표준화.md` § 6 (L106–131) — **두 문서의 표를 합침**

Silver 컬럼은 영문 대문자 표준단어를 `_`로 잇고, **마지막 단어(접미사)가 값의 종류와 저장 타입**을 정합니다. 코드에는 규칙의 동작만 있고, 어떤 컬럼에 어떤 규칙을 쓰는지는 모두 CSV에 있습니다.

```
DEAL _ AMT _ NUM          TRD _ STATE _ CD         MED _ INST _ TEL
거래   금액   숫자          영업   상태    코드          의료   기관    전화번호
```

| 접미사 | 뜻 | 저장 타입 | 예 |
| --- | --- | --- | --- |
| `_KEY` | 개체를 식별하는 키 (자연키) | STRING | `STORE_KEY`, `MED_INST_KEY`, `APT_KEY`, `LCNS_KEY` |
| `_CD` | 분류·체계 코드 | STRING | `LDONG_CD`, `SGG_CD`, `INDUTY_SCLS_CD` |
| `_NM` | 명칭 | STRING | `STORE_NM`, `APT_NM`, `BPLC_NM` |
| `_DTM` | 시간 (날짜 · 날짜+시각 · 시각) | DATE / DATETIME / TIME | `DEAL_DTM`, `UPD_DTM`, `TRMT_MON_BGN_DTM` |
| `_NUM` | 숫자 (개수·금액·면적·층·좌표) | INT64 / FLOAT64 | `DEAL_AMT_NUM`, `EXCL_AREA_NUM`, `FLR_NUM` |
| `_YN` | 여부 | BOOL | `CNCL_YN`, `MULTI_USE_YN` |
| `_ADDR` | 주소 | STRING | `ROAD_ADDR`, `JIBUN_ADDR` |
| `_TEL` | 전화번호 | STRING | `MED_INST_TEL`, `SITE_TEL` |
| `_TXT` | 형식이 정해지지 않은 텍스트·원문 | STRING | `CNTRCT_TERM_TXT`, `FLR_INFO_TXT` |

- 원천 필드명은 Bronze에만 남기고, Silver부터는 표준용어만 사용
- 한글 용어명은 행정안전부 공공데이터 공통표준용어를 기준으로 하고, 영문 약어는 이 프로젝트의 규칙
- 이름·타입·규칙을 바꿀 때는 코드가 아니라 `metadata/std_term.csv`를 고치고, `python pipeline/silver/02_normalize.py --check`로 검사한 뒤 `../archive/silver_표준화.md`의 "변경 이력"에 한 줄을 남김

**검사기(`--check`)가 자동으로 확인하는 것**
- 이름이 영문 대문자·숫자·`_` 형식인가
- 접미사가 `std_suffix.csv`에 있고, 타입이 그 접미사에 허용된 타입인가
- 이름의 모든 단어가 `std_word.csv`에 있는가
- 규칙의 결과 타입이 사전의 타입과 같은가 (`MANWON` → `INT64`)

### 4-2. 이름을 정할 때 지킨 원칙

> 출처: `silver_표준화.md` § 6 (L133–140)

| 원칙 | 예 |
|---|---|
| 같은 뜻이면 데이터셋이 달라도 같은 이름 | 인허가 5종의 `MGTNO`, 일반음식점 CSV의 `관리번호` → 모두 `LCNS_KEY` |
| 같은 이름이라도 **체계가 다르면** 다른 이름 | 상가의 `시도코드`(법정동 체계) → `SIDO_CD` / 심평원의 `시도코드`(심평원 자체 6자리) → `HIRA_SIDO_CD` |
| 좌표계가 다르면 다른 이름 | 경도·위도 → `LON_NUM`/`LAT_NUM`, 인허가 TM → `TM_X_NUM`, 일반음식점 CSV → `UTMK_X_NUM` |
| 해석이 갈리는 값은 원문도 같이 남김 | 층정보 → `FLR_INFO_TXT`(원문) + `FLR_NUM`(정수) / 계약기간 → `CNTRCT_TERM_TXT` + 시작·종료월 |

### 4-3. 표준단어 (자주 쓰는 것)

> 출처: `설계서_초안.md` § 표준단어 (L64–84)

자주 쓰는 단어만 추렸습니다. 전체 189개는 `metadata/std_word.csv`에 있고, 사전 검사는 컬럼 이름의 모든 단어가 이 파일에 있는지 확인합니다.

| 약어 | 뜻 | 약어 | 뜻 | 약어 | 뜻 |
| --- | --- | --- | --- | --- | --- |
| SIDO | 시도 | SGG | 시군구 | UMD / EMD | 읍면동 |
| LDONG | 법정동 | ADONG | 행정동 | PNU | 필지고유번호 |
| INDUTY | 업종 | LCLS / MCLS / SCLS | 대 / 중 / 소분류 | KSIC | 표준산업분류 |
| BLDG | 건물 | FLR | 층 | ROAD | 도로명 |
| MED_INST | 요양기관 | INST_TYPE | 종별 | DGSBJT | 진료과목 |
| TRMT | 진료 | BGN / END | 시작 / 종료 | ESTB | 개설 |
| DEAL | 거래·계약 | AMT | 금액 | DPST | 보증금 |
| EXCL_AREA | 전용면적 | CNCL | 해제 | RGST | 등기 |
| CNTRCT | 계약 | SE | 구분 | LON / LAT | 경도 / 위도 |
| LCNS | 인허가 | LGOV | 자치단체 | BPLC | 사업장 |
| TRD_STATE | 영업상태 | DTL | 상세 | CLSBIZ | 폐업 |
| UPTAE | 업태 | SNT | 위생 | TM | 평면직각좌표(TM) |
| EMP | 종업원 | FCTY / HQ | 공장 / 본사 | GRNT | 보증 |
| FACIL | 시설 | TRAD | 전통 | UPD | 데이터 갱신 |
| VCNTY | 주변 | GRD | 등급 | WTR_SPLY | 급수 |

> 03 단계에서 새로 필요한 단어(`ANLS`, `RULE`, `MOVE`, `REPL`, `ABNRM`, `OUT`, `SEOUL`, `SCOPE`)는 2026-11-20 기준 아직 `std_word.csv`에 없습니다(`06_Silver_정제_03단계.md` 7장).

---

## 5. 변환 규칙 (`std_domain.csv`, 17개)

> 출처: `설계서_초안.md` § 표준도메인 · 변환 규칙 (L86–107) + `silver_표준화.md` § 7 (L144–168) — **두 표를 합침** (설계서의 "결과 타입" + silver_표준화의 "예시")

| 규칙 | 결과 타입 | 하는 일 | 바꾸기 전 → 후 | 실패로 보는 경우 |
| --- | --- | --- | --- | --- |
| `TRIM` | STRING | 앞뒤 공백 제거, 빈 값 → NULL | `" 강남구 "` → `"강남구"` | 없음 |
| `TEXT` | STRING | TRIM + 연속 공백 1칸 | `"서울  중구"` → `"서울 중구"` | 없음 |
| `NAME` | STRING | TEXT + 전각 영문·숫자·기호를 반각으로. 한글 자모(ㆍ)는 그대로 | `"１４호점（본점）"` → `"14호점(본점)"` | 없음 |
| `CODE` / `CODE(n)` | STRING | TRIM + 대문자. n이 있으면 n자리로 0 채움(짧은 분류코드·우편번호만) | `"6035"` → `"06035"` | 없음 |
| `CONCAT` | STRING | 여러 원천 값을 이음 (실거래 sggCd+umdCd → LDONG_CD) | `11680` + `10300` → `"1168010300"` | 일부만 빈 경우 |
| `TEL` | STRING | 숫자만 추출 후 하이픈 표준형 (02-123-4567, 031-123-4567, 1588-1234). `-`처럼 숫자가 없으면 NULL(실패 아님) | `"0212345678"` → `"02-1234-5678"` | 없음 |
| `INT` | INT64 | 쉼표·공백 제거 후 정수 | `"0004"` → `4` | 정수가 아님 |
| `MANWON` | INT64 | 만원 → 원 (× 10,000) | `"82,000"` → `820000000` | 정수가 아님 |
| `FLOOR` | INT64 | 층 표기 → 정수 (B1 → -1) | `"B1"` → `-1` | `지`, `반지층` 등 |
| `FLOAT(n)` | FLOAT64 | 실수, 소수 n자리 반올림 (면적·좌표) | `"1,234.567"` → `1234.57` | 숫자가 아님 |
| `DATE(형식)` | DATE | 날짜 해석(앞뒤 공백은 먼저 제거) | `"2015-06-29   "` → 2015-06-29 | 형식 오류, 없는 날짜 |
| `YMD` | DATE | 분리된 년·월·일을 합침 | `2011`, `1`, `3` → 2011-01-03 | 없는 날짜 |
| `DATETIME(형식)` | DATETIME | 날짜 + 시각 해석 (형식 `%Y-%m-%d %H:%M:%S`). 초 단위로 저장 | `"2015-06-29 12:51:00"` → 일시 | 형식 오류, 없는 날짜 |
| `TERM_BGN` / `TERM_END` | DATE | 계약기간 `A~B`의 시작 / 끝 월 → 그 달 1일 | `"25.02~27.02"` → 2025-02-01 / 2027-02-01 | 형식 오류 (`~26.05`처럼 시작이 없으면 TERM_BGN 실패) |
| `HHMM` | TIME | 진료시간 `900` → 09:00, `0` → NULL(진료 없음, 실패 아님), `2400` → 23:59:59 | `"900"` → 09:00 | 시·분 범위 밖 (`2410`, `93`) |
| `YN(참;거짓)` | BOOL | 값 목록으로 참/거짓 판정. 목록은 쉼표로 여러 개, `BLANK`는 빈 값 | `YN(O;BLANK)`: `"O"` → True, 빈 값 → False | 목록에 없는 값 |

**변환에 실패해도 행은 지우지 않습니다.** 그 칸만 `NULL`이 되고, 같은 행의 `STD_ERR_TXT`에 실패한 컬럼 이름이 남습니다. 빈 값은 실패가 아니라 그냥 NULL입니다. 원래 값은 `SRC_FILE_NM`(원천 파일) + `SRC_ROW_NUM`(원천 행 번호)으로 bronze에서 찾을 수 있습니다.

**`DATETIME` 추가 (2026-11-19)** — 출처: `설계서_초안.md` (L107), `silver_표준화.md` (L168)
처음 도메인 표에는 날짜(`DATE`)와 시각(`TIME`)만 있었습니다. 그런데 인허가 5종의 `LASTMODTS`(최종수정시점)·`UPDATEDT`(데이터갱신일시)와 일반음식점 CSV의 `최종수정일자`·`데이터갱신일자`는 `2015-06-29 12:51:00`처럼 시각까지 들어 있습니다. `DATE`로 바꾸면 시각이 사라지고, 3차에서 같은 업소의 최신 행을 고를 때 같은 날 갱신된 행끼리 순서를 정할 수 없습니다. 그래서 `DATETIME` 규칙과 저장 타입(parquet `timestamp[s]`, 시간대 없음 = 원천 표기 그대로 KST)을 추가하고 `_DTM` 접미사의 허용 타입에 넣었습니다.

---

## 6. 표준용어 (핵심 컬럼)

> 출처: `설계서_초안.md` § 표준용어 (컬럼) (L109–145)

| 구분 | 용어명 | 컬럼명 | 타입 | 원천 필드 | 변환 규칙 |
| --- | --- | --- | --- | --- | --- |
| 공통 | 법정동코드 | LDONG_CD | STRING | 실거래 sggCd+umdCd / 상가 법정동코드 | CONCAT / CODE |
| 공통 | 시군구코드 | SGG_CD | STRING | 실거래 sggCd / 상가 시군구코드 | CODE |
| 공통 | 행정동코드 | ADONG_CD | STRING | 상가 행정동코드 | CODE |
| 추적 | 원천 파일 경로 / 행 번호 | SRC_FILE_NM / SRC_ROW_NUM | STRING / INT64 | bronze _source_file / _source_row | TRIM / INT |
| 시스템 | 변환 실패 컬럼 | STD_ERR_TXT | STRING | (2차에서 생성) | — |
| 매매·전월세 | 단지 일련번호 / 단지명 | APT_KEY / APT_NM | STRING | aptSeq / aptNm | TRIM / NAME |
| 매매·전월세 | 계약일 | DEAL_DTM | DATE | dealYear+dealMonth+dealDay | YMD |
| 매매·전월세 | 전용면적(㎡) / 층 / 건축년도 | EXCL_AREA_NUM / FLR_NUM / BUILD_YEAR_NUM | FLOAT64 / INT64 | excluUseAr / floor / buildYear | FLOAT(4) / INT |
| 매매 | 거래금액(원) | DEAL_AMT_NUM | INT64 | dealAmount | MANWON |
| 매매 | 계약 해제 여부 | CNCL_YN | BOOL | cdealType | YN(O;BLANK) |
| 전월세 | 보증금 / 월세(원) | DPST_AMT_NUM / MTHLY_RENT_AMT_NUM | INT64 | deposit / monthlyRent | MANWON |
| 전월세 | 계약기간(원문) / 시작월 / 종료월 | CNTRCT_TERM_TXT / CNTRCT_BGN_DTM / CNTRCT_END_DTM | STRING / DATE | contractTerm | TRIM / TERM_BGN / TERM_END |
| 상가 | 상가업소번호 / 상호명 | STORE_KEY / STORE_NM | STRING | 상가업소번호 / 상호명 | TRIM / NAME |
| 상가 | 업종 소분류코드 | INDUTY_SCLS_CD | STRING | 상권업종소분류코드 | CODE |
| 상가 | 도로명주소 | ROAD_ADDR | STRING | 도로명주소 | TEXT |
| 병원·약국 | 암호화 요양기호 / 요양기관명 | MED_INST_KEY / MED_INST_NM | STRING | 암호화요양기호 / 요양기관명 | TRIM / NAME |
| 병원·약국 | 종별코드 | INST_TYPE_CD | STRING | 종별코드 | CODE(2) |
| 병원·약국 | 전화번호 | MED_INST_TEL | STRING | 전화번호 | TEL |
| 병원·약국 | 개설일자 | ESTB_DTM | DATE | 개설일자 | DATE(%Y-%m-%d) |
| 인허가 | 관리번호 / 사업장명 | LCNS_KEY / BPLC_NM | STRING | MGTNO / BPLCNM | TRIM / NAME |
| 인허가 | 개방자치단체코드 | LGOV_CD | STRING | OPNSFTEAMCODE | CODE |
| 인허가 | 인허가일자 / 폐업일자 | LCNS_DTM / CLSBIZ_DTM | DATE | APVPERMYMD / DCBYMD | DATE(%Y-%m-%d) |
| 인허가 | 최종수정시점 / 데이터갱신일시 | LAST_MDFCN_DTM / UPD_DTM | DATETIME | LASTMODTS / UPDATEDT | DATETIME(%Y-%m-%d %H:%M:%S) |
| 인허가 | 영업상태코드 | TRD_STATE_CD | STRING | TRDSTATEGBN | CODE(2) |
| 인허가 | 업태구분명 | UPTAE_NM | STRING | UPTAENM | NAME |
| 인허가 | 좌표 X / Y (TM) | TM_X_NUM / TM_Y_NUM | FLOAT64 | X / Y | FLOAT(3) |
| 의원 | 의료인 수 / 병상 수 / 총면적 | MED_PRSN_NUM / BED_TOT_NUM / TOT_AREA_NUM | INT64 / INT64 / FLOAT64 | METRPNUM / SICBNUM / TOTAR | INT / INT / FLOAT(2) |
| 의원 | 진료과목 코드·명 목록(원문) | DGSBJT_CD_TXT / DGSBJT_NM_TXT | STRING | MEDEXTRITEMSCN / MEDEXTRITEMSCNNM | TEXT |
| 의원·약국 | 휴업 시작 / 종료일 | SUSP_BGN_DTM / SUSP_END_DTM | DATE | CLGSTDT / CLGENDDT | DATE(%Y-%m-%d) |
| 약국 | 영업면적 / 지정일자 | PHARM_AREA_NUM / ASGN_DTM | FLOAT64 / DATE | PHARMTRDAR / ASGNYMD | FLOAT(2) / DATE(%Y-%m-%d) |
| 미용업 | 소재지면적 / 침대 수 | SITE_AREA_NUM / BED_NUM | FLOAT64 / INT64 | SITEAREA / ABEDCNT | FLOAT(2) / INT |

위 표는 데이터셋을 잇는 핵심 컬럼만 추린 것입니다. 원천 필드명은 실제 응답·파일로 확인했고, 데이터셋별 전체 매핑은 `metadata/std_term.csv`에 있습니다. 같은 원천 컬럼 이름이 파일마다 뜻이 다른 심평원 데이터는 `file_glob` 열로 파일을 나눠 적습니다(예: `유형코드`는 식대가산 파일과 간호등급 파일에서 다른 뜻).

---

## 7. 실행 방법

> 출처: `silver_표준화.md` § 4 (L75–87)

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

## 8. 완료 조건

> 출처: `silver_표준화.md` § 5 (L91–102)

네 가지를 **모두** 만족해야 Silver 완료입니다. 하나라도 어기면 종료 코드 1로 끝납니다.

| # | 조건 | 어디서 확인 |
|---|---|---|
| 1 | bronze의 모든 컬럼이 사전에 있고, 사전 형식이 맞다 | `--check` 결과 |
| 2 | silver 행 수 = bronze 행 수 (모든 파일) | manifest의 `row_match` |
| 3 | bronze 파일이 바뀌지 않았다 | 실행 전후 SHA-256 비교 |
| 4 | 다시 실행하면 같은 파일이 나온다 | 두 번째 실행에서 `status = unchanged` |

재실행 동일성을 지키려고 배치 크기(10만 행)와 압축 방식을 고정했고, 파일 안에 실행 시각을 넣지 않습니다.

---

## 9. 실행 결과 (2026-11-19)

> 출처: `silver_표준화.md` § 8 (L172–202) = `설계서_초안.md` § 검증 결과 (L644–669) — **같은 표**

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

규칙은 바꾸지 않고 `NULL` + `STD_ERR_TXT` 기록으로 둡니다(2026-11-19 결정). 다음 단계(정제)에서 어떻게 처리할지 정합니다 → `06_Silver_정제_03단계.md` [G4].

| 데이터셋 | 표준 컬럼 | 원천 값 예시 | 실패 칸 | 이유 |
|---|---|---|---|---|
| apt_rent | `CNTRCT_BGN_DTM` | `~20.11` | 24,246 | 계약기간에 시작월이 없음. 종료월(`CNTRCT_END_DTM`)은 정상, 원문은 `CNTRCT_TERM_TXT`에 있음 (82%가 2024년 서울 계약, 인천·경기 추가분에서는 0칸) |
| store_info | `FLR_NUM` | `지` | 14,984 | 숫자 층으로 바꿀 수 없음. 원문은 `FLR_INFO_TXT`에 있음 (서울 8,674칸) |
| hira_inst | 진료 시작·종료 `*_DTM` | `2410`, `93` | 27 | 시·분 범위 밖 (같은 기관이 요일마다 반복) |
| beauty | `CLSBIZ_DTM` | `20060229` | 1 | 없는 날짜 (2006년은 윤년이 아님) |

컬럼별 상세(빈 값→NULL 건수, 값이 바뀐 건수, 변경 전→후 예시)는 `report/silver/02_silver__change_log.csv`에 있습니다.

---

## 10. 사전을 고칠 때

> 출처: `silver_표준화.md` § 9 (L206–233)

1. **코드는 고치지 않고 `metadata/std_term.csv`만 고칩니다.** 엑셀로 열어도 됩니다(`utf-8-sig`로 저장되어 있어 한글이 깨지지 않음).
2. 새 단어가 필요하면 `std_word.csv`에 먼저 한 줄 추가합니다.
3. `python pipeline/silver/02_normalize.py --check`로 검사합니다. 틀리면 몇 번째 줄이 왜 틀렸는지 알려 줍니다.
4. 해당 데이터셋만 다시 실행합니다: `--dataset 데이터셋이름`
5. `../archive/silver_표준화.md`의 "변경 이력"에 한 줄을 남깁니다.

### `std_term.csv` 한 줄 읽는 법

| dataset | file_glob | source_column | standard_column | korean_name | type | rule | description |
|---|---|---|---|---|---|---|---|
| apt_trade | `*` | `dealAmount` | `DEAL_AMT_NUM` | 거래금액(원) | INT64 | `MANWON` | 원천 단위 만원 |
| apt_trade | `*` | `dealYear+dealMonth+dealDay` | `DEAL_DTM` | 계약일 | DATE | `YMD` | 세 컬럼을 하나로 |
| hira_inst | `*식대가산정보*` | `유형코드` | `MEAL_ADD_TYPE_CD` | 식대가산 유형코드 | STRING | `CODE(2)` | |
| `*` | `*` | `_source_file` | `SRC_FILE_NM` | 원천 파일 경로 | STRING | `TRIM` | |

- `dataset`: bronze 하위 폴더 이름. `*`는 모든 데이터셋에 붙는 줄(원천 추적 컬럼)입니다.
- `file_glob`: 이 줄을 적용할 bronze 파일 이름 패턴. 거의 다 `*`(전체)입니다. 심평원처럼 **같은 컬럼 이름이 파일마다 뜻이 다를 때만** 파일 이름을 적습니다(`유형코드`가 식대가산 파일과 간호등급 파일에서 다른 뜻).
- `source_column`: 여러 컬럼을 합칠 때는 `a+b+c` (`YMD`, `CONCAT` 규칙만).
- silver 컬럼 순서 = 이 표의 순서 → 공통 컬럼(`SRC_FILE_NM`, `SRC_ROW_NUM`) → `STD_ERR_TXT`.

### 새 데이터셋을 추가할 때

1. 01 단계로 `data/bronze/{새 데이터셋}/`을 만든다.
2. `std_term.csv`에 그 데이터셋의 컬럼마다 한 줄씩 추가한다.
3. `--check` → `--dataset 새데이터셋`으로 실행한다.

---

> 아직 정해야 할 것(새로 정한 컬럼 이름 확인 등)과 변경 이력은 `10_진행현황_체크리스트와_미결사항.md`에 모았습니다.
