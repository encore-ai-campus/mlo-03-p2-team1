from __future__ import annotations

import threading
import time
from collections import defaultdict
from typing import Any

from ...db import connect
from .schemas import (
    DashboardBootstrapResponse,
    IndustryQuarterStatsSchema,
    IndustryStatsMapSchema,
    MarketRegime,
    ModelName,
    ModelPredictionSchema,
    ModelPredictionsByNameSchema,
    QuarterPeriodType,
    QuarterRecordsResponse,
    QuarterSummaryMetricsSchema,
    RegionQuarterRecordSchema,
)

MODELS: tuple[ModelName, ...] = ("baseline", "price", "price_lcns")
HIT_THRESHOLD_PP = 2.0
CACHE_TTL_SEC = 300.0

_cache_lock = threading.Lock()
_cached_bootstrap: DashboardBootstrapResponse | None = None
_cached_at: float = 0.0


def _round_opt(val: float | None, digits: int = 2) -> float | None:
    if val is None:
        return None
    return round(float(val), digits)


def _won_to_manwon(val: float | None) -> int | None:
    if val is None:
        return None
    return int(round(float(val) / 10_000.0))


def _parse_quarter(yq: str) -> tuple[int, int]:
    return int(yq[:4]), int(yq[5])


def _period_type_for(yq: str, forecast_yq: str) -> QuarterPeriodType:
    if yq == forecast_yq:
        return "forecast"
    yr, _ = _parse_quarter(yq)
    return "train" if yr <= 2020 else "eval"


def _classify_regime(
    yq: str,
    period_type: QuarterPeriodType,
    avg_growth: float | None,
) -> tuple[MarketRegime, str, str]:
    if period_type == "forecast":
        return (
            "POLARIZATION",
            "다음 분기 예측",
            "2026Q3 기준 학습 모델로 추정한 221개 서울 법정동 2026Q4 변화율·매매가 예측",
        )
    yr, _ = _parse_quarter(yq)
    if yr in (2022, 2023) and (avg_growth is None or avg_growth < 0.2):
        return (
            "SLUMP",
            "금리 급등 조정기",
            "고금리 충격과 거래 절벽으로 서울 전역 아파트 매매가 하락·조정 국면",
        )
    if yr <= 2021 or (avg_growth is not None and avg_growth >= 2.2):
        return (
            "BOOM",
            "상승 국면",
            "저금리·유동성 또는 핵심지 선도 매수세로 서울 아파트 매매가 상승세 확산",
        )
    return (
        "POLARIZATION",
        "초양극화 국면",
        "외곽 거래 희소·보합 속 강남·서초·송파·용산·성동 핵심 법정동 중심으로 상승세 집중",
    )


def _zero_industry_stats() -> IndustryStatsMapSchema:
    zero = IndustryQuarterStatsSchema(openCnt=0, closeCnt=0, activeCnt=0, netCnt=0)
    return IndustryStatsMapSchema(
        GENERAL_FOOD=zero,
        REST_FOOD=zero,
        CAFE=zero,
        CLINIC=zero,
        PHARMACY=zero,
        BEAUTY=zero,
    )


def _make_industry_stat(open_cnt: Any, close_cnt: Any, active_cnt: Any) -> IndustryQuarterStatsSchema:
    o = int(open_cnt or 0)
    c = int(close_cnt or 0)
    a = int(active_cnt or 0)
    return IndustryQuarterStatsSchema(openCnt=o, closeCnt=c, activeCnt=a, netCnt=o - c)


def _load_bootstrap_from_db() -> DashboardBootstrapResponse:
    with connect() as conn:
        with conn.cursor() as cur:
            # 1. Regions (467 Seoul legal dongs)
            cur.execute(
                """
                SELECT "LDONG_CD", COALESCE(NULLIF("UMD_NM", ''), "LDONG_NM"), "SGG_NM", "HAS_OBSERVED_TRADE_YN"
                FROM gold.dim_region
                ORDER BY "LDONG_CD"
                """
            )
            regions: list[tuple[str, str, str, bool]] = [
                (str(r[0]), str(r[1]), str(r[2]), bool(r[3])) for r in cur.fetchall()
            ]

            # 2. Gold quarterly mart + same-complex price index (39 quarters x 467 dongs)
            cur.execute(
                """
                SELECT
                    m."LDONG_CD",
                    m."YQ",
                    m."TRADE_CNT",
                    m."UNIT_AMT_MEDIAN",
                    m."LOW_SAMPLE_YN",
                    idx."CPLX_RET_1Q",
                    idx."PRICE_IDX",
                    m."GENERAL_FOOD_OPEN_CNT", m."GENERAL_FOOD_CLOSE_CNT", m."GENERAL_FOOD_ACTIVE_CNT",
                    m."REST_FOOD_OPEN_CNT",    m."REST_FOOD_CLOSE_CNT",    m."REST_FOOD_ACTIVE_CNT",
                    m."CAFE_OPEN_CNT",         m."CAFE_CLOSE_CNT",         m."CAFE_ACTIVE_CNT",
                    m."CLINIC_OPEN_CNT",       m."CLINIC_CLOSE_CNT",       m."CLINIC_ACTIVE_CNT",
                    m."PHARMACY_OPEN_CNT",     m."PHARMACY_CLOSE_CNT",     m."PHARMACY_ACTIVE_CNT",
                    m."BEAUTY_OPEN_CNT",       m."BEAUTY_CLOSE_CNT",       m."BEAUTY_ACTIVE_CNT",
                    m."CONVENIENCE_ACTIVE_CNT"
                FROM gold.mart_ldong_infra_qtr m
                LEFT JOIN gold.fact_apt_idx_qtr idx
                  ON m."LDONG_CD" = idx."LDONG_CD" AND m."YQ" = idx."YQ"
                ORDER BY m."YQ", m."LDONG_CD"
                """
            )
            mart_by_yq_code: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
            observed_yqs_set: set[str] = set()

            for row in cur.fetchall():
                code = str(row[0])
                yq = str(row[1])
                observed_yqs_set.add(yq)
                actual_ret_pct = _round_opt(row[5] * 100.0, 2) if row[5] is not None else None
                mart_by_yq_code[yq][code] = {
                    "tradeCnt": int(row[2] or 0),
                    "pricePerSqm": _won_to_manwon(row[3]),
                    "lowSampleYn": bool(row[4]),
                    "actualGrowth": actual_ret_pct,
                    "priceIdx": _round_opt(row[6], 2),
                    "industryStats": IndustryStatsMapSchema(
                        GENERAL_FOOD=_make_industry_stat(row[7], row[8], row[9]),
                        REST_FOOD=_make_industry_stat(row[10], row[11], row[12]),
                        CAFE=_make_industry_stat(row[13], row[14], row[15]),
                        CLINIC=_make_industry_stat(row[16], row[17], row[18]),
                        PHARMACY=_make_industry_stat(row[19], row[20], row[21]),
                        BEAUTY=_make_industry_stat(row[22], row[23], row[24]),
                    ),
                    "convenienceActiveCnt": int(row[25] or 0),
                }

            # 3. AI Ready predictions (3 models x eval quarters + forecast quarter)
            cur.execute(
                """
                SELECT
                    "LDONG_CD",
                    "YQ",
                    "MODEL_NM",
                    "MODEL_VER",
                    "PRED_RET",
                    "ACTUAL_RET",
                    "PRED_IDX",
                    "PRED_UNIT_AMT"
                FROM ai_ready.prediction
                ORDER BY "YQ", "LDONG_CD", "MODEL_NM"
                """
            )
            preds_by_yq_code: dict[str, dict[str, dict[str, ModelPredictionSchema]]] = defaultdict(
                lambda: defaultdict(dict)
            )
            pred_yqs_set: set[str] = set()
            model_version = "57b6837e9744"

            for row in cur.fetchall():
                code = str(row[0])
                yq = str(row[1])
                model_nm = str(row[2])
                if model_nm not in MODELS:
                    continue
                if row[3]:
                    model_version = str(row[3])
                pred_yqs_set.add(yq)

                pred_pct = _round_opt(row[4] * 100.0, 2) if row[4] is not None else 0.0
                actual_pct = _round_opt(row[5] * 100.0, 2) if row[5] is not None else None
                err_pp = (
                    _round_opt(actual_pct - pred_pct, 2)
                    if (actual_pct is not None and pred_pct is not None)
                    else None
                )
                preds_by_yq_code[yq][code][model_nm] = ModelPredictionSchema(
                    predictedGrowth=pred_pct if pred_pct is not None else 0.0,
                    error=err_pp,
                    predPriceIdx=_round_opt(row[6], 2),
                    predPricePerSqm=_won_to_manwon(row[7]),
                )

    all_yqs = sorted(observed_yqs_set | pred_yqs_set)
    latest_observed_yq = max(observed_yqs_set) if observed_yqs_set else "2026Q3"
    forecast_yq = max(pred_yqs_set - observed_yqs_set) if (pred_yqs_set - observed_yqs_set) else "2026Q4"

    # Build 2021 baseline actual growth lookup by (quarterNum, regionCode) for growthDelta
    baseline_2021: dict[tuple[int, str], float] = {}
    for q_num in (1, 2, 3, 4):
        yq_2021 = f"2021Q{q_num}"
        for code, m in mart_by_yq_code.get(yq_2021, {}).items():
            if m["actualGrowth"] is not None:
                baseline_2021[(q_num, code)] = m["actualGrowth"]

    records_by_quarter: dict[str, list[RegionQuarterRecordSchema]] = {}
    summaries: dict[str, QuarterSummaryMetricsSchema] = {}
    top10_codes_by_quarter: dict[str, list[str]] = {}

    latest_mart_map = mart_by_yq_code.get(latest_observed_yq, {})

    for yq in all_yqs:
        yr, q_num = _parse_quarter(yq)
        period_type = _period_type_for(yq, forecast_yq)
        mart_map = mart_by_yq_code.get(yq, {})
        pred_map = preds_by_yq_code.get(yq, {})

        q_records: list[RegionQuarterRecordSchema] = []
        actual_growths: list[float] = []
        observed_dong_cnt = 0
        low_sample_dong_cnt = 0
        non_trade_dong_cnt = 0
        evaluated_dong_cnt = 0

        err_lists: dict[ModelName, list[float]] = {m: [] for m in MODELS}

        for code, ldong_nm, sgg_nm, has_obs_trade in regions:
            if has_obs_trade:
                observed_dong_cnt += 1
            else:
                non_trade_dong_cnt += 1

            m_row = mart_map.get(code)
            fallback_m = latest_mart_map.get(code) if period_type == "forecast" else None

            trade_cnt = m_row["tradeCnt"] if m_row else 0
            low_sample_yn = m_row["lowSampleYn"] if m_row else False
            if has_obs_trade and low_sample_yn and period_type != "forecast":
                low_sample_dong_cnt += 1

            price_per_sqm = m_row["pricePerSqm"] if m_row else None
            price_idx = m_row["priceIdx"] if m_row else None
            actual_growth = m_row["actualGrowth"] if m_row else None
            industry_stats = (
                m_row["industryStats"]
                if m_row
                else (fallback_m["industryStats"] if fallback_m else _zero_industry_stats())
            )
            convenience_cnt = (
                m_row["convenienceActiveCnt"]
                if m_row
                else (fallback_m["convenienceActiveCnt"] if fallback_m else 0)
            )

            p_models = pred_map.get(code)
            predictions_obj: ModelPredictionsByNameSchema | None = None
            if p_models and all(m in p_models for m in MODELS):
                predictions_obj = ModelPredictionsByNameSchema(
                    baseline=p_models["baseline"],
                    price=p_models["price"],
                    price_lcns=p_models["price_lcns"],
                )
                evaluated_dong_cnt += 1
                for m_name in MODELS:
                    e_val = p_models[m_name].error
                    if e_val is not None:
                        err_lists[m_name].append(e_val)

            primary_pred = predictions_obj.price_lcns if predictions_obj else None
            if actual_growth is not None:
                actual_growths.append(actual_growth)

            base_2021_g = baseline_2021.get((q_num, code))
            growth_delta = (
                _round_opt(actual_growth - base_2021_g, 2)
                if (actual_growth is not None and base_2021_g is not None)
                else None
            )

            q_records.append(
                RegionQuarterRecordSchema(
                    regionCode=code,
                    regionName=ldong_nm,
                    sggName=sgg_nm,
                    quarter=yq,
                    year=yr,
                    quarterNum=q_num,
                    hasObservedTradeYn=has_obs_trade,
                    lowSampleYn=low_sample_yn,
                    tradeCnt=trade_cnt,
                    pricePerSqm=price_per_sqm,
                    priceIdx=price_idx,
                    actualGrowth=actual_growth,
                    predictedGrowth=primary_pred.predictedGrowth if primary_pred else None,
                    error=primary_pred.error if primary_pred else None,
                    growthDelta=growth_delta,
                    predictions=predictions_obj,
                    industryStats=industry_stats,
                    convenienceActiveCnt=convenience_cnt,
                )
            )

        avg_actual = (
            _round_opt(sum(actual_growths) / len(actual_growths), 2) if actual_growths else None
        )

        polarization_idx: float | None = None
        if len(actual_growths) >= 10:
            sorted_g = sorted(actual_growths)
            k = max(1, int(len(sorted_g) * 0.1))
            top_avg = sum(sorted_g[-k:]) / k
            bot_avg = sum(sorted_g[:k]) / k
            polarization_idx = _round_opt(top_avg - bot_avg, 2)

        hit_rate_by_model: dict[ModelName, float | None] = {}
        mae_by_model: dict[ModelName, float | None] = {}
        for m_name in MODELS:
            errs = err_lists[m_name]
            if errs:
                hits = sum(1 for e in errs if abs(e) <= HIT_THRESHOLD_PP)
                hit_rate_by_model[m_name] = round((hits / len(errs)) * 100.0, 1)
                mae_by_model[m_name] = round(sum(abs(e) for e in errs) / len(errs), 2)
            else:
                hit_rate_by_model[m_name] = None
                mae_by_model[m_name] = None

        regime, regime_label, regime_desc = _classify_regime(yq, period_type, avg_actual)

        # Top 10% core spotlight dongs for this quarter
        if period_type == "forecast":
            ranked = sorted(
                (r for r in q_records if r.predictedGrowth is not None),
                key=lambda r: r.predictedGrowth if r.predictedGrowth is not None else -1e9,
                reverse=True,
            )
        else:
            ranked = sorted(
                (r for r in q_records if r.actualGrowth is not None),
                key=lambda r: r.actualGrowth if r.actualGrowth is not None else -1e9,
                reverse=True,
            )
        top_n = max(10, int(len(ranked) * 0.1)) if ranked else 0
        top10_codes_by_quarter[yq] = [r.regionCode for r in ranked[:top_n]]

        records_by_quarter[yq] = q_records
        summaries[yq] = QuarterSummaryMetricsSchema(
            quarter=yq,
            year=yr,
            quarterNum=q_num,
            periodType=period_type,
            regime=regime,
            regimeLabel=regime_label,
            regimeDescription=regime_desc,
            hitRateByModel=hit_rate_by_model,
            maeByModel=mae_by_model,
            polarizationIndex=polarization_idx,
            avgActualGrowth=avg_actual,
            observedDongCount=observed_dong_cnt,
            lowSampleDongCount=low_sample_dong_cnt,
            nonTradeDongCount=non_trade_dong_cnt,
            evaluatedDongCount=evaluated_dong_cnt,
        )

    return DashboardBootstrapResponse(
        source="postgres",
        modelVersion=model_version,
        quarters=all_yqs,
        recordsByQuarter=records_by_quarter,
        summaries=summaries,
        top10CodesByQuarter=top10_codes_by_quarter,
    )


def get_dashboard_bootstrap(force_refresh: bool = False) -> DashboardBootstrapResponse:
    global _cached_bootstrap, _cached_at
    now = time.monotonic()
    with _cache_lock:
        if (
            not force_refresh
            and _cached_bootstrap is not None
            and (now - _cached_at) < CACHE_TTL_SEC
        ):
            return _cached_bootstrap

    fresh = _load_bootstrap_from_db()
    with _cache_lock:
        _cached_bootstrap = fresh
        _cached_at = time.monotonic()
    return fresh


def get_quarter_payload(quarter: str, force_refresh: bool = False) -> QuarterRecordsResponse | None:
    bootstrap = get_dashboard_bootstrap(force_refresh=force_refresh)
    if quarter not in bootstrap.recordsByQuarter:
        return None
    return QuarterRecordsResponse(
        source="postgres",
        quarter=quarter,
        summary=bootstrap.summaries[quarter],
        records=bootstrap.recordsByQuarter[quarter],
        top10Codes=bootstrap.top10CodesByQuarter[quarter],
    )
