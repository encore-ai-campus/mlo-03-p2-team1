from contextlib import contextmanager

import psycopg
from fastapi.testclient import TestClient

from backend.app import db
from backend.app.main import create_app


def test_health_checks_database(monkeypatch):
    queries = []

    class Connection:
        def execute(self, query):
            queries.append(query)
            return self

        def fetchone(self):
            return (1,)

    @contextmanager
    def connect():
        yield Connection()

    monkeypatch.setattr(db, "connect", connect)
    with TestClient(create_app()) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        assert client.get("/").status_code == 404
        assert client.get("/docs").status_code == 200

    assert queries == ["SELECT 1"]


def test_health_returns_503_when_database_is_unavailable(monkeypatch):
    def connect():
        raise psycopg.OperationalError("Private connection details")

    monkeypatch.setattr(db, "connect", connect)
    with TestClient(create_app()) as client:
        response = client.get("/api/health")
        assert response.status_code == 503
        assert response.json() == {"detail": "Database unavailable"}
