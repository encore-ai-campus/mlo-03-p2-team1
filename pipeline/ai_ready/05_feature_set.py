"""04 Gold → 05 AI Ready 피처셋.

한 행 = 법정동 × 분기 t. 타깃은 다음 분기(t+1)의 같은 단지 기준 로그 변화율(골드 CPLX_RET_1Q),
피처는 분기 t까지의 값만 쓴다. 피처 이름과 묶음은 metadata/rule_ai_ready_feature.csv가 기준이다.

사용법
  python pipeline/ai_ready/05_feature_set.py
  python pipeline/ai_ready/05_feature_set.py --gold-dir <골드 폴더> --out-dir <출력 폴더>   # 누수 검사용
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ai_ready.ai_ready_common import (  # noqa: E402
    AI_READY_DIR, BASE_COLS, FEATURE_CSV, GOLD_DIR, GOLD_INDUTY_CSV, GOLD_PRICE_CSV, KEY_COLS, PARAM_CSV,
    TARGET_COL, gold_file, input_rows, load_features, load_min_price_samples, load_params, out_file,
    output_row, update_manifest, write_parquet,
)
from common.paths import relative  # noqa: E402

KEY = ["LDONG_CD", "YQ"]
GOLD_TABLES = ["dim_region", "dim_date", "fact_apt_trd", "fact_apt_trd_qtr", "fact_apt_idx_qtr",
               "mart_ldong_infra_qtr"]
LICENSE_COUNTS = ["OPEN_CNT", "CLOSE_CNT", "ACTIVE_CNT"]


def lcns_groups() -> list[str]:
    rules = pd.read_csv(GOLD_INDUTY_CSV, dtype=str, keep_default_na=False)
    groups = rules.loc[rules["reference_yn"].eq("N") & rules["mart_group"].ne(""), "mart_group"]
    return list(dict.fromkeys(groups))


def read_gold(gold_dir: Path) -> dict[str, pd.DataFrame]:
    return {name: pd.read_parquet(gold_file(gold_dir, name)) for name in GOLD_TABLES}


def shift(frame: pd.DataFrame, column: str, lag: int) -> pd.Series:
    """법정동 안에서 lag 분기 전 값. 골드 분기 팩트는 법정동 × 분기 전체 격자라 행 이동 = 분기 이동."""
    return frame.groupby("LDONG_CD", sort=False)[column].shift(lag)


def build(gold: dict[str, pd.DataFrame], groups: list[str], min_samples: int) -> pd.DataFrame:
    regions = gold["dim_region"][["LDONG_CD", "SGG_CD"]]
    quarters = gold["dim_date"]["YQ"].sort_values().tolist()
    grid_size = len(regions) * len(quarters)

    base = gold["fact_apt_trd_qtr"].merge(gold["fact_apt_idx_qtr"], on=KEY, validate="1:1")
    lcns_cols = [f"{g}_{c}" for g in groups for c in LICENSE_COUNTS]
    base = base.merge(gold["mart_ldong_infra_qtr"][KEY + lcns_cols], on=KEY, validate="1:1")
    base = base.merge(regions, on="LDONG_CD", validate="m:1")
    if len(base) != grid_size:
        raise ValueError(f"골드 분기 팩트가 법정동 × 분기 전체 격자가 아닙니다: {len(base)} != {grid_size}")
    base = base.sort_values(KEY).reset_index(drop=True)
    sparse = base["LOW_SAMPLE_YN"] | base["PRICE_SAMPLE_CNT"].lt(min_samples)

    out = base[["LDONG_CD", "YQ"]].copy()
    period = pd.PeriodIndex(base["YQ"], freq="Q")
    out["TARGET_YQ"] = (period + 1).astype(str)

    # ── PRICE ──
    log_price = np.log(base["UNIT_AMT_MEDIAN"]).where(~sparse)
    base["_LP"] = log_price
    out["LOG_UNIT_AMT"] = log_price
    out["MED_RET_1Q"] = log_price - shift(base, "_LP", 1)
    out["MED_RET_4Q"] = log_price - shift(base, "_LP", 4)
    out["CPLX_RET_1Q"] = base["CPLX_RET_1Q"]
    out["CPLX_RET_4Q"] = base["CPLX_RET_4Q"]
    out["CPLX_RET_1Q_LAG1"] = shift(base, "CPLX_RET_1Q", 1)
    base["_LN"] = np.log1p(base["PRICE_SAMPLE_CNT"])
    out["LOG_TRADE_CNT"] = base["_LN"]
    out["TRADE_CNT_CHG_4Q"] = base["_LN"] - shift(base, "_LN", 4)
    out["QTR"] = period.quarter.astype("int64")

    trades = gold["fact_apt_trd"][["LDONG_CD", "YQ", "UNIT_AMT", "BUILD_YEAR_NUM", "EXCL_AREA_NUM"]]
    trades = trades.merge(regions, on="LDONG_CD", validate="m:1")
    trades = trades.assign(BUILD_AGE=trades["YQ"].str[:4].astype("int64") - trades["BUILD_YEAR_NUM"])
    composition = trades.groupby(KEY).agg(BUILD_AGE_MED=("BUILD_AGE", "median"),
                                          EXCL_AREA_MED=("EXCL_AREA_NUM", "median"))
    composition = composition.reindex(pd.MultiIndex.from_frame(base[KEY]))
    out["BUILD_AGE_MED"] = composition["BUILD_AGE_MED"].to_numpy()
    out["EXCL_AREA_MED"] = composition["EXCL_AREA_MED"].to_numpy()
    out.loc[sparse, ["BUILD_AGE_MED", "EXCL_AREA_MED"]] = np.nan
    sgg_median = trades.groupby(["SGG_CD", "YQ"])["UNIT_AMT"].median()
    sgg_log = np.log(sgg_median.reindex(pd.MultiIndex.from_frame(base[["SGG_CD", "YQ"]])).to_numpy())
    out["REL_SGG_LOG"] = log_price - sgg_log
    for column in ("SGG_CPLX_RET_1Q", "SGG_CPLX_RET_4Q", "SEOUL_CPLX_RET_1Q", "SEOUL_CPLX_RET_4Q"):
        out[column] = base[column]

    # ── LCNS ──
    for g in groups:
        active = base[f"{g}_ACTIVE_CNT"]
        base[f"_{g}_LOG"] = np.log1p(active)
        out[f"{g}_ACTIVE_LOG"] = base[f"_{g}_LOG"]
        out[f"{g}_ACTIVE_GR_1Q"] = base[f"_{g}_LOG"] - shift(base, f"_{g}_LOG", 1)
        out[f"{g}_ACTIVE_GR_4Q"] = base[f"_{g}_LOG"] - shift(base, f"_{g}_LOG", 4)
        rolling = base.groupby("LDONG_CD", sort=False)[[f"{g}_OPEN_CNT", f"{g}_CLOSE_CNT"]].rolling(4).sum()
        rolling = rolling.reset_index(level=0, drop=True).sort_index()
        out[f"{g}_OPEN_RATE_4Q"] = rolling[f"{g}_OPEN_CNT"] / (active + 1)
        out[f"{g}_CLOSE_RATE_4Q"] = rolling[f"{g}_CLOSE_CNT"] / (active + 1)
    base["_ALL_LOG"] = np.log1p(base[[f"{g}_ACTIVE_CNT" for g in groups]].sum(axis=1))
    out["ALL_ACTIVE_LOG"] = base["_ALL_LOG"]
    out["ALL_ACTIVE_GR_4Q"] = base["_ALL_LOG"] - shift(base, "_ALL_LOG", 4)

    # ── 타깃·기준값·분할 ──
    out[TARGET_COL] = shift(base, "CPLX_RET_1Q", -1)
    out["BASE_UNIT_AMT"] = base["UNIT_AMT_MEDIAN"].where(~sparse)
    out["BASE_PRICE_IDX"] = base["PRICE_IDX"]
    out["BASE_IDX_SEG_NO"] = base["IDX_SEG_NO"]
    last = quarters[-1]
    labeled = out[TARGET_COL].notna() & out["YQ"].ne(last)
    predict = out["YQ"].eq(last) & (out["BASE_UNIT_AMT"].notna() | out["BASE_PRICE_IDX"].notna())
    out["SPLIT_NM"] = np.where(labeled, "labeled", np.where(predict, "predict", ""))
    return out[out["SPLIT_NM"].ne("")].reset_index(drop=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--gold-dir", type=Path, default=GOLD_DIR)
    parser.add_argument("--out-dir", type=Path, default=AI_READY_DIR)
    args = parser.parse_args()
    default_run = args.gold_dir.resolve() == GOLD_DIR.resolve() and args.out_dir.resolve() == AI_READY_DIR.resolve()

    load_params()
    features = load_features()
    min_samples = load_min_price_samples()
    groups = lcns_groups()
    df = build(read_gold(args.gold_dir), groups, min_samples)

    expected = features["feature"].tolist()
    built = [c for c in df.columns if c not in KEY_COLS + [TARGET_COL] + BASE_COLS]
    if sorted(built) != sorted(expected):
        raise ValueError(f"피처 정의와 계산 결과가 다릅니다. 정의에만: {sorted(set(expected) - set(built))}, "
                         f"계산에만: {sorted(set(built) - set(expected))}")
    df = df[KEY_COLS + [TARGET_COL] + BASE_COLS + expected]
    df["QTR"] = df["QTR"].astype("int64")
    df["BASE_IDX_SEG_NO"] = df["BASE_IDX_SEG_NO"].astype("Int64")

    target = out_file(args.out_dir, "feature_set")
    status, sha = write_parquet(df, target)
    counts = df["SPLIT_NM"].value_counts().to_dict()
    print(f"feature_set: {len(df):,} rows ({counts}), {df['LDONG_CD'].nunique()} dongs, "
          f"{len(expected)} features ({status}) -> {target}")

    if default_run:
        inputs = {name: gold_file(args.gold_dir, name) for name in GOLD_TABLES}
        inputs.update({"rule_gold_apt_price": GOLD_PRICE_CSV, "rule_gold_induty": GOLD_INDUTY_CSV,
                       "rule_ai_ready_param": PARAM_CSV, "rule_ai_ready_feature": FEATURE_CSV})
        update_manifest("feature_set", input_rows("feature_set", inputs)
                        + [output_row("feature_set", "feature_set", target, df, status, sha)])
    return 0


if __name__ == "__main__":
    sys.exit(main())
