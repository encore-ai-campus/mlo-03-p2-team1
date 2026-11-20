from threading import Event
from xml.etree import ElementTree

import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_app
from backend.app.pipeline import feed


def test_fastapi_starts_apt_pipeline_in_background(monkeypatch, tmp_path):
    scanned = Event()

    def scan():
        scanned.set()
        return "silver_ready"

    monkeypatch.setenv("APT_PIPELINE_WATCH", "1")
    monkeypatch.setattr(feed, "WORKSPACE", tmp_path)
    monkeypatch.setattr(feed, "scan", scan)
    with TestClient(create_app()) as client:
        assert scanned.wait(3)
        assert client.get("/openapi.json").status_code == 200
    assert "status=silver_ready" in (tmp_path / "report" / "watch.log").read_text(encoding="utf-8")


def test_feed_runs_existing_stages_and_excludes_incomplete_xml(monkeypatch, tmp_path):
    pytest.importorskip("pandas")
    parquet = pytest.importorskip("pyarrow.parquet")
    source = tmp_path / "source"
    workspace = tmp_path / "workspace"
    monkeypatch.setenv("APT_PIPELINE_SOURCE", str(source))
    monkeypatch.delenv("APT_PIPELINE_GOLD_SCRIPT", raising=False)
    monkeypatch.delenv("APT_PIPELINE_STAR_SCHEMA_SCRIPT", raising=False)
    monkeypatch.setattr(feed, "WORKSPACE", workspace)

    month = source / "api" / "apt_trade" / "202609"
    month.mkdir(parents=True)
    ldong = source / "files" / "ldong_code" / "fixture.txt"
    ldong.parent.mkdir(parents=True)
    ldong.write_text(
        "법정동코드\t법정동명\t폐지여부\n1144010100\t서울특별시 마포구 아현동\t존재\n",
        encoding="utf-8-sig",
    )

    def write_page(district, page):
        root = ElementTree.Element("response")
        body = ElementTree.SubElement(root, "body")
        ElementTree.SubElement(body, "totalCount").text = "2"
        item = ElementTree.SubElement(ElementTree.SubElement(body, "items"), "item")
        for key, value in {
            "aptNm": "sample", "aptSeq": f"{district}-001", "dealYear": "2026", "dealMonth": "9",
            "dealDay": str(page), "excluUseAr": "84", "floor": "2", "sggCd": district,
            "umdNm": "아현동", "aptDong": "101", "cdealType": "", "dealAmount": "120000", "umdCd": "10100",
        }.items():
            ElementTree.SubElement(item, key).text = value
        path = month / f"apt_trade__{district}_202609__p{page:04d}.xml"
        ElementTree.ElementTree(root).write(path, encoding="utf-8")

    write_page("11440", 1)
    write_page("11440", 2)
    write_page("11680", 1)
    marker = month / "_done_11440"
    marker.write_text("3\n", encoding="utf-8")
    with pytest.raises(ValueError, match="API"):
        feed.scan()
    assert not (workspace / "last_success.json").exists()

    marker.write_text("2\n", encoding="utf-8")
    inputs = {path: path.read_bytes() for path in source.rglob("*") if path.is_file()}
    assert feed.scan() == "silver_ready"
    output = workspace / "data" / "silver" / "apt_trade" / "03_silver__apt_trade.parquet"
    rows = parquet.read_table(output, columns=["SGG_CD", "LDONG_CD"]).to_pylist()
    assert rows == [{"SGG_CD": "11440", "LDONG_CD": "1144010100"}] * 2
    assert feed.scan() == "unchanged"
    assert {path: path.read_bytes() for path in source.rglob("*") if path.is_file()} == inputs


def test_feed_records_success_only_after_database_publish(monkeypatch, tmp_path):
    pytest.importorskip("pandas")
    from backend.app.pipeline import gold, star_schema, training

    project = tmp_path / "project"
    (project / "pipeline").mkdir(parents=True)
    (project / "metadata").mkdir()
    workspace = tmp_path / "workspace"
    monkeypatch.setattr(feed, "ROOT", project)
    monkeypatch.setattr(feed, "WORKSPACE", workspace)
    monkeypatch.setenv("APT_PIPELINE_LOAD_DB", "1")
    baseline = tmp_path / "silver"
    baseline.mkdir()
    (baseline / "03_silver__apt_trade.parquet").touch()
    monkeypatch.setenv("APT_GOLD_SILVER_DIR", str(baseline))
    monkeypatch.setattr(feed.bronze, "markers", lambda source: {})
    steps = []

    def build(workspace, inputs, *, updated_trades):
        assert set(inputs) == set(gold.DATASETS)
        steps.append("gold")
        location = workspace / "data" / "gold"
        location.mkdir(parents=True, exist_ok=True)
        for name in star_schema.TABLES:
            (location / f"{name}.parquet").touch()
        return location

    def train(location, report):
        pytest.fail("DB 발행은 Parquet 입력으로 학습하면 안 됩니다")

    def publish(location, report):
        steps.append("publish")
        if steps.count("publish") == 1:
            raise ValueError("simulated load failure")

    monkeypatch.setattr(gold, "run", build)
    monkeypatch.setattr(training, "run", train)
    monkeypatch.setattr(star_schema, "run", publish)
    with pytest.raises(ValueError, match="simulated load failure"):
        feed.scan()
    assert not (workspace / "last_success.json").exists()
    assert feed.scan() == "loaded"
    assert feed.scan() == "unchanged"
    assert steps == ["gold", "publish"] * 2
