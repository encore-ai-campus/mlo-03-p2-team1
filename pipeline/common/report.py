"""실행 결과 기록 (manifest CSV, README.md). 01·02 단계가 같이 쓴다."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

KST = timezone(timedelta(hours=9))


def now_kst() -> str:
    return datetime.now(KST).isoformat(timespec="seconds")


def human_size(size: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


def md_table(df: pd.DataFrame) -> list[str]:
    """DataFrame → 마크다운 표 줄 목록. 셀 안의 | 와 줄바꿈은 표가 깨지지 않게 바꾼다."""
    def cell(value) -> str:
        return str(value).replace("|", "\\|").replace("\n", " ")

    lines = ["| " + " | ".join(df.columns) + " |", "| " + " | ".join("---" for _ in df.columns) + " |"]
    for row in df.itertuples(index=False):
        lines.append("| " + " | ".join(cell(v) for v in row) + " |")
    return lines


def write_markdown(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_csv(path: Path, df: pd.DataFrame) -> None:
    """엑셀에서 한글이 깨지지 않도록 utf-8-sig 로 저장한다."""
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False, encoding="utf-8-sig")


def merge_dataset_rows(path: Path, run: pd.DataFrame, run_datasets: list[str]) -> pd.DataFrame:
    """--dataset 으로 일부만 실행했을 때, 이번에 다루지 않은 데이터셋 행은 이전 결과를 유지한다."""
    if not path.exists():
        return run
    previous = pd.read_csv(path, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    keep = previous[~previous["dataset"].isin(run_datasets)]
    merged = pd.concat([keep, run.astype(str)], ignore_index=True)
    return merged.sort_values("dataset", kind="stable").reset_index(drop=True)
