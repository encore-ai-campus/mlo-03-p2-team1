# Silver 정제(03) 실행·검증 계획 — 테스트 브랜치

Nov 20, 2026 · 브랜치 `feature/silver-03-clean` (기준: `docs/silver-cleaning`)

`docs/silver_정제.md`(초안)의 규칙을 실제 데이터에 돌려 보고, 문서의 수치·완료 조건이 맞는지 확인하는 계획입니다.

> 규칙은 아직 **팀 합의 전 제안**입니다. 이 브랜치의 `metadata/cln_*.csv` 값도 초안 값이며, 테스트 결과는 팀 리뷰 자료로 씁니다.

---

## 0. 기준선: 02 silver 재생성 (완료)

| 항목 | 결과 |
|---|---|
| `02_normalize.py --check` | 통과 (사전 419줄, 데이터셋 11개, bronze 37개 파일) |
| `02_normalize.py` 전체 실행 | 통과 — 행 수 일치 37/37, bronze 불변, 약 4분 40초 |
| 커밋된 `02_silver__manifest.csv`와 비교 | 37개 파일 **SHA-256 모두 동일** (팀원 실행 결과 그대로 재현) |
| 다시 실행 | 37/37 `unchanged` 확인 |

→ 03 테스트의 입력은 팀이 본 02 결과와 바이트 단위로 같습니다. 03 결과 수치를 문서 수치와 직접 비교할 수 있습니다.

---

## 1. 03 실행 전 준비

### 1-1. 먼저 정할 것 (구현을 막는 것)

| # | 내용 | 테스트용 가정 |
|---|---|---|
| a | 03이 파일을 만드는 데이터셋 | 인허가 5종만 (`food_general`, `food_rest`, `clinic`, `pharmacy`, `beauty`). 실거래가는 새 컬럼이 없어 `issue_list`(`SAME_DEAL`)만 씀. `hira_inst`·`store_info`·`ldong_code`는 참조만 |
| b | 산출물 구성 (8장 2번) | 업종별 파일 `data/silver/{ds}/03_silver__{ds}.parquet`. 3NF 분리는 다음 단계 |
| c | 자리표시 전화번호 목록 [C6] | 1차 실행 때 빈도 상위 번호를 뽑아 보고 `cln_placeholder.csv` 확정 → 재실행 |

### 1-2. `metadata/` 초안 작성 (6장)

`cln_flag.csv`, `cln_code_value.csv`, `cln_trd_state_map.csv`, `cln_lgov_sgg_map.csv`, `cln_induty_rule.csv`, `cln_param.csv`, `cln_placeholder.csv`, `known_issues.csv`

- `std_word.csv`에 `ANLS`, `RULE`, `MOVE`, `REPL`, `ABNRM`, `OUT`, `SEOUL`, `SCOPE` 추가 (7장)
- `cln_trd_state_map.csv`는 [C1] 표의 6개 조합 그대로 시작 → 없는 조합이 나오면 완료 조건 5로 실패하는지 확인

---

## 2. 구현 순서 (규칙 묶음별로 쌓으며 확인)

`pipeline/silver/03_clean.py` 하나에 단계 함수로 넣고, 단계마다 3장의 수치 검증을 통과한 뒤 다음으로 갑니다. 02와 같은 안전 장치(`common/files.py`의 SHA 스냅샷·`replace_if_changed`, `common/report.py`의 `merge_dataset_rows`)를 씁니다.

| 단계 | 규칙 | 붙는 컬럼 / 기록 |
|---|---|---|
| S1 | `--check`: 코드표·정의표·`std_word` 검사 | (파일 안 씀) |
| S2 | [A1] 일반음식점 API + CSV 보완, [C3] 휴게음식점 중복 제거 | `LDONG_CD`(원본코드), `DUP_REMOVED` |
| S3 | [C1] 영업 상태, [C2] 대용 폐업일, [C5] 이상 날짜 | `ANLS_TRD_STATE_CD`/`TRD_STATE_SRC_CD`, `ANLS_CLSBIZ_DTM`/`CLSBIZ_SRC_CD`, `ABNRM_LCNS_DTM_YN` |
| S4 | [D1]~[D4] 법정동 | `LDONG_CD`/`LDONG_SRC_CD`, `OUT_SEOUL_ADDR_YN`, `ADDR_MISMATCH` |
| S5 | [E1]~[E6] 업종 분류 | `ANLS_INDUTY_CD`/`INDUTY_RULE_CD`, `OUT_SCOPE_YN` |
| S6 | [C4] 깨진 문자, [C6] 자리표시 값, [G2] 동일 조건 거래 | `issue_list`만 |
| S7 | [F0]~[F3] 이전 → 재등록 → 교체 | `ANLS_LCNS_DTM`/`LCNS_SRC_CD`, `MOVE_PRE_KEY`, `REPL_PRE_KEY`/`REPL_TYPE_CD`, `AMBIG_LINK`, `TIME_CONFLICT` |
| S8 | 기록 3종 + 완료 조건 1~8 | `report/silver/03_silver__{manifest,change_log,issue_list}.csv` |

S7(연결)이 가장 복잡하고 다른 단계 결과(분석용 폐업일, 법정동, 자리표시 전화번호)에 기대므로 마지막에 둡니다.

---

## 3. 검증 계획

### L0. 사전 검사 — `03_clean.py --check`

- 코드표에 없는 값을 일부러 넣은 metadata로 실행 → 종료 코드 1인지 확인 (음성 테스트)

### L1. 규칙 단위 검사 — `pipeline/validation/check_cln_rules.py` (신규)

`check_std_rules.py`와 같은 방식으로, 작은 예시 행으로 규칙 함수만 검사합니다.

| 규칙 | 예시 | 기대 |
|---|---|---|
| [D1] 동명 추출 | `서울특별시 종로구 종로6가 …` / `율곡로 286 (종로6가)` | 종로6가 (`~가` 처리) |
| [D1] 동명부터 시작 | `대치동 603 201호` | 지번 실패 → 도로명으로 |
| [D2] 행정동식 | `상일제1동`, `방이1동` | `지번_정규화` |
| [C6] 전화번호 비교 | 둘 다 `02-0000-0000` | 일치 아님 |
| [C4] 상호 비교 | `카페�스` vs `카페스` | 같은 상호 |
| [F1] 재등록 | 제이약국 (A 2019-06-30 폐업, B 2019-07-01 개업, 같은 번지) | B.`REPL_TYPE_CD` = 재등록 |
| [F2] 교체 | 같은 지번, 다른 상호, 3일 뒤 | 교체 |
| [F3] 이전 | 14일동안 (서대문 → 마포, 전화 일치) | 마포 `ANLS_LCNS_DTM` = 2014-03-24 |
| [F3] 연결 안 함 | 가마솥진국 (같은 종료일) | 연결 없음 + `AMBIG_LINK` |
| [F0] ④ | A 하나에 B 후보 둘 | 연결 없음 + `AMBIG_LINK` |
| [F0] ② | B 개업일 ≤ A 개업일 | `TIME_CONFLICT` |

### L2. 완료 조건 1~8 (문서 4장, 03이 자동 판정)

조건마다 일부러 깨뜨려 보는 음성 테스트를 한 번씩 합니다(예: 02 파일 하나 `touch` 대신 복사본 바이트 변경 → 조건 1 실패, 매핑표 한 줄 삭제 → 조건 5 실패, 출력 하나 지우고 재실행 → `created`).

### L3. 문서 수치 회귀 — `pipeline/validation/check_cln_numbers.py` (신규)

문서의 bronze 점검 수치를 기대값으로 두고 03 결과와 비교합니다. 정확히 같아야 하는 것과 범위로 보는 것을 나눕니다.

**정확히 일치 (02 행 = bronze 행이므로 그대로 나와야 함)**

| 항목 | 기대값 |
|---|---|
| 03 행 수 | food_general 540,008 · food_rest **148,455** (148,778 − 323) · clinic 37,791 · pharmacy 22,500 · beauty 100,349 |
| [C3] 중복 | 323 키 / 646행, 완전 중복 310 + 값 다름 13 (`DUP_REMOVED` 13건 이상) |
| [C1] 상태 조합 | 표의 칸별 건수 (예: 의원 전출 812, 직권폐업 184 / 약국 사용중 1) — 업종별 합계가 02 행 수와 같음 |
| [C2] 대용 폐업일 | 의원 835 · 약국 4,795 · 일반 27 · 휴게 4 · 미용 6 (+ 의원 전출 812는 `최종수정일자_전출`) |
| [C4] 깨진 칸 | 일반 178/56/54, 휴게 147/17/9 |
| [C5] 1950년 이전 | 의원 178 · 일반 69 · 휴게 13 · 약국 9 · 미용 9 (합 278) |
| [C5] 기타 | `FUTURE_CLSBIZ` 1 (휴게), `INVALID_CLSBIZ` 1 (미용) |
| [D4] 전출 주소 | 10 |
| [E3] 편의점 업태 | 13,372 (브랜드 상호 추가분은 별도 기록) |
| [E5]/[E6] 대상외 | 의원 50, 미용 2 |
| [A1] 키 일치 | API ↔ CSV `LCNS_KEY` 1:1, 불일치 0 |

**범위·비율로 보는 것 (2017년 이후 영업 기준, 차이가 크면 원인 기록)**

| 항목 | 기대 |
|---|---|
| [D1] 법정동 성공률 | 의원 99.9% · 약국 99.8% · 나머지 100.0%, 실패 36/17/12/46/4 근처 |
| [D3] 서울 밖 | 업종별 4~14, 2017 이후 28 |
| [D1] 지번·도로명 불일치 | 업종별 7~31 |
| [E1] 카페 | 상가정보 대조율 A ≈ 52%, C ≈ 72% |
| [F1] 약국 재등록 | 후보 524 근처 (확정 수는 이번에 처음 셈) |
| [F3] 이전 | 확정 수 ≤ 전화번호 일치 묶음 (의원 259, 일반 397, 휴게 112, 미용 344, 약국 0) |
| [A4] | 의원 +3, 미용 +17행 차이 재현 여부 기록 |

### L4. 사람 확인 (지목된 개별 레코드)

03 결과에서 직접 찾아 값이 문서 설명과 같은지 봅니다.

- 게이트성형외과의원 (서초 2019-05 전출 → 강남): 강남 레코드 `MOVE_PRE_KEY` 연결 여부, 연결 안 됐다면 이유
- 14일동안, 제이약국, 가마솥진국 (L1과 같은 기대를 실데이터로)
- [C2] 최종수정일 2017년 이후 약국 1건
- 1950년 이전 인허가 중 결과가 달라지는 6건
- 카페 키워드별 상위 상호 (`change_log`): "치킨로스터"류 오분류가 있으면 제외 키워드로

### L5. 집계 영향 (골드 전 미리 보기)

3-6 집계 기준으로 분기 말 재고만 간단히 계산해 봅니다(골드 코드 아님, 검증 스크립트 안에서).

- 약국 재고: [C2] 적용 전후 차이 ≈ 4,800 → 2026Q3 재고가 현재 영업 중 5,944 근처인지
- 이전 연결 전후 분기 말 재고 차이 (업종별, 2017Q1이 가장 크게 줄어야 함)
- 동 합계 ≤ 구 합계, 차이 = `LDONG_SRC_CD` `실패*` 건수
- 휴업 의원 50·약국 9가 재고에 포함되는지

---

## 4. 실행 순서

```bash
git switch feature/silver-03-clean
python pipeline/silver/03_clean.py --check
python pipeline/validation/check_cln_rules.py          # L1
python pipeline/silver/03_clean.py                     # 1차 → 자리표시 전화번호 후보 확인, cln_placeholder.csv 확정
python pipeline/silver/03_clean.py                     # 2차 (L2 완료 조건)
python pipeline/silver/03_clean.py                     # 3차 → 모두 unchanged (조건 8)
python pipeline/validation/check_cln_numbers.py        # L3 + L5
```

규칙을 고친 뒤에는 바뀐 업종만 `--dataset`으로 다시 돌리고, 마지막에 전체를 한 번 더 돌려 `unchanged`를 확인합니다.

---

## 5. 결과 정리 (팀 리뷰용)

- 커밋: `metadata/cln_*.csv`, `pipeline/silver/03_clean.py`, `pipeline/validation/check_cln_*.py`, `report/silver/03_*` (데이터는 git 밖)
- 이 문서 아래에 **"테스트 결과"** 절을 추가: L3 기대값 ↔ 실제값 표, 어긋난 항목과 원인, L4 개별 확인 결과
- 문서와 다르게 나온 수치는 `silver_정제.md` 수정 제안으로, 결정이 필요한 것은 8장 "아직 정해야 할 것"에 추가
