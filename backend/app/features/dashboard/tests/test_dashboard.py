import psycopg
from fastapi.testclient import TestClient

from backend.app.features.dashboard import queries
from backend.app.main import create_app


def test_dashboard_queries_validate_filters_and_preserve_missing_actuals(monkeypatch):
    def regions(yq, code):
        assert (yq, code) == ("2026Q4", "1144010100")
        return [{
            "region_code": code, "region_name": "아현동", "district_code": "11440",
            "district_name": "마포구", "provisional": None, "trade_count": None,
            "priced_count": None, "price_per_sqm_won": None, "actual_growth_pct": None,
            "predicted_rise": False, "rise_probability": 0, "model_version": "decision-tree-rise-v1",
            "model_fit_through": "2026Q3", "prediction_kind": "forecast", "license_metrics": [],
        }]

    monkeypatch.setattr(queries, "regions", regions)
    with TestClient(create_app()) as client:
        response = client.get("/api/dashboard/regions?year=2026&quarter=4&regionCode=1144010100")
        assert response.status_code == 200
        data = response.json()["regions"][0]
        assert data["regionCode"] == "1144010100"
        assert data["predictedRise"] is False
        assert data["riseProbability"] == 0
        assert data["tradeCount"] is None
        assert data["actualGrowthPct"] is None
        assert client.get("/api/dashboard/regions?year=2026&quarter=5").status_code == 422
        assert client.get("/api/dashboard/regions?year=2026&quarter=4&regionCode=11440").status_code == 422


def test_dashboard_empty_regions_and_unavailable_database(monkeypatch):
    monkeypatch.setattr(queries, "regions", lambda yq, code: [])

    def unavailable():
        raise psycopg.OperationalError("private details")

    monkeypatch.setattr(queries, "quarters", unavailable)
    with TestClient(create_app()) as client:
        assert client.get("/api/dashboard/regions?year=2022&quarter=1").json() == {
            "year": 2022, "quarter": 1, "regions": [],
        }
        response = client.get("/api/dashboard/quarters")
        assert response.status_code == 503
        assert response.json() == {"detail": "Dashboard data unavailable"}
