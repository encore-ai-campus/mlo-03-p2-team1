from fastapi import FastAPI

from .features.health.router import router as health_router
from .watch import watch_lifespan


def create_app() -> FastAPI:
    app = FastAPI(title="ApartApart API", lifespan=watch_lifespan)
    app.include_router(health_router, prefix="/api")
    return app


app = create_app()
