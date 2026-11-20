import pytest

from backend.app import watch


@pytest.fixture(autouse=True)
def isolate_watch_paths(monkeypatch, tmp_path):
    for name in ("APT_PIPELINE_WATCH", "APT_PIPELINE_DASHBOARD", "APT_PIPELINE_LOAD_DB"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setattr(watch, "WATCH_DIR", tmp_path / "watch")
    monkeypatch.setattr(watch, "LOG_PATH", tmp_path / "watch.log")
