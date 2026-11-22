from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

ModelName = Literal["baseline", "price", "price_lcns"]
MarketRegime = Literal["BOOM", "SLUMP", "POLARIZATION"]
QuarterPeriodType = Literal["train", "eval", "forecast"]


class IndustryQuarterStatsSchema(BaseModel):
    openCnt: int
    closeCnt: int
    activeCnt: int
    netCnt: int


class IndustryStatsMapSchema(BaseModel):
    GENERAL_FOOD: IndustryQuarterStatsSchema
    REST_FOOD: IndustryQuarterStatsSchema
    CAFE: IndustryQuarterStatsSchema
    CLINIC: IndustryQuarterStatsSchema
    PHARMACY: IndustryQuarterStatsSchema
    BEAUTY: IndustryQuarterStatsSchema


class ModelPredictionSchema(BaseModel):
    predictedGrowth: float
    error: float | None = None
    predPriceIdx: float | None = None
    predPricePerSqm: int | None = None


class ModelPredictionsByNameSchema(BaseModel):
    baseline: ModelPredictionSchema
    price: ModelPredictionSchema
    price_lcns: ModelPredictionSchema


class RegionQuarterRecordSchema(BaseModel):
    regionCode: str
    regionName: str
    sggName: str
    quarter: str
    year: int
    quarterNum: int
    hasObservedTradeYn: bool
    lowSampleYn: bool
    tradeCnt: int
    pricePerSqm: int | None = None
    priceIdx: float | None = None
    actualGrowth: float | None = None
    predictedGrowth: float | None = None
    error: float | None = None
    growthDelta: float | None = None
    predictions: ModelPredictionsByNameSchema | None = None
    industryStats: IndustryStatsMapSchema
    convenienceActiveCnt: int


class QuarterSummaryMetricsSchema(BaseModel):
    quarter: str
    year: int
    quarterNum: int
    periodType: QuarterPeriodType
    regime: MarketRegime
    regimeLabel: str
    regimeDescription: str
    hitRateByModel: dict[ModelName, float | None]
    maeByModel: dict[ModelName, float | None]
    polarizationIndex: float | None = None
    avgActualGrowth: float | None = None
    observedDongCount: int
    lowSampleDongCount: int
    nonTradeDongCount: int
    evaluatedDongCount: int


class DashboardBootstrapResponse(BaseModel):
    source: Literal["postgres"]
    modelVersion: str
    quarters: list[str]
    recordsByQuarter: dict[str, list[RegionQuarterRecordSchema]]
    summaries: dict[str, QuarterSummaryMetricsSchema]
    top10CodesByQuarter: dict[str, list[str]]


class QuarterRecordsResponse(BaseModel):
    source: Literal["postgres"]
    quarter: str
    summary: QuarterSummaryMetricsSchema
    records: list[RegionQuarterRecordSchema]
    top10Codes: list[str]
