from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from .queries import get_dashboard_bootstrap, get_quarter_payload
from .schemas import DashboardBootstrapResponse, QuarterRecordsResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/bootstrap", response_model=DashboardBootstrapResponse)
def read_dashboard_bootstrap(
    refresh: bool = Query(default=False, description="Bypass in-memory cache and re-query DB"),
) -> DashboardBootstrapResponse:
    try:
        return get_dashboard_bootstrap(force_refresh=refresh)
    except Exception as exc:  # pragma: no cover - surfaced as 503
        raise HTTPException(status_code=503, detail=f"Database query failed: {exc}") from exc


@router.get("/quarters/{quarter}", response_model=QuarterRecordsResponse)
def read_dashboard_quarter(
    quarter: str,
    refresh: bool = Query(default=False),
) -> QuarterRecordsResponse:
    try:
        payload = get_quarter_payload(quarter, force_refresh=refresh)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=503, detail=f"Database query failed: {exc}") from exc
    if payload is None:
        raise HTTPException(status_code=404, detail=f"Quarter not found: {quarter}")
    return payload
