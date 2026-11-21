"""유효 거래가 양쪽 분기에 관측된 같은 단지의 ㎡당 가격 변화를 계산한다."""

from __future__ import annotations

import numpy as np
import pandas as pd

from common.paths import METADATA_DIR

DONG = "LDONG_CD"
GU = "SGG_CD"
QTR = "YQ"
PERIOD = "QUARTER_ORDINAL"
MATCH_COUNTS = ["MATCH_CPLX_CNT", "MATCH_TRD_PREV_CNT", "MATCH_TRD_CNT"]


def load_min_price_samples() -> int:
    rules = pd.read_csv(METADATA_DIR / "rule_gold_apt_price.csv", dtype=str, keep_default_na=False)
    value = int(rules.loc[rules["param"].eq("MIN_PRICE_SAMPLE_CNT"), "value"].item())
    if value < 1:
        raise ValueError("Gold 최소 가격 표본 수는 양의 정수여야 합니다.")
    return value


def matched_rates(complexes, lag, min_samples):
    """단지 쌍을 만들어 동·구·서울별로 각각 거래 수 가중 변화율을 계산한다."""
    pairs = complexes.merge(
        complexes.assign(**{PERIOD: complexes[PERIOD] + lag}),
        on=[DONG, GU, "APT_KEY", PERIOD],
        suffixes=("", "_PREV"),
        validate="1:1",
    )
    pairs["WEIGHT"] = pairs[["N_PREV", "N"]].min(axis=1)
    pairs["WEIGHTED_RET"] = (pairs["LOG_PRICE"] - pairs["LOG_PRICE_PREV"]) * pairs["WEIGHT"]

    results = []
    for regions in ([DONG], [GU], []):
        level = pairs.groupby([*regions, PERIOD]).agg(
            MATCH_CPLX_CNT=("APT_KEY", "size"),
            MATCH_TRD_PREV_CNT=("N_PREV", "sum"),
            MATCH_TRD_CNT=("N", "sum"),
            WEIGHT=("WEIGHT", "sum"),
            WEIGHTED_RET=("WEIGHTED_RET", "sum"),
        )
        supported = level["MATCH_TRD_PREV_CNT"].ge(min_samples) & level["MATCH_TRD_CNT"].ge(min_samples)
        level["RET"] = (level["WEIGHTED_RET"] / level["WEIGHT"]).where(supported)
        results.append(level[[*MATCH_COUNTS, "RET"]])
    return results


def build_price_index(detail, regions, grid, min_samples):
    price = detail["UNIT_AMT"]
    valid = price.gt(0) & np.isfinite(price) & detail["APT_KEY"].notna() & detail["APT_KEY"].ne("")
    trades = detail.loc[valid, [DONG, QTR, "APT_KEY", "UNIT_AMT"]].merge(
        regions[[DONG, GU]], on=DONG, validate="m:1",
    )
    trades[PERIOD] = pd.PeriodIndex(trades[QTR], freq="Q").asi8
    trades["LOG_PRICE"] = np.log(trades["UNIT_AMT"])
    # 법정동 + 단지 식별자를 전체 지역 수준에서도 유지해 서로 다른 동 사이의 가짜 매칭을 막는다.
    complexes = trades.groupby([DONG, GU, "APT_KEY", PERIOD])["LOG_PRICE"].agg(
        N="size", LOG_PRICE="median",
    ).reset_index()

    result = grid.to_frame(index=False).sort_values([DONG, QTR]).reset_index(drop=True)
    ordinal = pd.PeriodIndex(result[QTR], freq="Q").asi8
    dong_key = pd.MultiIndex.from_arrays([result[DONG], ordinal], names=[DONG, PERIOD])
    gu = result[DONG].map(regions.set_index(DONG)[GU])
    gu_key = pd.MultiIndex.from_arrays([gu, ordinal], names=[GU, PERIOD])
    for lag in (1, 4):
        dong_rate, gu_rate, seoul_rate = matched_rates(complexes, lag, min_samples)
        aligned = dong_rate.reindex(dong_key)
        result[f"CPLX_RET_{lag}Q"] = aligned["RET"].to_numpy()
        result[f"SGG_CPLX_RET_{lag}Q"] = gu_rate["RET"].reindex(gu_key).to_numpy()
        result[f"SEOUL_CPLX_RET_{lag}Q"] = seoul_rate["RET"].reindex(ordinal).to_numpy()
        if lag == 1:
            result[MATCH_COUNTS] = aligned[MATCH_COUNTS].fillna(0).astype("int64").to_numpy()

    observed = result["CPLX_RET_1Q"].notna()
    starts = observed & ~observed.groupby(result[DONG]).shift(fill_value=False)
    segments = starts.groupby(result[DONG]).cumsum().where(observed).astype("Int64")
    increments = result["CPLX_RET_1Q"].mask(starts, 0)
    result["PRICE_IDX"] = 100 * np.exp(increments.groupby([result[DONG], segments]).cumsum())
    result["IDX_SEG_NO"] = segments
    return result[[
        DONG, QTR, "CPLX_RET_1Q", "CPLX_RET_4Q", *MATCH_COUNTS, "PRICE_IDX", "IDX_SEG_NO",
        "SGG_CPLX_RET_1Q", "SGG_CPLX_RET_4Q", "SEOUL_CPLX_RET_1Q", "SEOUL_CPLX_RET_4Q",
    ]]
