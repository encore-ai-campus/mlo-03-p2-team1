# Silver 03 정제 작업 내역 (나머지 데이터셋)

> 인허가 5종 03(PR #16) 이후 나머지 데이터셋의 03 정제에서 **어떤 폴더의 어떤 항목이 어떻게 바뀌었는지** 사람이 읽도록 정리한 기록입니다.
> 수치는 아래 기록 파일에서 확인할 수 있습니다: `03_silver__manifest.csv`, `03_silver__change_log.csv`, `03_silver__issue_list.csv`, `03_silver__known_issues_check.csv`.
>
> 기준
> - PR #16 정제 기준: `docs/archive/silver_정제.md`
> - 전달사항 `silver_03_전달사항.md` (2026-11-20)
>   - 법정동은 서울 현행 493개 기준으로 맞추고, 못 찾으면 `LDONG_CD` = NULL로 두고 `SGG_CD`는 남깁니다.
>   - 서울 필터는 03이 아니라 골드에서 합니다.
>   - 계약 해제 행은 지우지 않습니다.

## 진행 현황

| 순서 | 데이터셋 | 상태 | 날짜 |
|---|---|---|---|
| 1 | 실거래가 매매 (`apt_trade`) | **완료** | 2026-11-20 |
| 2 | 실거래가 전월세 (`apt_rent`) | **완료** | 2026-11-20 |
| 3 | 심평원 병의원·약국 (`hira_inst`) | 예정 | |
| 4 | 상가정보 (`store_info`) | 예정 | |
| 5 | 법정동코드 (`ldong_code`) | 예정 | |

## 함께 정한 것 (2026-11-20, 추천안 채택)

| # | 결정 | 적용 |
|---|---|---|
| 1 | 매매에서 코드표에 없는 `LDONG_CD`는 03에서 NULL로 덮어씀 | 원래 값은 02 파일과 `issue_list`(`LDONG_NOT_CURRENT`)에 남음 |
| 2 | 모든 데이터셋에 법정동 출처 컬럼 `LDONG_SRC_CD`를 붙임 | 골드는 인허가와 같은 규칙으로 실패 행을 판단 (`실패*`이면 동 집계 제외, 구 집계 포함) |
| 3 | 동일 조건 거래 플래그(`SAME_DEAL_YN`)를 오후 골드 논의 전에 미리 넣음 | 논의에서 빼기로 하면 컬럼과 `cln_flag.csv` 행을 지움 |
| 4 | 심평원은 병원 + 약국 기관 파일 하나만 03으로 만듦 | 상세 파일 10개는 02에 그대로 둠 (심평원 작업 때 반영) |
| 5 | 전월세 동일 조건 거래는 `change_log`에 건수만 남김 | 반영 완료 (2. 전월세) |
| 6 | 매매 단가 이상값, 심평원 보건소·이상 개설일은 `issue_list`에만 남김 | 해당 데이터셋 작업 때 반영 |

---

## 1. 실거래가 매매 (`apt_trade`) — 2026-11-20

### 바뀐 내용 요약

| 항목 | 이전 (PR #16) | 이후 |
|---|---|---|
| 03 파일 | 없음 (`issue_list`만 기록, manifest 상태 `issue_list만`) | `data/silver/apt_trade/03_silver__apt_trade.parquet` 생성 |
| 행 수 | — | 02와 같음 4,265,480행. 계약 해제 77,802행(서울 17,661)도 삭제하지 않음 |
| 범위 | — | 82개 시군구 모두 유지 (서울·경기·인천). 서울 필터는 골드에서 `SGG_CD` 앞 2자리 `11`로 |
| `LDONG_CD` | 02 값 (서울 20행이 현행 코드표에 없음) | 현행 코드표에 맞춤. 못 찾은 20행은 **NULL**, `SGG_CD`는 그대로 |
| 새 컬럼 | — | `LDONG_SRC_CD`(법정동 출처), `SAME_DEAL_YN`(동일 조건 거래 여부). 02 컬럼 34개 + 2개 = 36개 |
| 동일 조건 거래 | `issue_list`(`SAME_DEAL`) 서울 12,798행 | 그대로 유지 + 플래그 `SAME_DEAL_YN`(전체 37,756행, 서울 12,798행) |

### 법정동 처리 규칙 [G5] (새로 추가)
1. `LDONG_CD`가 현행(폐지 아님) 법정동 코드표에 있으면 그대로 둡니다. 출처는 `원본코드`입니다.
2. 코드표에 없으면 `SGG_CD` + `UMD_NM`으로 다시 찾습니다. 출처는 `시군구_동명`입니다.
   - 같은 (시군구, 동명)이 코드표에 둘 이상 있으면 쓰지 않습니다.
3. 그래도 못 찾으면 `LDONG_CD`를 NULL로 두고 출처를 `실패`로 적습니다.

| 결과 | 전체 | 서울 |
|---|---:|---:|
| `원본코드` | 4,265,460 | 1,443,108 |
| `시군구_동명` (다시 찾아서 성공) | 0 | 0 |
| `실패` (NULL) | 20 | 20 |

못 찾은 20행은 원천의 동 이름이 그 구에 존재하지 않는 이름입니다(예: 성동구 신당동 — 신당동은 중구). 이름으로 다시 찾아도 복구되지 않아 NULL로 두었습니다. 이 행들은 동 집계에서는 빠지고 구 집계에는 남습니다.

| `SGG_CD` | `UMD_NM` | 원래 `LDONG_CD` | 행 수 | 거래 연도 |
|---|---|---|---:|---|
| 11200 (성동구) | 신당동 | 1120016200 | 13 | 2007~2025 |
| 11620 (관악구) | 사당동 | 1162010700 | 5 | 2017~2025 |
| 11305 (강북구) | 도봉동 | 1130510800 | 2 | 2025 |

> 문서 정정: `silver_정제.md` [G4] 아래 "매매 `LDONG_CD`는 현행 법정동 코드표와 100% 매칭"은 실제로는 **서울 20행 불일치**입니다. 원본 문서(`docs/archive/`)는 보관용이라 고치지 않고 여기에 기록합니다.

### 동일 조건 거래 플래그 [G2]
- 정의: 해제 아닌 매매 중 키 7개가 같은 묶음에 속하면 `SAME_DEAL_YN` = True입니다. 키 7개는 `LDONG_CD`, `APT_KEY`, `DEAL_DTM`, `DEAL_AMT_NUM`, `EXCL_AREA_NUM`, `FLR_NUM`, `APT_DONG_TXT`입니다. 해제 행은 항상 False입니다.
- 플래그는 82개 시군구 전체에 계산합니다(37,756행). `issue_list`의 묶음 목록은 파일 크기 때문에 기존처럼 서울만 남깁니다(12,798행, 묶음 번호도 기존과 같음).
- 골드에서 어떻게 처리할지는 아직 정하지 않았습니다(`cln_flag.csv`의 `price_deal_trt` = `미정`). 오후 골드 논의에서 확정합니다.

### 폴더·파일별 변경 내역

| 폴더 | 파일 | 바뀐 항목 | 내용 |
|---|---|---|---|
| `data/silver/apt_trade/` | `03_silver__apt_trade.parquet` | **새 파일** | 4,265,480행 × 36컬럼. git에는 올라가지 않음 (SHA-256은 manifest에) |
| `metadata/` | `cln_code_value.csv` | `LDONG_SRC_CD` = `시군구_동명` **추가** | 실거래가 재조회 성공 출처 |
| | | `LDONG_SRC_CD` = `원본코드` 설명 **수정** | 실거래가 원본 `LDONG_CD`도 포함하도록 (`rule_ref`에 G5 추가) |
| | | `ISSUE_CD` = `LDONG_NOT_CURRENT` **추가** | 현행 코드표에 없는 실거래가 법정동 |
| | `cln_flag.csv` | `SAME_DEAL_YN` **추가** | 대상 `apt_trade`, 만든 단계 03, 가격·거래 수 처리 `미정` |
| | `std_word.csv` | `SAME,동일` **추가** | 새 컬럼 `SAME_DEAL_YN`의 표준 단어 |
| | `known_issues.csv` | `KI26`~`KI28` **추가** | 서울 법정동 불일치 20, 동일 조건 거래 12,798, 계약 해제 17,661 |
| `pipeline/silver/` | `cln_rules.py` | 함수 3개 **추가** | `sgg_umd_lookup`, `trade_ldong`, `same_deal`. 상수 `TRADE_NEW_COLUMNS`, `TRADE_SAME_DEAL_KEY` |
| | | `check_meta` **수정** | 매매 새 컬럼도 표준 단어·플래그 정의표 검사 |
| | `03_clean.py` | `same_deal()` → `clean_trade()` **교체** | 03 파일 생성, 법정동 보정, 플래그, 매매 완료 조건 검사 |
| | | `write_parquet()` **수정** | 데이터셋별 새 컬럼 목록을 받음. 문자열 변환 속도 개선 (인허가 결과 SHA-256 동일 확인) |
| `pipeline/validation/` | `check_cln_rules.py` | L1 검사 3개 **추가** | G5 재조회·실패, 폐지 코드 제외, G2 묶음 (전체 36/36 통과) |
| | `check_cln_numbers.py` | G1·G2·G5 측정 **추가** | 03 매매 파일에서 서울 기준으로 셈 |
| `report/silver/` | `03_silver__manifest.csv` | `apt_trade` 행 | `issue_list만` → 03 파일 경로·행 수·SHA-256·`unchanged` |
| | `03_silver__change_log.csv` | `apt_trade` 행 | `LDONG_SRC_CD`(전체·서울) 건수, `G2 SAME_DEAL_YN`, `G1 CNCL_YN`, 이슈 `LDONG_NOT_CURRENT` 추가 |
| | `03_silver__issue_list.csv` | `LDONG_NOT_CURRENT` 20행 **추가** | `원래 값 → (NULL) / 실패 / SGG_CD·UMD_NM` |
| | `03_silver__known_issues_check.csv` | `KI26`~`KI28` | 3건 모두 OK |
| | `03_silver__작업내역.md` | **새 파일** | 이 문서 |

### 골드에서 읽는 방법 (전달사항 기준)
- **서울:** `SGG_CD` 앞 2자리가 `11`인 행
- **분기:** 계약일 `DEAL_DTM` 기준. 분석 기간은 2017Q1~2026Q3
- **가격·거래 수:** `CNCL_YN` = True인 행은 뺌. 해제율 지표에는 사용
- **동 집계:** `LDONG_CD`가 NULL인 행(출처 `실패`)은 동 집계에서 빠지고 구(`SGG_CD`) 집계에는 남음
- **동일 조건 거래:** `SAME_DEAL_YN` 처리는 오후 논의 결과를 따름

### 검증 결과
- `03_clean.py` 전체 실행: 완료 조건 통과, 02 파일 바뀌지 않음, 기록 건수 일치
- 두 번째 실행: 재실행 동일 **6/6 `unchanged`**
- 인허가 5종 03 파일은 이번 수정 후에도 SHA-256이 PR #16 manifest 값과 같음
- 02 ↔ 03 매매 비교:
  - 02 컬럼 34개의 순서·타입이 같음
  - 값이 다른 컬럼은 `LDONG_CD` 하나(20행)
  - `SGG_CD` 빈 값 0
  - 해제 행 77,802행 모두 남음
- L1 `check_cln_rules.py`: 36/36 통과
- L3 `check_cln_numbers.py`: 정확 비교 28건 중 NG 0
- `check_std_rules.py`: 19/19 통과

---

## 2. 실거래가 전월세 (`apt_rent`) — 2026-11-20

### 바뀐 내용 요약

| 항목 | 이전 | 이후 |
|---|---|---|
| 03 파일 | 없음 | `data/silver/apt_rent/03_silver__apt_rent.parquet` 생성 |
| 행 수 | — | 02와 같음 8,001,132행 (서울 3,107,551). 삭제 0 |
| 범위 | — | 82개 시군구 모두 유지. 서울 필터는 골드에서 |
| 02 컬럼 | — | 28개 **값·순서·타입 모두 02와 동일** (Arrow 테이블 비교로 확인) |
| 새 컬럼 | — | `LDONG_CD`, `LDONG_SRC_CD` (28 + 2 = 30개) |
| 동일 조건 거래 | — | 컬럼·`issue_list` 없이 `change_log`에 건수만 (전체 870,708행, 서울 294,250행) |

### 법정동 부여 [G5]
- 02에 `LDONG_CD`가 없어서 모든 행을 `SGG_CD` + `UMD_NM`으로 찾습니다. 출처는 `시군구_동명`, 못 찾으면 NULL + `실패`입니다.
- **결과: 8,001,132행 모두 성공(실패 0).** 서울 법정동은 345개가 나옵니다.
- 경기·인천 읍면 지역은 `UMD_NM`이 "강화읍 갑곳리"처럼 두 단어입니다. 처음 규칙(마지막 이름만 비교)으로는 488,322행(서울 0)이 매칭되지 않았습니다.
  - 그래서 재조회 표 `sgg_umd_lookup`이 **시군구 아래 전체 이름**("강화읍 갑곳리")도 받도록 고쳤습니다.
  - 마지막 이름만("갑곳리")으로 찾는 키는 시군구 안에서 유일할 때만 둡니다.
- 교차 확인: 같은 표로 매매의 (`SGG_CD`, `UMD_NM`) 1,072개 조합을 찾았습니다.
  - 찾은 1,061개가 모두 원천 `LDONG_CD`와 같습니다.
  - 못 찾은 11개 조합 중 3개가 매매 실패 20행이고, 나머지는 원천 코드가 현행이라 재조회를 쓰지 않습니다.
  - 매매 03 파일은 바뀌지 않았습니다(`unchanged`).

### 건수만 기록한 것 (`change_log`, 값은 그대로)

| 항목 | 서울 | 비고 |
|---|---:|---|
| 전세 (`MTHLY_RENT_AMT_NUM` = 0) | 2,011,084 | 전세·월세 구분은 골드에서 [G3] |
| 월세 | 1,096,467 | |
| 보증금 0 | 2,777 | 보증금 없는 월세. 값 유지 |
| `CNTRCT_SE_NM`(신규/갱신) 값 있음 | 1,289,466 | 2021년 이후만 값이 있어 보조 분석용 |
| 동일 조건 거래 (키 7개) | 294,250 | 키: `LDONG_CD`·`APT_KEY`·`DEAL_DTM`·`EXCL_AREA_NUM`·`FLR_NUM`·`DPST_AMT_NUM`·`MTHLY_RENT_AMT_NUM`. 동·호 정보가 없어 정상 계약일 수 있음. 전체 870,708 |
| `CNTRCT_BGN_DTM` 변환 실패 | 24,246 (전체) | 02 `STD_ERR_TXT`에 기록됨. NULL 유지 [G4] |

### 특이사항
- **전월세에는 계약 해제 컬럼(`CNCL_YN`)이 없습니다.** bronze·02 전월세 컬럼에 해제 항목이 없습니다. 그런데 `cln_flag.csv`의 `CNCL_YN` 대상이 `apt_trade;apt_rent`로 되어 있어 `apt_trade`만 남기도록 고쳤습니다. 전월세는 해제 거래를 걸러낼 수 없다는 점을 골드에서 알고 있어야 합니다.

### 폴더·파일별 변경 내역

| 폴더 | 파일 | 바뀐 항목 | 내용 |
|---|---|---|---|
| `data/silver/apt_rent/` | `03_silver__apt_rent.parquet` | **새 파일** | 8,001,132행 × 30컬럼. git에는 올라가지 않음 (SHA-256은 manifest에) |
| `metadata/` | `cln_flag.csv` | `CNCL_YN` 대상 **수정** | `apt_trade;apt_rent` → `apt_trade` (전월세에 해당 컬럼 없음) |
| | `cln_code_value.csv` | `LDONG_NOT_CURRENT` 설명 **수정** | "현행 코드표에 없음" → "현행 코드표에서 찾지 못함" (전월세처럼 원래 코드가 없는 경우 포함) |
| | `known_issues.csv` | `KI29`·`KI30` **추가** | 서울 전월세 법정동 실패 0, 계약 시작일 변환 실패 24,246 |
| `pipeline/silver/` | `cln_rules.py` | `sgg_umd_lookup` **수정** | 읍면 + 리 전체 이름 키 추가, 마지막 이름 키는 유일할 때만 |
| | | 상수 `RENT_NEW_COLUMNS` **추가** | `LDONG_CD`, `LDONG_SRC_CD` |
| | `03_clean.py` | `clean_rent()` **추가** | 02 Arrow 테이블에 새 컬럼만 붙여 저장 (800만 행이라 메모리 절약), 건수 기록, 완료 조건 검사 |
| | | `ALL_DATASETS`에 `apt_rent` **추가** | `--dataset apt_rent`로 따로 실행 가능 |
| `pipeline/validation/` | `check_cln_rules.py` | L1 검사 1개 **추가** | 읍면 + 리 이름, 같은 리 이름이 두 개일 때 처리 (전체 37/37 통과) |
| | `check_cln_numbers.py` | G4 측정 **추가** | `change_log`의 `CNTRCT_BGN_DTM_변환실패` |
| `report/silver/` | `03_silver__manifest.csv` | `apt_rent` 행 **추가** | 03 파일 경로·행 수·SHA-256 |
| | `03_silver__change_log.csv` | `apt_rent` 행 **추가** | 법정동 출처, G3·G4, 동일 조건 건수 (10행) |
| | `03_silver__issue_list.csv` | 변화 없음 | 법정동 실패 0건이라 추가 행 없음 |
| | `03_silver__known_issues_check.csv` | `KI29`·`KI30` | 2건 모두 OK |

### 골드에서 읽는 방법
- **서울:** `SGG_CD` 앞 2자리가 `11`인 행
- **분기:** 계약일 `DEAL_DTM` 기준
- **전세·월세:** `MTHLY_RENT_AMT_NUM`이 0이면 전세, 아니면 월세
- **해제:** 해제 컬럼이 없어 걸러낼 수 없음
- **동 집계:** `LDONG_CD` 기준. 현재 NULL 0행

### 검증 결과
- `03_clean.py` 전체 실행: 완료 조건 통과. 두 번째 실행에서 **7/7 `unchanged`** (인허가 5종 + 매매 + 전월세)
- 02 ↔ 03 전월세: 02 컬럼 28개가 Arrow 테이블 비교로 완전히 같음. `LDONG_CD` NULL 0, 앞 5자리 = `SGG_CD`
- L1 `check_cln_rules.py`: 37/37 통과
- L3 `check_cln_numbers.py`: 정확 비교 30건 중 NG 0
- `check_std_rules.py`: 19/19 통과
