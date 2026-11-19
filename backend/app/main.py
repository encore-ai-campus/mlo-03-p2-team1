from fastapi import FastAPI

from .features.health.router import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(title="ApartApart API")
    app.include_router(health_router, prefix="/api")
    return app


app = create_app()
