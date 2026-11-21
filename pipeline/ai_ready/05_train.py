"""05 AI Ready 피처셋 → 롤링 검증과 다음 분기 예측.

- 모델: baseline(변화율 0) / price(PRICE 묶음) / price_lcns(PRICE + LCNS). LightGBM, 설정은 metadata/rule_ai_ready_param.csv.
- 롤링 검증: 테스트 연도 Y마다 학습은 TARGET_YQ가 Y-2년 이하, early stopping 검증은 Y-1년, 테스트는 Y년.
- 최종 예측: labeled 전체로 다시 학습해 predict 행(마지막 분기 t → t+1)을 예측한다.
  반복 횟수는 마지막 롤링 회차의 best iteration을 쓴다 (따로 남겨 둘 검증 구간이 없으므로).

사용법
  python pipeline/ai_ready/05_train.py
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ai_ready.ai_ready_common import (  # noqa: E402
    AI_READY_DIR, FEATURE_CSV, MODELS, PARAM_CSV, TARGET_COL, input_rows, load_features, load_params,
    model_features, out_file, output_row, report_file, update_manifest, write_parquet, write_text_if_changed,
)
from common.files import sha256_file  # noqa: E402
from common.report import md_table, write_csv, write_markdown  # noqa: E402

ROUND = 6


def lgb_params(params: dict[str, str]) -> dict:
    return {
        "objective": "l2", "verbose": -1, "deterministic": True, "force_col_wise": True, "num_threads": 1,
        "seed": int(params["SEED"]),
        "learning_rate": float(params["LGB_LEARNING_RATE"]),
        "num_leaves": int(params["LGB_NUM_LEAVES"]),
        "min_data_in_leaf": int(params["LGB_MIN_DATA_IN_LEAF"]),
        "feature_fraction": float(params["LGB_FEATURE_FRACTION"]),
        "bagging_fraction": float(params["LGB_BAGGING_FRACTION"]),
        "bagging_freq": int(params["LGB_BAGGING_FREQ"]),
        "lambda_l2": float(params["LGB_LAMBDA_L2"]),
    }


def fit_early_stop(train, valid, cols, params, cfg):
    model = lgb.train(
        cfg, lgb.Dataset(train[cols], train[TARGET_COL]), int(params["LGB_MAX_ROUNDS"]),
        valid_sets=[lgb.Dataset(valid[cols], valid[TARGET_COL])],
        callbacks=[lgb.early_stopping(int(params["LGB_EARLY_STOPPING"]), verbose=False)],
    )
    return model, model.best_iteration


def ape(actual, pred):
    """같은 단지 기준 가격의 절대 백분율 오차: |exp(pred - actual) - 1|."""
    return np.abs(np.exp(pred - actual) - 1)


def fold_metrics(frame: pd.DataFrame, base_mape: float) -> dict:
    err = ape(frame["ACTUAL_RET"], frame["PRED_RET"])
    mape = err.mean() * 100
    moving = frame["ACTUAL_RET"].ne(0)
    if frame["MODEL_NM"].iloc[0] == "baseline":
        direction, rank_ic = np.nan, np.nan
    else:
        direction = (np.sign(frame.loc[moving, "PRED_RET"]) == np.sign(frame.loc[moving, "ACTUAL_RET"])).mean() * 100
        rank_ic = np.mean([q["PRED_RET"].rank().corr(q["ACTUAL_RET"].rank())
                           for _, q in frame.groupby("YQ") if len(q) > 2])
    return {"ROW_CNT": len(frame), "MAPE_PCT": mape, "VS_BASELINE_PCT": (base_mape - mape) / base_mape * 100,
            "DIRECTION_PCT": direction, "RANK_IC": rank_ic}


def bootstrap_diff(tests: pd.DataFrame, model_a: str, model_b: str, n: int, seed: int) -> tuple[float, float, float]:
    """MAPE(model_b) - MAPE(model_a), %p. 법정동 단위로 다시 뽑아 95% CI를 구한다."""
    err = {m: ape(tests.loc[tests["MODEL_NM"].eq(m), "ACTUAL_RET"].to_numpy(),
                  tests.loc[tests["MODEL_NM"].eq(m), "PRED_RET"].to_numpy()) for m in (model_a, model_b)}
    dong = tests.loc[tests["MODEL_NM"].eq(model_a), "LDONG_CD"].to_numpy()
    per = pd.DataFrame({"LDONG_CD": dong, "A": err[model_a], "B": err[model_b]}).groupby("LDONG_CD").agg(
        A=("A", "sum"), B=("B", "sum"), N=("A", "size"))
    a, b, cnt = per["A"].to_numpy(), per["B"].to_numpy(), per["N"].to_numpy()
    rng = np.random.default_rng(seed)
    diffs = np.empty(n)
    for i in range(n):
        pick = rng.integers(0, len(per), len(per))
        diffs[i] = (b[pick].sum() - a[pick].sum()) / cnt[pick].sum() * 100
    point = (b.sum() - a.sum()) / cnt.sum() * 100
    low, high = np.percentile(diffs, [2.5, 97.5])
    return point, low, high


def to_prediction(rows: pd.DataFrame, model_nm: str, pred: np.ndarray, fold_yr, model_ver: str) -> pd.DataFrame:
    return pd.DataFrame({
        "LDONG_CD": rows["LDONG_CD"].to_numpy(),
        "YQ": rows["TARGET_YQ"].to_numpy(),
        "BASE_YQ": rows["YQ"].to_numpy(),
        "MODEL_NM": model_nm,
        "MODEL_VER": model_ver,
        "FOLD_YR": pd.array([fold_yr] * len(rows), dtype="Int64"),
        "PRED_RET": pred,
        "ACTUAL_RET": rows[TARGET_COL].to_numpy(),
        "PRED_IDX": rows["BASE_PRICE_IDX"].to_numpy() * np.exp(pred),
        "PRED_UNIT_AMT": rows["BASE_UNIT_AMT"].to_numpy() * np.exp(pred),
    })


def main() -> int:
    params = load_params()
    features = load_features()
    cfg = lgb_params(params)
    feature_path = out_file(AI_READY_DIR, "feature_set")
    data = pd.read_parquet(feature_path)
    labeled = data[data["SPLIT_NM"].eq("labeled")].copy()
    predict = data[data["SPLIT_NM"].eq("predict")].copy()
    labeled["TARGET_YR"] = labeled["TARGET_YQ"].str[:4].astype(int)
    years = range(int(params["CV_TEST_YR_FROM"]), int(params["CV_TEST_YR_TO"]) + 1)
    model_ver = hashlib.sha256("".join(sha256_file(p) for p in (feature_path, PARAM_CSV, FEATURE_CSV))
                               .encode()).hexdigest()[:12]

    parts, iterations = [], []
    for year in years:
        train = labeled[labeled["TARGET_YR"].le(year - 2)]
        valid = labeled[labeled["TARGET_YR"].eq(year - 1)]
        test = labeled[labeled["TARGET_YR"].eq(year)]
        parts.append(to_prediction(test, "baseline", np.zeros(len(test)), year, model_ver))
        for model_nm in ("price", "price_lcns"):
            cols = model_features(features, model_nm)
            model, best = fit_early_stop(train, valid, cols, params, cfg)
            parts.append(to_prediction(test, model_nm, model.predict(test[cols], num_iteration=best), year, model_ver))
            iterations.append({"FOLD_YR": year, "MODEL_NM": model_nm, "TRAIN_ROW_CNT": len(train),
                               "VALID_ROW_CNT": len(valid), "TEST_ROW_CNT": len(test), "BEST_ITER": best})
    iters = pd.DataFrame(iterations)

    # 최종 예측: labeled 전체로 학습, 반복 횟수 = 마지막 회차 best iteration
    parts.append(to_prediction(predict, "baseline", np.zeros(len(predict)), pd.NA, model_ver))
    for model_nm in ("price", "price_lcns"):
        cols = model_features(features, model_nm)
        rounds = int(iters.loc[iters["MODEL_NM"].eq(model_nm), "BEST_ITER"].iloc[-1])
        model = lgb.train(cfg, lgb.Dataset(labeled[cols], labeled[TARGET_COL]), max(rounds, 1))
        parts.append(to_prediction(predict, model_nm, model.predict(predict[cols]), pd.NA, model_ver))

    prediction = pd.concat(parts, ignore_index=True)
    order = {m: i for i, m in enumerate(MODELS)}
    prediction = prediction.sort_values(["MODEL_NM", "YQ", "LDONG_CD"], key=lambda s: s.map(order)
                                        if s.name == "MODEL_NM" else s).reset_index(drop=True)
    for column in ("PRED_RET", "PRED_IDX", "PRED_UNIT_AMT"):
        prediction[column] = prediction[column].astype("float64")

    # ── 지표 ──
    tests = prediction[prediction["FOLD_YR"].notna()]
    metric_rows = []
    for fold, group in [*((y, tests[tests["FOLD_YR"].eq(y)]) for y in years), ("ALL", tests)]:
        base_mape = ape(group.loc[group["MODEL_NM"].eq("baseline"), "ACTUAL_RET"],
                        group.loc[group["MODEL_NM"].eq("baseline"), "PRED_RET"]).mean() * 100
        for model_nm in MODELS:
            metric_rows.append({"FOLD_YR": str(fold), "MODEL_NM": model_nm,
                                **fold_metrics(group[group["MODEL_NM"].eq(model_nm)], base_mape)})
    metrics = pd.DataFrame(metric_rows)
    seed, n_boot = int(params["SEED"]), int(params["BOOTSTRAP_N"])
    compare = []
    for a, b in (("baseline", "price"), ("price", "price_lcns")):
        point, low, high = bootstrap_diff(tests, a, b, n_boot, seed)
        wins = sum(metrics.loc[metrics["FOLD_YR"].eq(str(y)) & metrics["MODEL_NM"].eq(b), "MAPE_PCT"].item()
                   < metrics.loc[metrics["FOLD_YR"].eq(str(y)) & metrics["MODEL_NM"].eq(a), "MAPE_PCT"].item()
                   for y in years)
        compare.append({"MODEL_FROM": a, "MODEL_TO": b, "MAPE_DIFF_PCTP": point, "CI_LOW_PCTP": low,
                        "CI_HIGH_PCTP": high, "IMPROVED_FOLD_CNT": wins, "FOLD_CNT": len(years)})
    compare = pd.DataFrame(compare)
    metrics = metrics.round(ROUND)
    compare = compare.round(ROUND)

    # ── 저장 ──
    pred_path = out_file(AI_READY_DIR, "prediction")
    status, sha = write_parquet(prediction, pred_path)
    cv_path, cmp_path, iter_path = report_file("rolling_cv"), report_file("model_compare"), report_file("fold_iter")
    for path, frame in ((cv_path, metrics), (cmp_path, compare), (iter_path, iters)):
        write_text_if_changed(path, lambda temp, f=frame: write_csv(temp, f))
    write_text_if_changed(report_file("summary", "md"),
                          lambda temp: write_markdown(temp, summary_lines(data, metrics, compare, iters, model_ver)))
    update_manifest("train", input_rows("train", {"feature_set": feature_path, "rule_ai_ready_param": PARAM_CSV,
                                                  "rule_ai_ready_feature": FEATURE_CSV})
                    + [output_row("train", "prediction", pred_path, prediction, status, sha)])

    print(f"prediction: {len(prediction):,} rows ({status}), MODEL_VER {model_ver}")
    print(metrics[metrics["FOLD_YR"].eq("ALL")].to_string(index=False))
    print(compare.to_string(index=False))
    return 0


def summary_lines(data, metrics, compare, iters, model_ver) -> list[str]:
    show = metrics.copy()
    show["MAPE_PCT"] = show["MAPE_PCT"].map(lambda v: f"{v:.2f}")
    show["VS_BASELINE_PCT"] = show["VS_BASELINE_PCT"].map(lambda v: f"{v:.1f}")
    show["DIRECTION_PCT"] = show["DIRECTION_PCT"].map(lambda v: "" if pd.isna(v) else f"{v:.1f}")
    show["RANK_IC"] = show["RANK_IC"].map(lambda v: "" if pd.isna(v) else f"{v:.3f}")
    wide = show.pivot(index="FOLD_YR", columns="MODEL_NM", values="MAPE_PCT")[list(MODELS)].reset_index()
    cmp = compare.copy()
    for c in ("MAPE_DIFF_PCTP", "CI_LOW_PCTP", "CI_HIGH_PCTP"):
        cmp[c] = cmp[c].map(lambda v: f"{v:+.3f}")
    counts = data["SPLIT_NM"].value_counts()
    return [
        "# 05 AI Ready 학습·롤링 검증 요약", "",
        f"- 피처셋: labeled {counts.get('labeled', 0):,}행, predict {counts.get('predict', 0):,}행, "
        f"{data['LDONG_CD'].nunique()}개 법정동",
        f"- 타깃: 다음 분기 같은 단지 기준 로그 변화율 (골드 `CPLX_RET_1Q`). MAPE는 같은 단지 기준 가격 오차",
        f"- 모델 버전: `{model_ver}` (피처셋·파라미터·피처 정의 해시)", "",
        "## 연도별 MAPE (%)", "", *md_table(wide), "",
        "## 모델 비교 (전체 테스트 행, 법정동 부트스트랩 95% CI)", "", *md_table(cmp), "",
        "- `MAPE_DIFF_PCTP` = MAPE(MODEL_TO) − MAPE(MODEL_FROM). 음수면 MODEL_TO가 더 정확하다.",
        "- `IMPROVED_FOLD_CNT` = 연도별로 MODEL_TO의 MAPE가 더 낮았던 횟수.", "",
        "## 연도·모델별 지표", "", *md_table(show), "",
        "## 회차별 학습 행 수와 반복 횟수", "", *md_table(iters), "",
    ]


if __name__ == "__main__":
    sys.exit(main())
