import json
import os
from pathlib import Path
from shutil import copytree, ignore_patterns

from . import bronze, silver

ROOT = Path(__file__).resolve().parents[3]
WORKSPACE = ROOT / "backend" / ".apt-pipeline"


def refresh_scripts() -> None:
    for directory in ("pipeline", "metadata"):
        copytree(
            ROOT / directory, WORKSPACE / directory, dirs_exist_ok=True,
            ignore=ignore_patterns("__pycache__", "*.pyc"),
        )


def publish_checkpoint(path: Path, state: dict) -> None:
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(state, ensure_ascii=False, sort_keys=True), encoding="utf-8")
    temporary.replace(path)


def scan(*, force: bool = False) -> str:
    source = Path(os.environ.get("APT_PIPELINE_SOURCE", str(ROOT / "data" / "source")))
    external = Path(os.environ.get("APT_GOLD_SILVER_DIR", str(ROOT / "data" / "silver")))
    load = os.getenv("APT_PIPELINE_LOAD_DB") == "1"
    dashboard = load or os.getenv("APT_PIPELINE_DASHBOARD") == "1"
    completed = bronze.markers(source)
    checkpoint = WORKSPACE / "last_success.json"
    previous = json.loads(checkpoint.read_text(encoding="utf-8")) if checkpoint.is_file() else {}
    if previous.get("markers", {}).items() - completed.items():
        raise ValueError("이전에 처리한 수집 완료 표시가 누락되거나 바뀌었습니다")

    internal = WORKSPACE / "data" / "silver"
    clean = internal / "apt_trade" / "03_silver__apt_trade.parquet"
    collect = any(completed.values()) and (completed != previous.get("markers") or not clean.is_file())
    if collect:
        refresh_scripts()
        datasets = ["apt_trade"]
        if not any((internal / "ldong_code").glob("02_silver__*.parquet")):
            datasets.append("ldong_code")
        bronze.run(WORKSPACE, source, completed, datasets)
        need_region = dashboard and not silver.silver_path(external, "ldong_code").is_file()
        silver.run(WORKSPACE, datasets, include_region=need_region)
        if not clean.is_file():
            raise ValueError("Silver 03 산출물이 없습니다")

    current = {"markers": completed}
    if not dashboard:
        if not collect:
            return "unchanged"
        publish_checkpoint(checkpoint, current)
        return "silver_ready"

    from . import gold, star_schema, training

    if load and not silver.silver_path(external, "apt_trade").is_file():
        raise ValueError("DB 발행에는 전체 이력의 Silver 03 apt_trade 기준 파일이 필요합니다")
    if (
        not silver.silver_path(external, "ldong_code").is_file()
        and not silver.silver_path(internal, "ldong_code").is_file()
        and any((internal / "ldong_code").glob("02_silver__*.parquet"))
    ):
        refresh_scripts()
        from .runner import run_stage

        run_stage(WORKSPACE, "pipeline/silver/03_clean.py", "--dataset", "ldong_code")

    inputs = {}
    fingerprint = {}
    updated_trades = None
    for dataset in gold.DATASETS:
        internal_file = silver.silver_path(internal, dataset)
        baseline = silver.silver_path(external, dataset)
        path = (baseline if baseline.is_file() else internal_file).resolve()
        if dataset == "apt_trade" and baseline.is_file() and internal_file.is_file() and path != internal_file.resolve():
            updated_trades = internal_file
            info = internal_file.stat()
            fingerprint["watched_trades"] = [str(internal_file), info.st_size, info.st_mtime_ns]
        inputs[dataset] = path
        if path.is_file():
            info = path.stat()
            fingerprint[dataset] = [str(path), info.st_size, info.st_mtime_ns]
    current.update(silver=fingerprint, load=load)
    if load:
        current["database"] = [os.getenv(name, "") for name in ("DBHOST", "DBPORT", "DBNAME")]
        current["training_input"] = "postgresql"
    gold_output = WORKSPACE / "data" / "gold"
    outputs = star_schema.TABLES if load else (*star_schema.TABLES, star_schema.PREDICTIONS)
    if not force and previous == current and all((gold_output / f"{name}.parquet").is_file() for name in outputs):
        return "unchanged"
    if not collect:
        refresh_scripts()
    gold_output = gold.run(WORKSPACE, inputs, updated_trades=updated_trades)
    report = WORKSPACE / "report"
    if load:
        star_schema.run(gold_output, report)
        status = "loaded"
    else:
        status = "trained" if training.run(gold_output, report) else "gold_ready"
    publish_checkpoint(checkpoint, current)
    return status


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    print(f"status={scan(force=args.force)}")
