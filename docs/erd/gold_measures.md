# Gold 측정값 정의

Gold 팩트·마트 테이블에 들어가는 측정값의 의미와 계산 방법, Silver 원천을 정리합니다. 테이블 구성과 한 행의 의미는 [README 6. Gold 데이터](../../README.md#6-gold-데이터-스타-스키마)에 있습니다.

## 공통 사항

- 모든 팩트는 Silver 03 파일을 직접 읽습니다. 매매는 `apt_trade`, 인허가는 `food_general`·`food_rest`·`clinic`·`pharmacy`·`beauty` 5종입니다.
- 키 `LDONG_CD`는 `dim_region`, `YQ`는 `dim_date`, `ANLS_INDUTY_CD`는 `dim_lcns_induty`와 연결됩니다.
- 법정동 매칭에 실패한 행(`LDONG_SRC_CD`가 `실패…`)은 동 단위 집계에서 빠집니다.
- 가격 표본 기준 5건은 [`metadata/rule_gold_apt_price.csv`](../../metadata/rule_gold_apt_price.csv)의 `MIN_PRICE_SAMPLE_CNT`, 업종 묶음은 [`metadata/rule_gold_induty.csv`](../../metadata/rule_gold_induty.csv)를 따릅니다.
- 구현: [`pipeline/gold/04_gold.py`](../../pipeline/gold/04_gold.py), [`pipeline/gold/price_index.py`](../../pipeline/gold/price_index.py)

## 1. `fact_apt_trd`: 아파트 매매 거래 1건 = 1행

Silver 03 `apt_trade`에서 서울·분석 기간 거래만 남기고, 계약 해제(`CNCL_YN`)를 빼고, 동일 조건 거래(`SAME_DEAL_YN`)는 묶음마다 1건만 남긴 뒤, 법정동이 유효한 거래만 둡니다.

| 측정값 | 의미 | 계산 · 원천 |
| --- | --- | --- |
| `DEAL_AMT_NUM` | 거래금액 (원) | Silver `apt_trade.DEAL_AMT_NUM` (표준화 단계에서 만원 → 원) |
| `EXCL_AREA_NUM` | 전용면적 (㎡) | Silver 같은 컬럼 |
| `FLR_NUM` | 거래된 층 | Silver 같은 컬럼 |
| `BUILD_YEAR_NUM` | 건축년도 | Silver 같은 컬럼 |
| `UNIT_AMT` | ㎡당 매매가 (원/㎡). 면적이 다른 거래끼리 가격을 비교하는 기준 | `DEAL_AMT_NUM ÷ EXCL_AREA_NUM`. 면적이 0 이하이거나 금액이 없으면 NULL |

## 2. `fact_apt_trd_qtr`: 법정동 × 분기

| 측정값 | 의미 | 계산 · 원천 |
| --- | --- | --- |
| `TRADE_CNT` | 그 동에서 그 분기에 성사된 유효 매매 건수 | `fact_apt_trd` 행 수 (거래가 없으면 0) |
| `PRICE_SAMPLE_CNT` | 그중 ㎡당 가격을 계산할 수 있는 거래 수 | `UNIT_AMT`가 있는 행 수 |
| `UNIT_AMT_MEDIAN` | 그 동·분기의 대표 ㎡당 매매가 | `UNIT_AMT` 중앙값 (거래가 없으면 NULL) |
| `LOW_SAMPLE_YN` | 표본이 적어 중앙값을 믿기 어려움 표시 | `PRICE_SAMPLE_CNT` < 5. 값은 지우지 않고 보존 |

## 3. `fact_apt_idx_qtr`: 법정동 × 분기, 같은 단지 기준 가격 변화

`UNIT_AMT`와 단지 식별자 `APT_KEY`가 있는 거래로, 단지 × 분기마다 log(㎡당 가격)의 중앙값을 구한 뒤 같은 단지를 1분기 전 또는 4분기 전과 짝지어 비교합니다.

| 측정값 | 의미 | 계산 · 원천 |
| --- | --- | --- |
| `CPLX_RET_1Q` | 직전 분기 대비 같은 단지들의 가격 변화율 (로그). 어떤 단지가 팔렸는지에 따른 출렁임을 뺀 실제 가격 흐름 | 두 분기 모두 거래된 단지별 log 가격 차이를 두 분기 중 적은 쪽 거래 수로 가중 평균. 양쪽 분기 모두 짝지은 거래가 5건 이상일 때만 값이 있음 |
| `CPLX_RET_4Q` | 전년 동분기 대비 같은 단지 가격 변화율 | 같은 방식으로 4분기 전과 비교 |
| `SGG_CPLX_RET_1Q`, `SGG_CPLX_RET_4Q` | 그 동이 속한 자치구 전체의 같은 단지 가격 변화율 | 같은 계산을 자치구 단위로 |
| `SEOUL_CPLX_RET_1Q`, `SEOUL_CPLX_RET_4Q` | 서울 전체의 같은 단지 가격 변화율 | 같은 계산을 서울 단위로 |
| `MATCH_CPLX_CNT` | 직전 분기와 짝지은 단지 수. 변화율이 몇 개 단지에 근거했는지 | 1분기 비교의 짝 개수 |
| `MATCH_TRD_PREV_CNT` | 짝지은 단지들의 직전 분기 거래 수 | 짝지은 단지의 전 분기 거래 합 |
| `MATCH_TRD_CNT` | 짝지은 단지들의 이번 분기 거래 수 | 짝지은 단지의 이번 분기 거래 합 |
| `PRICE_IDX` | 동 가격 지수 (구간 시작 = 100). 시간에 따른 가격 수준의 흐름 | 100 × exp(`CPLX_RET_1Q` 누적합) |
| `IDX_SEG_NO` | 가격 지수가 끊기지 않고 이어지는 구간 번호. 변화율이 빠진 분기가 있으면 새 구간이 100부터 다시 시작 | 변화율이 연속된 구간마다 번호 |

AI Ready의 타깃 `TARGET_RET`은 이 표의 다음 분기 `CPLX_RET_1Q`입니다.

## 4. `fact_lcns_qtr`: 법정동 × 분기 × 업종

Silver 03 인허가 5종의 분석용 개업일 `ANLS_LCNS_DTM`, 분석용 폐업일 `ANLS_CLSBIZ_DTM`, 분석 업종 `ANLS_INDUTY_CD`, 폐업일 출처 `CLSBIZ_SRC_CD`를 씁니다. 범위 밖 업소(`OUT_SCOPE_YN`)는 빼고, 서울 밖 주소(`OUT_SEOUL_ADDR_YN`)는 동 집계에서만 뺍니다.

| 측정값 | 의미 | 계산 · 원천 |
| --- | --- | --- |
| `OPEN_CNT` | 그 분기에 새로 문을 연 업소 수 | 분기 안에 `ANLS_LCNS_DTM`이 있는 업소. 이상 인허가일(`ABNRM_LCNS_DTM_YN`)은 제외 |
| `CLOSE_CNT` | 그 분기에 문을 닫은 업소 수 | 분기 안에 `ANLS_CLSBIZ_DTM`이 있는 업소 |
| `PROXY_CLOSE_CNT` | 폐업 중 폐업일이 원천에 없어 최종수정일자로 대신한 건수. 폐업 수의 불확실한 부분 | `CLOSE_CNT` 중 `CLSBIZ_SRC_CD`가 `최종수정일자_…`인 업소 |
| `ACTIVE_CNT` | 분기 말 현재 영업 중인 업소 수 (상권 규모) | `ANLS_LCNS_DTM` ≤ 분기 말 < `ANLS_CLSBIZ_DTM`인 업소. 이상 인허가일도 포함 |
| `NET_CNT` | 순증 업소 수. 상권이 커졌는지 줄었는지 | `OPEN_CNT − CLOSE_CNT` |

## 5. `mart_ldong_infra_qtr`: 법정동 × 분기 한 행

대시보드에서 바로 쓰도록 매매 지표와 업종 지표를 한 행에 모은 테이블입니다.

| 측정값 | 의미 | 계산 · 원천 |
| --- | --- | --- |
| `TRADE_CNT`, `PRICE_SAMPLE_CNT`, `UNIT_AMT_MEDIAN`, `LOW_SAMPLE_YN` | 2번과 같음 | `fact_apt_trd_qtr`를 그대로 |
| `PROVISIONAL_YN` | 아직 신고가 덜 들어왔을 수 있는 잠정 분기 표시 | `dim_date` |
| `{업종}_OPEN_CNT` | 업종 묶음별 개업 수 | `fact_lcns_qtr.OPEN_CNT`를 업종 묶음으로 합침 |
| `{업종}_CLOSE_CNT` | 업종 묶음별 폐업 수 | `CLOSE_CNT`를 같은 방식으로 |
| `{업종}_ACTIVE_CNT` | 업종 묶음별 분기 말 영업 수 | `ACTIVE_CNT`를 같은 방식으로 |
| `{업종}_PROXY_CLOSE_CNT` | 업종 묶음별 대용 폐업일 건수 | `PROXY_CLOSE_CNT`를 같은 방식으로 |

`{업종}` 묶음은 다음과 같습니다. 마트에는 `NET_CNT` 열이 없습니다.

| 묶음 | 분석 업종 | 비고 |
| --- | --- | --- |
| `GENERAL_FOOD` | 일반음식점 | |
| `CAFE` | 카페 | |
| `REST_FOOD` | 휴게음식점 | |
| `CLINIC` | 의원, 치과의원, 한의원 | |
| `PHARMACY` | 약국 | |
| `BEAUTY` | 미용_헤어, 미용_피부, 미용_네일, 미용_메이크업, 미용_기타 | |
| `CONVENIENCE` | 편의점 | 참고 지표 (`REFERENCE_YN`) |
| (없음) | 기타 | 마트 열 없음, `fact_lcns_qtr`에만 있음 |
