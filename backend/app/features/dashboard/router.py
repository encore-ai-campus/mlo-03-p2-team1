import logging
from typing import Annotated

import psycopg
from fastapi import APIRouter, HTTPException, Query

from . import queries
from .schemas import Quarter, Regions

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
logger = logging.getLogger(__name__)


@router.get("/quarters", response_model=list[Quarter])
def list_quarters():
    try:
        return queries.quarters()
    except (psycopg.Error, ValueError) as error:
        logger.warning("Dashboard quarters query failed (%s)", type(error).__name__)
        raise HTTPException(status_code=503, detail="Dashboard data unavailable") from error


@router.get("/regions", response_model=Regions)
def region_metrics(
    year: Annotated[int, Query(ge=1900, le=2100)],
    quarter: Annotated[int, Query(ge=1, le=4)],
    region_code: Annotated[str | None, Query(alias="regionCode", pattern=r"^[0-9]{10}$")] = None,
):
    try:
        return {"year": year, "quarter": quarter, "regions": queries.regions(f"{year}Q{quarter}", region_code)}
    except (psycopg.Error, ValueError) as error:
        logger.warning("Dashboard regions query failed (%s)", type(error).__name__)
        raise HTTPException(status_code=503, detail="Dashboard data unavailable") from error
