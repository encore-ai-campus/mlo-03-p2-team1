import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .features.dashboard.router import router as dashboard_router
from .features.health.router import router as health_router
from .watch import watch_lifespan


def create_app() -> FastAPI:
    app = FastAPI(title="ApartApart API", lifespan=watch_lifespan)
    origins = os.getenv("DASHBOARD_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    app.add_middleware(
        CORSMiddleware, allow_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
        allow_methods=["GET"],
    )
    app.include_router(health_router, prefix="/api")
    app.include_router(dashboard_router, prefix="/api")
    return app


app = create_app()
