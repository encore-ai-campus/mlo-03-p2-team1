import logging

import psycopg
from fastapi import APIRouter, HTTPException

from ... import db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health", responses={503: {"description": "PostgreSQL 연결 실패"}})
def health() -> dict[str, str]:
    try:
        with db.connect() as connection:
            connection.execute("SELECT 1").fetchone()
    except (psycopg.Error, ValueError) as error:
        logger.warning("PostgreSQL health check failed (%s)", type(error).__name__)
        raise HTTPException(status_code=503, detail="Database unavailable") from error

    return {"status": "ok"}
