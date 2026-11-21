"""05 AI Ready 산출물 검증. 구현 코드(pipeline/ai_ready)를 import하지 않고 골드에서 따로 계산해 대조한다.

검사
  AR1 구조: 키 유일성, 골드 차원 연결, TARGET_YQ = 다음 분기, 컬럼 = 피처 정의
  AR2 타깃: fact_apt_trd에서 같은 단지 기준 변화율을 직접 계산해 TARGET_RET와 대조
  AR3 시점 누수: 골드를 분기 t까지 자른 복사본으로 피처셋 스크립트를 다시 실행해 t 행 값이 같은지
  AR4 분할: 회차별 학습·검증·테스트 행 수와 테스트 연도
  AR5 예측: baseline = 0, ACTUAL_RET = TARGET_RET, PRED_UNIT_AMT·PRED_IDX 공식, 최종 예측 행
  AR6 성능 수치: 예측 결과에서 다시 계산한 MAPE = rolling_cv

사용법
  python pipeline/validation/check_ai_ready.py
  (결과: report/ai_ready/05_ai_ready__check.csv, 실패가 있으면 종료 코드 1)
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.files import replace_if_changed  # noqa: E402
from common.paths import DATA_DIR, METADATA_DIR, PROJECT_ROOT, REPORT_DIR  # noqa: E402
from common.report import write_csv  # noqa: E402

GOLD = DATA_DIR / "gold"
AI = DATA_DIR / "ai_ready"
FEATURE_SET = AI / "05_ai_ready__feature_set.parquet"
PREDICTION = AI / "05_ai_ready__prediction.parquet"
ROLLING_CV = REPORT_DIR / "ai_ready" / "05_ai_ready__rolling_cv.csv"
FOLD_ITER = REPORT_DIR / "ai_ready" / "05_ai_ready__fold_iter.csv"
CHECK_OUT = REPORT_DIR / "ai_ready" / "05_ai_ready__check.csv"
FEATURE_SCRIPT = PROJECT_ROOT / "pipeline" / "ai_ready" / "05_feature_set.py"
FIXED_COLS = ["LDONG_CD", "YQ", "TARGET_YQ", "SPLIT_NM", "TARGET_RET", "BASE_UNIT_AMT", "BASE_PRICE_IDX",
              "BASE_IDX_SEG_NO"]
MODEL_NMS = {"baseline", "price", "price_lcns"}
LEAK_CUTOFFS = ["2019Q4", "2021Q2", "2023Q4", "2025Q3"]
TRUNCATE_TABLES = ["dim_date", "fact_apt_trd", "fact_apt_trd_qtr", "fact_apt_idx_qtr", "mart_ldong_infra_qtr"]
TOL = 1e-9

results: list[dict] = []


def record(check_id: str, item: str, target: int, fail: int, note: str = "") -> None:
    results.append({"check_id": check_id, "item": item, "target_cnt": int(target), "fail_cnt": int(fail),
                    "result": "PASS" if fail == 0 else "FAIL", "note": note})


def gold(name: str) -> pd.DataFrame:
    return pd.read_parquet(GOLD / f"04_gold__{name}.parquet")


def min_samples() -> int:
    rules = pd.read_csv(METADATA_DIR / "rule_gold_apt_price.csv", dtype=str, keep_default_na=False)
    return int(rules.loc[rules["param"].eq("MIN_PRICE_SAMPLE_CNT"), "value"].item())


def mismatch(a: pd.Series, b: pd.Series, rel: bool = False) -> int:
    """NULL 위치가 다르거나 값 차이가 허용 오차를 넘는 건수."""
    a, b = a.astype("float64").to_numpy(), b.astype("float64").to_numpy()
    null_diff = np.isnan(a) != np.isnan(b)
    both = ~np.isnan(a) & ~np.isnan(b)
    scale = np.maximum(np.abs(b[both]), 1.0) if rel else 1.0
    value_diff = np.abs(a[both] - b[both]) > TOL * scale
    return int(null_diff.sum() + value_diff.sum())


# ── AR1 구조 ──
def check_structure(fs: pd.DataFrame, pred: pd.DataFrame, features: list[str]) -> None:
    regions = set(gold("dim_region")["LDONG_CD"])
    quarters = set(gold("dim_date")["YQ"])
    record("AR1", "feature_set 키(LDONG_CD, YQ) 중복", len(fs), fs.duplicated(["LDONG_CD", "YQ"]).sum())
    record("AR1", "feature_set LDONG_CD가 dim_region에 있음", len(fs), (~fs["LDONG_CD"].isin(regions)).sum())
    record("AR1", "feature_set YQ가 dim_date에 있음", len(fs), (~fs["YQ"].isin(quarters)).sum())
    labeled = fs[fs["SPLIT_NM"].eq("labeled")]
    record("AR1", "labeled TARGET_YQ가 dim_date에 있음", len(labeled), (~labeled["TARGET_YQ"].isin(quarters)).sum())
    nxt = (pd.PeriodIndex(fs["YQ"], freq="Q") + 1).astype(str)
    record("AR1", "TARGET_YQ = YQ의 다음 분기", len(fs), (fs["TARGET_YQ"].to_numpy() != np.asarray(nxt)).sum())
    record("AR1", "SPLIT_NM은 labeled / predict", len(fs), (~fs["SPLIT_NM"].isin(["labeled", "predict"])).sum())
    expected = FIXED_COLS + features
    record("AR1", "feature_set 컬럼 = 고정 컬럼 + 피처 정의", len(expected),
           len(set(expected) ^ set(fs.columns)), "rule_ai_ready_feature.csv 순서 기준")
    record("AR1", "prediction 키(LDONG_CD, YQ, MODEL_NM) 중복", len(pred),
           pred.duplicated(["LDONG_CD", "YQ", "MODEL_NM"]).sum())
    record("AR1", "prediction MODEL_NM 3종", 3, len(set(pred["MODEL_NM"]) ^ MODEL_NMS))


# ── AR2 타깃 독립 계산 ──
def same_complex_1q(n_min: int) -> pd.Series:
    """법정동별 분기 t-1 → t 같은 단지 기준 로그 변화율. 인덱스 (LDONG_CD, YQ)."""
    t = gold("fact_apt_trd")[["LDONG_CD", "YQ", "APT_KEY", "UNIT_AMT"]]
    t = t[t["UNIT_AMT"].gt(0) & np.isfinite(t["UNIT_AMT"]) & t["APT_KEY"].fillna("").ne("")].copy()
    t["Q"] = pd.PeriodIndex(t["YQ"], freq="Q")
    t["LP"] = np.log(t["UNIT_AMT"])
    per = t.groupby(["LDONG_CD", "APT_KEY", "Q"])["LP"].agg(["size", "median"]).reset_index()
    prev = per.copy()
    prev["Q"] = prev["Q"] + 1
    pair = per.merge(prev, on=["LDONG_CD", "APT_KEY", "Q"], suffixes=("", "_p"))
    pair["w"] = np.minimum(pair["size"], pair["size_p"])
    pair["wd"] = pair["w"] * (pair["median"] - pair["median_p"])
    dong = pair.groupby(["LDONG_CD", "Q"]).agg(wd=("wd", "sum"), w=("w", "sum"), n=("size", "sum"), n_p=("size_p", "sum"))
    ok = dong["n"].ge(n_min) & dong["n_p"].ge(n_min)
    ret = (dong["wd"] / dong["w"])[ok]
    ret.index = pd.MultiIndex.from_arrays([ret.index.get_level_values(0),
                                           ret.index.get_level_values(1).astype(str)], names=["LDONG_CD", "YQ"])
    return ret


def check_target(fs: pd.DataFrame) -> None:
    ret = same_complex_1q(min_samples())
    labeled = fs[fs["SPLIT_NM"].eq("labeled")]
    own = ret.reindex(pd.MultiIndex.from_frame(labeled[["LDONG_CD", "TARGET_YQ"]])).to_numpy()
    record("AR2", "TARGET_RET = 직접 계산한 다음 분기 같은 단지 변화율", len(labeled),
           mismatch(labeled["TARGET_RET"], pd.Series(own)))
    last = gold("dim_date")["YQ"].max()
    have = ret.reset_index()
    have["BASE_YQ"] = (pd.PeriodIndex(have["YQ"], freq="Q") - 1).astype(str)
    have = have[have["BASE_YQ"].isin(set(gold("dim_date")["YQ"])) & have["BASE_YQ"].ne(last)]
    keys = set(zip(labeled["LDONG_CD"], labeled["YQ"]))
    missing = sum((d, q) not in keys for d, q in zip(have["LDONG_CD"], have["BASE_YQ"]))
    record("AR2", "직접 계산한 타깃이 있는 행은 모두 labeled", len(have), missing)


# ── AR3 시점 누수 ──
def check_leakage(fs: pd.DataFrame, features: list[str]) -> None:
    for cutoff in LEAK_CUTOFFS:
        with tempfile.TemporaryDirectory(prefix="ai_ready_leak_") as tmp:
            tmp = Path(tmp)
            gold_dir, out_dir = tmp / "gold", tmp / "out"
            gold_dir.mkdir()
            for path in GOLD.glob("04_gold__*.parquet"):
                frame = pd.read_parquet(path)
                name = path.stem.removeprefix("04_gold__")
                if name in TRUNCATE_TABLES:
                    frame = frame[frame["YQ"].le(cutoff)]
                frame.to_parquet(gold_dir / path.name, index=False)
            run = subprocess.run([sys.executable, str(FEATURE_SCRIPT), "--gold-dir", str(gold_dir),
                                  "--out-dir", str(out_dir)], capture_output=True, text=True, cwd=PROJECT_ROOT)
            if run.returncode != 0:
                record("AR3", f"{cutoff} 잘린 골드로 피처셋 재실행", 1, 1, run.stderr.strip().splitlines()[-1][:200])
                continue
            cut = pd.read_parquet(out_dir / "05_ai_ready__feature_set.parquet")
        full = fs[fs["YQ"].eq(cutoff)].set_index("LDONG_CD")
        part = cut[cut["YQ"].eq(cutoff)].set_index("LDONG_CD")
        common = full.index.intersection(part.index)
        cols = features + ["BASE_UNIT_AMT", "BASE_PRICE_IDX"]
        fails = sum(mismatch(full.loc[common, c], part.loc[common, c], rel=True) for c in cols)
        record("AR3", f"{cutoff} 행 피처 = 분기 {cutoff}까지 자른 골드로 만든 값", len(common) * len(cols), fails,
               f"비교 법정동 {len(common)}개")


# ── AR4 분할 ──
def check_split(fs: pd.DataFrame, pred: pd.DataFrame) -> None:
    labeled = fs[fs["SPLIT_NM"].eq("labeled")]
    year = labeled["TARGET_YQ"].str[:4].astype(int)
    iters = pd.read_csv(FOLD_ITER)
    fails = 0
    for row in iters.itertuples():
        y = row.FOLD_YR
        fails += int(row.TRAIN_ROW_CNT != year.le(y - 2).sum())
        fails += int(row.VALID_ROW_CNT != year.eq(y - 1).sum())
        fails += int(row.TEST_ROW_CNT != year.eq(y).sum())
    record("AR4", "회차별 학습(≤Y-2)·검증(Y-1)·테스트(Y) 행 수", len(iters) * 3, fails)
    test = pred[pred["FOLD_YR"].notna()]
    record("AR4", "테스트 행의 대상 분기 연도 = FOLD_YR", len(test),
           (test["YQ"].str[:4].astype(int) != test["FOLD_YR"].astype(int)).sum())


# ── AR5 예측 ──
def check_prediction(fs: pd.DataFrame, pred: pd.DataFrame) -> None:
    base = pred[pred["MODEL_NM"].eq("baseline")]
    record("AR5", "baseline PRED_RET = 0", len(base), base["PRED_RET"].ne(0).sum())
    ref = fs.set_index(["LDONG_CD", "YQ"])
    key = pd.MultiIndex.from_frame(pred[["LDONG_CD", "BASE_YQ"]].rename(columns={"BASE_YQ": "YQ"}))
    joined = ref.reindex(key)
    record("AR5", "예측 행의 (LDONG_CD, BASE_YQ)가 피처셋에 있음", len(pred), joined["SPLIT_NM"].isna().sum())
    test = pred["FOLD_YR"].notna().to_numpy()
    record("AR5", "테스트 행 ACTUAL_RET = TARGET_RET", int(test.sum()),
           mismatch(pred.loc[test, "ACTUAL_RET"].reset_index(drop=True),
                    joined.loc[test, "TARGET_RET"].reset_index(drop=True)))
    record("AR5", "PRED_UNIT_AMT = BASE_UNIT_AMT × exp(PRED_RET)", len(pred),
           mismatch(pred["PRED_UNIT_AMT"], pd.Series(joined["BASE_UNIT_AMT"].to_numpy() * np.exp(pred["PRED_RET"])), True))
    record("AR5", "PRED_IDX = BASE_PRICE_IDX × exp(PRED_RET)", len(pred),
           mismatch(pred["PRED_IDX"], pd.Series(joined["BASE_PRICE_IDX"].to_numpy() * np.exp(pred["PRED_RET"])), True))
    final = pred[pred["FOLD_YR"].isna()]
    last = fs["YQ"].max()
    record("AR5", "최종 예측 행: BASE_YQ = 마지막 분기, ACTUAL_RET = NULL", len(final),
           (final["BASE_YQ"].ne(last) | final["ACTUAL_RET"].notna()).sum())
    record("AR5", "최종 예측 행 수 = predict 행 수 × 모델 3종", len(final),
           abs(len(final) - fs["SPLIT_NM"].eq("predict").sum() * 3))


# ── AR6 성능 수치 ──
def check_metrics(pred: pd.DataFrame) -> None:
    cv = pd.read_csv(ROLLING_CV, dtype={"FOLD_YR": str})
    test = pred[pred["FOLD_YR"].notna()].copy()
    test["APE"] = np.abs(np.exp(test["PRED_RET"] - test["ACTUAL_RET"]) - 1)
    fails = 0
    for row in cv.itertuples():
        part = test if row.FOLD_YR == "ALL" else test[test["FOLD_YR"].astype(int).eq(int(row.FOLD_YR))]
        part = part[part["MODEL_NM"].eq(row.MODEL_NM)]
        fails += int(abs(part["APE"].mean() * 100 - row.MAPE_PCT) > 1e-5 or len(part) != row.ROW_CNT)
    record("AR6", "rolling_cv MAPE·행 수 = 예측 결과에서 다시 계산한 값", len(cv), fails)


def main() -> int:
    features = pd.read_csv(METADATA_DIR / "rule_ai_ready_feature.csv", dtype=str, keep_default_na=False)["feature"].tolist()
    fs = pd.read_parquet(FEATURE_SET)
    pred = pd.read_parquet(PREDICTION)
    check_structure(fs, pred, features)
    check_target(fs)
    check_leakage(fs, features)
    check_split(fs, pred)
    check_prediction(fs, pred)
    check_metrics(pred)

    out = pd.DataFrame(results)
    CHECK_OUT.parent.mkdir(parents=True, exist_ok=True)
    temp = CHECK_OUT.with_name(f".{CHECK_OUT.name}.tmp")
    write_csv(temp, out)
    status, _ = replace_if_changed(temp, CHECK_OUT)
    print(out.to_string(index=False))
    failed = out["result"].eq("FAIL").sum()
    print(f"\n{len(out)}개 검사, 실패 {failed}개 -> {CHECK_OUT.relative_to(PROJECT_ROOT).as_posix()} ({status})")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
