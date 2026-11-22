from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.features.dashboard.router import router as dashboard_router
from backend.app.features.dashboard.schemas import (
    DashboardBootstrapResponse,
    IndustryQuarterStatsSchema,
    IndustryStatsMapSchema,
    ModelPredictionSchema,
    ModelPredictionsByNameSchema,
    QuarterRecordsResponse,
    QuarterSummaryMetricsSchema,
    RegionQuarterRecordSchema,
)
from fastapi import FastAPI


def _sample_bootstrap() -> DashboardBootstrapResponse:
    zero = IndustryQuarterStatsSchema(openCnt=1, closeCnt=0, activeCnt=10, netCnt=1)
    ind = IndustryStatsMapSchema(
        GENERAL_FOOD=zero,
        REST_FOOD=zero,
        CAFE=zero,
        CLINIC=zero,
        PHARMACY=zero,
        BEAUTY=zero,
    )
    pred = ModelPredictionSchema(
        predictedGrowth=3.2,
        error=0.8,
        predPriceIdx=112.5,
        predPricePerSqm=1750,
    )
    preds = ModelPredictionsByNameSchema(baseline=pred, price=pred, price_lcns=pred)
    rec = RegionQuarterRecordSchema(
        regionCode="1111011500",
        regionName="사직동",
        sggName="종로구",
        quarter="2026Q3",
        year=2026,
        quarterNum=3,
        hasObservedTradeYn=True,
        lowSampleYn=False,
        tradeCnt=5,
        pricePerSqm=1765,
        priceIdx=112.52,
        actualGrowth=4.0,
        predictedGrowth=3.2,
        error=0.8,
        growthDelta=1.2,
        predictions=preds,
        industryStats=ind,
        convenienceActiveCnt=4,
    )
    summary = QuarterSummaryMetricsSchema(
        quarter="2026Q3",
        year=2026,
        quarterNum=3,
        periodType="eval",
        regime="POLARIZATION",
        regimeLabel="초양극화 국면",
        regimeDescription="test",
        hitRateByModel={"baseline": 15.3, "price": 38.3, "price_lcns": 39.7},
        maeByModel={"baseline": 6.46, "price": 4.14, "price_lcns": 4.17},
        polarizationIndex=12.4,
        avgActualGrowth=2.5,
        observedDongCount=338,
        lowSampleDongCount=1,
        nonTradeDongCount=129,
        evaluatedDongCount=209,
    )
    return DashboardBootstrapResponse(
        source="postgres",
        modelVersion="57b6837e9744",
        quarters=["2026Q3"],
        recordsByQuarter={"2026Q3": [rec]},
        summaries={"2026Q3": summary},
        top10CodesByQuarter={"2026Q3": ["1111011500"]},
    )


def _make_client() -> TestClient:
    app = FastAPI()
    app.include_router(dashboard_router, prefix="/api")
    return TestClient(app)


def test_dashboard_bootstrap_endpoint(monkeypatch):
    sample = _sample_bootstrap()
    monkeypatch.setattr(
        "backend.app.features.dashboard.router.get_dashboard_bootstrap",
        lambda force_refresh=False: sample,
    )
    client = _make_client()
    res = client.get("/api/dashboard/bootstrap")
    assert res.status_code == 200
    body = res.json()
    assert body["source"] == "postgres"
    assert body["modelVersion"] == "57b6837e9744"
    assert body["quarters"] == ["2026Q3"]
    assert body["recordsByQuarter"]["2026Q3"][0]["regionCode"] == "1111011500"


def test_dashboard_quarter_endpoint_ok_and_404(monkeypatch):
    sample = _sample_bootstrap()

    def _fake_quarter(quarter: str, force_refresh: bool = False):
        if quarter != "2026Q3":
            return None
        return QuarterRecordsResponse(
            source="postgres",
            quarter="2026Q3",
            summary=sample.summaries["2026Q3"],
            records=sample.recordsByQuarter["2026Q3"],
            top10Codes=sample.top10CodesByQuarter["2026Q3"],
        )

    monkeypatch.setattr(
        "backend.app.features.dashboard.router.get_quarter_payload",
        _fake_quarter,
    )
    client = _make_client()

    ok = client.get("/api/dashboard/quarters/2026Q3")
    assert ok.status_code == 200
    assert ok.json()["quarter"] == "2026Q3"

    missing = client.get("/api/dashboard/quarters/1999Q1")
    assert missing.status_code == 404
