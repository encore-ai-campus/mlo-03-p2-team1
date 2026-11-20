from threading import Event

from fastapi.testclient import TestClient

from backend.app import watch
from backend.app.main import create_app


def test_lifespan_runs_periodic_scan_without_blocking_requests(monkeypatch):
    first_scan = Event()
    release_scan = Event()
    first_scan_finished = Event()
    next_scan = Event()

    def scan(watch_dir):
        assert watch_dir == watch.WATCH_DIR
        if first_scan.is_set():
            next_scan.set()
            return
        first_scan.set()
        release_scan.wait(timeout=3)
        first_scan_finished.set()

    monkeypatch.setattr(watch, "scan", scan)
    monkeypatch.setattr(watch, "POLL_SECONDS", 0.01)

    with TestClient(create_app()) as client:
        try:
            assert first_scan.wait(timeout=3)
            assert client.get("/openapi.json").status_code == 200
            assert not first_scan_finished.is_set()
        finally:
            release_scan.set()
        assert next_scan.wait(timeout=3)

    assert "Watch stopped" in watch.LOG_PATH.read_text(encoding="utf-8")


def test_scan_archives_csv_in_sibling_directory(monkeypatch):
    watch.WATCH_DIR.mkdir()
    incoming = watch.WATCH_DIR / "sample.csv"
    incoming.write_text("aptNm,dealYear,dealAmount\nTEST,2026,12000\n", encoding="utf-8")
    expected = watch.WATCH_DIR.parent / "processed" / incoming.name

    def load_csv(path, destination):
        assert path == incoming
        assert destination == expected
        return 1

    monkeypatch.setattr(watch, "load_csv", load_csv)
    watch.scan(watch.WATCH_DIR)

    assert expected.is_file()
    assert not incoming.exists()
    assert not (watch.WATCH_DIR / "processed").exists()
