import pytest

from backend.app import watch


@pytest.fixture(autouse=True)
def isolate_watch_paths(monkeypatch, tmp_path):
    monkeypatch.setattr(watch, "WATCH_DIR", tmp_path / "watch")
    monkeypatch.setattr(watch, "LOG_PATH", tmp_path / "watch.log")
