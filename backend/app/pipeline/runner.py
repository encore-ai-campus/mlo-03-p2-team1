import subprocess
import sys
from pathlib import Path


def run_stage(workspace: Path, script: str, *args: str) -> None:
    entry = (workspace / script).resolve()
    if not entry.is_relative_to(workspace / "pipeline") or not entry.is_file():
        raise ValueError(f"파이프라인 실행 파일을 찾을 수 없습니다: {script}")
    report = workspace / "report"
    report.mkdir(exist_ok=True)
    with (report / "apt_pipeline.log").open("ab") as log:
        log.write(f"\n== {script} ==\n".encode("utf-8"))
        log.flush()
        subprocess.run(
            [sys.executable, "-X", "utf8", "-u", str(entry), *args],
            cwd=workspace,
            stdout=log,
            stderr=subprocess.STDOUT,
            check=True,
        )
