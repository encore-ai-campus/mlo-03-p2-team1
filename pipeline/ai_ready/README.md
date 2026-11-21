# pipeline/ai_ready

`data/gold` → `data/ai_ready`. 다음 분기 아파트 ㎡당 매매가 변화를 예측하는 피처셋과 모델 결과를 만든다. 작업 계획은 #33.

## 무엇을 예측하나
- **한 행 = 법정동 × 분기 t.**
- **타깃 `TARGET_RET`** = 분기 t → t+1의 **같은 단지 기준** 로그 변화율 (골드 `fact_apt_idx_qtr.CPLX_RET_1Q`의 t+1 값).
  두 분기에 모두 거래된 같은 단지끼리 가격을 비교하므로, 어떤 단지가 팔렸는지에 따라 동 중앙값이 출렁이는 영향이 빠진다.
- **피처**는 분기 t까지의 값만 쓴다. 이름과 묶음(`PRICE` / `LCNS`)은 `metadata/rule_ai_ready_feature.csv`가 기준이다.
- 비교 모델: `baseline`(변화율 0) / `price`(PRICE 묶음) / `price_lcns`(PRICE + LCNS).

## 실행
프로젝트 루트에서 실행한다. 패키지는 `python -m pip install -r pipeline/requirements.txt`.

```powershell
python pipeline/gold/04_gold.py
python pipeline/ai_ready/05_feature_set.py
```

`05_feature_set.py --gold-dir <폴더> --out-dir <폴더>`로 다른 골드를 읽어 다른 폴더에 쓸 수 있다(누수 검사용). 이때는 `report/`를 갱신하지 않는다.

## 기준
| 파일 | 내용 |
| --- | --- |
| `metadata/rule_gold_apt_price.csv` | `MIN_PRICE_SAMPLE_CNT` (골드와 같은 값을 그대로 읽는다) |
| `metadata/rule_gold_induty.csv` | 상권 업종 묶음 (`reference_yn = N`인 묶음만 사용) |
| `metadata/rule_ai_ready_param.csv` | 예측 기간, 롤링 검증 연도, 시드, LightGBM 설정, 기본 모델 |
| `metadata/rule_ai_ready_feature.csv` | 피처 이름, 묶음, 설명 |

## 출력: `data/ai_ready/05_ai_ready__feature_set.parquet`

| 컬럼 | 설명 |
| --- | --- |
| `LDONG_CD`, `YQ` | 키. 법정동, 분기 t |
| `TARGET_YQ` | 분기 t+1 |
| `SPLIT_NM` | `labeled`: 타깃이 있는 행 (학습·롤링 평가) / `predict`: 마지막 분기 행 (다음 분기 예측용, `TARGET_YQ`는 `dim_date` 밖) |
| `TARGET_RET` | 타깃. `predict` 행은 NULL |
| `BASE_UNIT_AMT` | 분기 t 동 ㎡당 매매가 중앙값(원/㎡). `LOW_SAMPLE_YN`이면 NULL. 예측 매매가 = 이 값 × exp(예측 변화율) |
| `BASE_PRICE_IDX`, `BASE_IDX_SEG_NO` | 분기 t 동 가격 지수와 지수 구간 번호. 예측 지수 = 이 값 × exp(예측 변화율) |
| 피처 43개 | `rule_ai_ready_feature.csv` 순서 |

- 저장하는 행은 `labeled`와 `predict`뿐이다. 타깃이 없는 과거 행은 저장하지 않는다.
- 같은 입력으로 다시 실행하면 `unchanged`.

## 학습·롤링 검증: `05_train.py`

```powershell
python pipeline/ai_ready/05_train.py
```

- 테스트 연도 Y(2021–2026)마다 학습은 `TARGET_YQ`가 Y−2년 이하, early stopping 검증은 Y−1년, 테스트는 Y년.
- 최종 예측은 labeled 전체로 다시 학습해 `predict` 행을 예측한다. 반복 횟수는 마지막 회차의 best iteration.
- MAPE는 같은 단지 기준 가격 오차: `|exp(PRED_RET − ACTUAL_RET) − 1|`의 평균.

### 출력: `data/ai_ready/05_ai_ready__prediction.parquet`
키는 `LDONG_CD`, `YQ`, `MODEL_NM`.

| 컬럼 | 설명 |
| --- | --- |
| `YQ` | 예측 대상 분기 (t+1) |
| `BASE_YQ` | 예측에 쓴 마지막 분기 (t) |
| `MODEL_NM` | `baseline` / `price` / `price_lcns` |
| `MODEL_VER` | 피처셋·파라미터·피처 정의 해시 앞 12자리 |
| `FOLD_YR` | 롤링 검증 테스트 연도. 최종 예측 행은 NULL |
| `PRED_RET` | 예측 로그 변화율 |
| `ACTUAL_RET` | 실제 로그 변화율. 최종 예측 행은 NULL |
| `PRED_IDX` | `BASE_PRICE_IDX × exp(PRED_RET)`. 같은 지수 구간에서만 의미가 있다 |
| `PRED_UNIT_AMT` | `BASE_UNIT_AMT × exp(PRED_RET)`. 분기 t가 희소하면 NULL |

## 기록: `report/ai_ready/`
| 파일 | 내용 |
| --- | --- |
| `05_ai_ready__manifest.csv` | 단계(`step`)별 입력·출력 경로, 행 수, SHA-256, 상태 |
| `05_ai_ready__rolling_cv.csv` | 연도(`ALL` 포함) × 모델별 MAPE, 기준선 대비 감소율, 방향 정확도, 순위 상관 |
| `05_ai_ready__model_compare.csv` | baseline → price, price → price_lcns의 MAPE 차이와 법정동 부트스트랩 95% CI, 개선 연도 수 |
| `05_ai_ready__fold_iter.csv` | 회차·모델별 학습·검증·테스트 행 수와 best iteration |
| `05_ai_ready__summary.md` | 위 결과 요약 |
