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


LABEL = {"baseline": "기준선", "price": "집값만", "price_lcns": "집값+상권"}


def fmt(value, spec: str) -> str:
    return "" if pd.isna(value) else format(value, spec)


def year_label(fold: str) -> str:
    return "전체" if fold == "ALL" else f"{fold}년"


def conclusion_lines(metrics: pd.DataFrame, compare: pd.DataFrame) -> list[str]:
    """실행 결과 숫자로 결론 문장을 만든다 (재학습하면 문장도 같이 바뀐다)."""
    def get(fold, model, col):
        return metrics.loc[metrics["FOLD_YR"].eq(fold) & metrics["MODEL_NM"].eq(model), col].item()

    def pair(a, b):
        return compare[compare["MODEL_FROM"].eq(a) & compare["MODEL_TO"].eq(b)].iloc[0]

    def ci(row) -> str:
        return f"95% 신뢰구간 [{row['CI_LOW_PCTP']:+.3f}, {row['CI_HIGH_PCTP']:+.3f}]%p"

    base, price, lcns = (get("ALL", m, "MAPE_PCT") for m in ("baseline", "price", "price_lcns"))
    p, l = pair("baseline", "price"), pair("price", "price_lcns")
    lines = [
        f"1. **집값 모델은 기준선보다 정확하다.** 오차(MAPE)가 {base:.2f}% → {price:.2f}%로 "
        f"{get('ALL', 'price', 'VS_BASELINE_PCT'):.1f}% 줄었다 ({ci(p)}). "
        f"{p['FOLD_CNT']}개 연도 중 {p['IMPROVED_FOLD_CNT']}개 연도에서 기준선보다 나았다. "
        f"다음 분기에 오를지 내릴지는 {get('ALL', 'price', 'DIRECTION_PCT'):.0f}% 맞혔다.",
        f"2. **상권 데이터를 더해도 정확도는 그대로다.** 오차는 {price:.2f}% → {lcns:.2f}%다 ({ci(l)}). "
        f"{l['FOLD_CNT']}개 연도 중 {l['IMPROVED_FOLD_CNT']}개 연도에서만 나아졌다.",
    ]
    yearly = metrics[metrics["MODEL_NM"].eq("price") & metrics["FOLD_YR"].ne("ALL")]
    worse = yearly[yearly["VS_BASELINE_PCT"] < 0]
    if len(worse):
        w = worse.sort_values("VS_BASELINE_PCT").iloc[0]
        lines.append(
            f"3. **시장 방향이 바뀌는 해에는 틀릴 수 있다.** {w['FOLD_YR']}년에는 집값 모델의 오차가 "
            f"기준선보다 {-w['VS_BASELINE_PCT']:.1f}% 컸고, 방향 정확도는 {w['DIRECTION_PCT']:.0f}%였다. "
            f"기준선보다 나빴던 해: {', '.join(f'{y}년' for y in worse['FOLD_YR'])}.")
    return lines


def summary_lines(data, metrics, compare, iters, model_ver) -> list[str]:
    counts = data["SPLIT_NM"].value_counts()
    folds = [f for f in metrics["FOLD_YR"].unique()]

    wide = pd.DataFrame({"테스트 연도": [year_label(f) for f in folds]})
    for model_nm in MODELS:
        values = metrics[metrics["MODEL_NM"].eq(model_nm)].set_index("FOLD_YR")["MAPE_PCT"]
        wide[LABEL[model_nm]] = [fmt(values[f], ".2f") for f in folds]

    cmp = pd.DataFrame({
        "비교": [f"{LABEL[a]} → {LABEL[b]}" for a, b in zip(compare["MODEL_FROM"], compare["MODEL_TO"])],
        "오차 변화 (%p)": compare["MAPE_DIFF_PCTP"].map(lambda v: f"{v:+.3f}"),
        "95% 신뢰구간 (%p)": [f"[{lo:+.3f}, {hi:+.3f}]" for lo, hi in zip(compare["CI_LOW_PCTP"], compare["CI_HIGH_PCTP"])],
        "좋아진 연도": [f"{w} / {n}" for w, n in zip(compare["IMPROVED_FOLD_CNT"], compare["FOLD_CNT"])],
    })

    detail = pd.DataFrame({
        "테스트 연도": metrics["FOLD_YR"].map(year_label),
        "모델": metrics["MODEL_NM"].map(LABEL),
        "평가 행 수": metrics["ROW_CNT"].map(lambda v: f"{v:,}"),
        "오차 MAPE (%)": metrics["MAPE_PCT"].map(lambda v: fmt(v, ".2f")),
        "기준선 대비 오차 감소 (%)": metrics["VS_BASELINE_PCT"].map(lambda v: fmt(v, ".1f")),
        "방향 정확도 (%)": metrics["DIRECTION_PCT"].map(lambda v: fmt(v, ".1f")),
        "순위 상관": metrics["RANK_IC"].map(lambda v: fmt(v, ".3f")),
    })

    train_info = pd.DataFrame({
        "테스트 연도": iters["FOLD_YR"].map(lambda y: f"{y}년"),
        "모델": iters["MODEL_NM"].map(LABEL),
        "학습 행 수": iters["TRAIN_ROW_CNT"].map(lambda v: f"{v:,}"),
        "검증 행 수": iters["VALID_ROW_CNT"].map(lambda v: f"{v:,}"),
        "테스트 행 수": iters["TEST_ROW_CNT"].map(lambda v: f"{v:,}"),
        "학습 반복 횟수": iters["BEST_ITER"],
    })

    return [
        "# AI Ready 예측 정확도 요약", "",
        "> `pipeline/ai_ready/05_train.py`가 실행할 때마다 다시 만드는 파일입니다. 숫자와 결론 문장은 실행 결과에서 자동으로 채웁니다.", "",
        "## 결론", "", *conclusion_lines(metrics, compare), "",
        "## 무엇을 예측했나", "",
        "- **예측 대상:** 법정동별 **다음 분기** 아파트 ㎡당 매매가 변화율",
        "- **계산 방식:** 두 분기에 모두 거래된 **같은 단지끼리** 가격을 비교한다. "
        "그 분기에 비싼 단지가 팔렸는지 싼 단지가 팔렸는지에 따라 값이 출렁이는 영향을 빼기 위해서다.",
        "- **비교한 모델**",
        "  - 기준선: \"다음 분기에도 가격이 그대로다\"라고 예측한다. 다른 모델이 이걸 얼마나 이기는지 재는 자 역할이다.",
        "  - 집값만: 최근 가격 흐름(동·구·서울 변화율, 거래 수 등)으로 예측한다.",
        "  - 집값+상권: 집값 정보에 인허가 업소(음식점·카페·의원·약국·미용) 증감을 더해 예측한다.",
        f"- **데이터:** {data['LDONG_CD'].nunique()}개 법정동, 학습·평가 {counts.get('labeled', 0):,}행, "
        f"다음 분기 예측 {counts.get('predict', 0):,}행",
        "- **평가 방법 (롤링 검증):** 테스트할 해마다 그 전 해까지의 데이터로만 학습하고, 그 해를 맞혀 본다. "
        "실제로 쓸 때처럼 미래 데이터를 보지 않고, 시장 상황이 다른 여러 해에서 결과를 확인할 수 있다.", "",
        "## 지표 읽는 법", "",
        "- **오차 (MAPE):** 예측 가격이 실제 가격과 평균 몇 % 차이 나는지. 낮을수록 좋다.",
        "- **기준선 대비 오차 감소:** 기준선보다 오차를 몇 % 줄였는지. 음수면 기준선보다 못했다는 뜻이다.",
        "- **방향 정확도:** 다음 분기에 오를지 내릴지를 맞힌 비율. 50%면 동전 던지기와 같다.",
        "- **순위 상관:** 어느 동이 더 많이 오를지 순서를 얼마나 맞혔는지 (−1부터 1 사이, 0이면 무관).",
        "- **95% 신뢰구간:** 이 범위가 0을 포함하면 두 모델의 차이를 우연과 구분할 수 없다.", "",
        "## 연도별 오차 (MAPE, %)", "", *md_table(wide), "",
        "## 모델 비교 (전체 테스트 기간)", "", *md_table(cmp), "",
        "- 오차 변화가 음수면 오른쪽 모델이 더 정확하다.",
        "- 신뢰구간은 법정동 단위로 다시 뽑는 방식(부트스트랩)으로 계산했다.", "",
        "## 연도·모델별 상세", "", *md_table(detail), "",
        "## 참고: 회차별 학습 정보", "",
        "- 학습 반복 횟수는 검증 연도의 오차가 더 줄지 않을 때 멈춘 횟수다. "
        "1–10처럼 작으면 그해에는 모델이 평균에 가까운 예측만 했다는 뜻이다.",
        f"- 모델 버전 `{model_ver}`: 피처셋·파라미터·피처 정의가 같으면 같은 값이다.", "",
        *md_table(train_info), "",
    ]


if __name__ == "__main__":
    sys.exit(main())
