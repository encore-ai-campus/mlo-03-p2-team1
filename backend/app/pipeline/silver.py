from pathlib import Path

from .runner import run_stage


def silver_path(root: Path, dataset: str) -> Path:
    name = f"03_silver__{dataset}.parquet"
    nested = root / dataset / name
    return root / name if not nested.is_file() and (root / name).is_file() else nested


def run(workspace: Path, datasets: list[str], *, include_region: bool = False) -> None:
    run_stage(workspace, "pipeline/silver/02_normalize.py", "--dataset", *datasets)
    clean = ["apt_trade", "ldong_code"] if include_region else ["apt_trade"]
    run_stage(workspace, "pipeline/silver/03_clean.py", "--dataset", *clean)
