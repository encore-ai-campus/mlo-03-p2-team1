from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .features.dashboard.router import router as dashboard_router
from .features.health.router import router as health_router
from .watch import watch_lifespan


def create_app() -> FastAPI:
    app = FastAPI(title="ApartApart API", lifespan=watch_lifespan)
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health_router, prefix="/api")
    app.include_router(dashboard_router, prefix="/api")
    return app


app = create_app()
