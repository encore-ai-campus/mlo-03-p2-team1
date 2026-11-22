"""Watch 폴더(data/watch/)를 주기적으로 폴링해 신규 원천 유입 시 전체 파이프라인을 자동 실행한다.

동작 방식:
- data/watch/ 아래에 원천 묶음 폴더(내부에 api/ 또는 files/ 포함)나 .zip 아카이브가 들어오면 감지한다.
- 복사 중인 임시 항목(.part, .tmp, 숨김 파일)은 무시한다.
- 감지된 원천을 data/source/에 반영한 뒤 아래 파이프라인을 순차 실행한다:
  01_bronze → 02_normalize → 03_clean → 04_gold → 05_feature_set
  → load_postgres(gold) → 05_train → load_postgres(ai_ready) → FastAPI 캐시 갱신
- 성공 시 유입 항목을 data/processed/<timestamp>__<name> 으로 이동한다.
- 실패 시 data/quarantine/<timestamp>__<name> 으로 격리하고 report/pipeline_watch.log 에 기록한다.

사용법:
  python scripts/watch_pipeline.py
  python scripts/watch_pipeline.py --interval 5 --once
"""
from __future__ import annotations

import argparse
import logging
import os
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
SOURCE_DIR = DATA_DIR / "source"
WATCH_DIR = DATA_DIR / "watch"
PROCESSED_DIR = DATA_DIR / "processed"
QUARANTINE_DIR = DATA_DIR / "quarantine"
LOG_PATH = ROOT_DIR / "report" / "pipeline_watch.log"

IGNORED_SUFFIXES = (".part", ".tmp", ".crdownload")


def setup_logger() -> logging.Logger:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("pipeline_watch")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(fmt)
    file_handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
    file_handler.setFormatter(fmt)

    logger.addHandler(stream_handler)
    logger.addHandler(file_handler)
    return logger


def _handle_remove_readonly(func, path, _exc_info) -> None:
    os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
    func(path)


def _merge_tree(src: Path, dst: Path) -> int:
    """src 디렉터리 내용을 dst에 덮어쓰기 병합한다(기존 읽기 전용 파일 권한 처리 포함)."""
    copied = 0
    for item in src.rglob("*"):
        rel = item.relative_to(src)
        target = dst / rel
        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue
        if item.name.startswith("."):
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            os.chmod(target, stat.S_IWRITE | stat.S_IREAD)
        shutil.copy2(item, target)
        copied += 1
    return copied


def _find_bundle_root(root: Path) -> Path | None:
    """api/ 또는 files/ 폴더를 포함하는 원천 묶음 루트를 찾는다."""
    if (root / "api").is_dir() or (root / "files").is_dir():
        return root
    children = [p for p in root.iterdir() if p.is_dir() and not p.name.startswith(".")]
    if len(children) == 1 and ((children[0] / "api").is_dir() or (children[0] / "files").is_dir()):
        return children[0]
    return None


def _is_candidate(path: Path) -> bool:
    name = path.name
    if name.startswith(".") or name.endswith(IGNORED_SUFFIXES):
        return False
    if path.is_dir():
        return _find_bundle_root(path) is not None
    if path.is_file() and path.suffix.lower() == ".zip":
        return True
    return False


def _is_settled(path: Path, settle_seconds: float) -> bool:
    now = time.time()
    latest = path.stat().st_mtime
    if path.is_dir():
        for child in path.rglob("*"):
            try:
                latest = max(latest, child.stat().st_mtime)
            except OSError:
                continue
    return (now - latest) >= settle_seconds


def stage_from_watch(item: Path, logger: logging.Logger) -> int:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)

    if item.is_dir():
        bundle = _find_bundle_root(item)
        if bundle is None:
            raise ValueError(f"api/ 또는 files/ 폴더를 찾을 수 없습니다: {item.name}")
        copied = 0
        for sub in ("api", "files"):
            if (bundle / sub).is_dir():
                copied += _merge_tree(bundle / sub, SOURCE_DIR / sub)
        logger.info("Staged %d files from directory %s -> data/source/", copied, item.name)
        return copied

    with tempfile.TemporaryDirectory(prefix="watch_zip_") as tmpdir:
        tmp_path = Path(tmpdir)
        with zipfile.ZipFile(item, "r") as zf:
            zf.extractall(tmp_path)
        bundle = _find_bundle_root(tmp_path)
        if bundle is None:
            raise ValueError(f"ZIP 안에 api/ 또는 files/ 폴더가 없습니다: {item.name}")
        copied = 0
        for sub in ("api", "files"):
            if (bundle / sub).is_dir():
                copied += _merge_tree(bundle / sub, SOURCE_DIR / sub)
        logger.info("Staged %d files from archive %s -> data/source/", copied, item.name)
        return copied


def run_pipeline(api_url: str, logger: logging.Logger) -> None:
    py = sys.executable
    steps: list[tuple[str, list[str]]] = [
        ("01_bronze", [py, "pipeline/bronze/01_bronze.py"]),
        ("02_normalize", [py, "pipeline/silver/02_normalize.py"]),
        ("03_clean", [py, "pipeline/silver/03_clean.py"]),
        ("04_gold", [py, "pipeline/gold/04_gold.py"]),
        ("05_feature_set", [py, "pipeline/ai_ready/05_feature_set.py"]),
        ("load_gold", [py, "scripts/load_postgres.py", "--stage", "gold"]),
        ("05_train", [py, "pipeline/ai_ready/05_train.py"]),
        ("load_ai_ready", [py, "scripts/load_postgres.py", "--stage", "ai_ready"]),
    ]
    for name, cmd in steps:
        t0 = time.perf_counter()
        logger.info("Step [%s] start", name)
        res = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True)
        if res.returncode != 0:
            tail = (res.stderr or res.stdout or "").strip()[-1500:]
            raise RuntimeError(f"Step [{name}] failed (exit={res.returncode}):\n{tail}")
        logger.info("Step [%s] done (%.2fs)", name, time.perf_counter() - t0)

    if api_url:
        refresh_url = f"{api_url.rstrip('/')}/api/dashboard/bootstrap?refresh=true"
        try:
            with urllib.request.urlopen(refresh_url, timeout=60) as resp:
                logger.info("Refreshed backend cache: HTTP %d (%s)", resp.status, refresh_url)
        except Exception as exc:
            logger.warning("Backend cache refresh skipped/failed (%s): %s", refresh_url, exc)


def archive_item(item: Path, dest_root: Path) -> Path:
    dest_root.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target = dest_root / f"{stamp}__{item.name}"
    shutil.move(str(item), str(target))
    return target


def scan_once(
    watch_dir: Path,
    api_url: str,
    settle_seconds: float,
    logger: logging.Logger,
) -> int:
    watch_dir.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)

    candidates = sorted(p for p in watch_dir.iterdir() if _is_candidate(p))
    processed_count = 0

    for item in candidates:
        if not _is_settled(item, settle_seconds):
            logger.info("Waiting for item to settle: %s", item.name)
            continue

        started = time.perf_counter()
        logger.info("Detected new source batch: %s", item.name)
        try:
            stage_from_watch(item, logger)
            run_pipeline(api_url, logger)
            archived = archive_item(item, PROCESSED_DIR)
            logger.info(
                "Batch succeeded in %.1fs -> archived to %s",
                time.perf_counter() - started,
                archived.relative_to(ROOT_DIR),
            )
            processed_count += 1
        except Exception as exc:
            logger.error("Batch failed (%s): %s", item.name, exc)
            try:
                quarantined = archive_item(item, QUARANTINE_DIR)
                logger.error("Quarantined failed batch -> %s", quarantined.relative_to(ROOT_DIR))
            except Exception as move_exc:
                logger.error("Failed to quarantine %s: %s", item.name, move_exc)

    return processed_count


def main() -> int:
    in_docker = Path("/.dockerenv").exists()
    default_api = os.getenv("BACKEND_URL", "http://backend:8000" if in_docker else "http://localhost:8000")
    default_interval = int(os.getenv("WATCH_POLL_SECONDS", "10"))
    default_settle = float(os.getenv("WATCH_SETTLE_SECONDS", "2"))

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--watch-dir", type=Path, default=Path(os.getenv("WATCH_DIR", str(WATCH_DIR))))
    parser.add_argument("--interval", type=int, default=default_interval, help="폴링 간격(초)")
    parser.add_argument("--settle-seconds", type=float, default=default_settle, help="복사 완료 대기 시간(초)")
    parser.add_argument("--api-url", default=default_api, help="완료 후 캐시 갱신할 FastAPI URL")
    parser.add_argument("--once", action="store_true", help="1회만 스캔 후 종료")
    args = parser.parse_args()

    logger = setup_logger()
    stop = False

    def _handle_stop(signum, _frame):
        nonlocal stop
        logger.info("Received signal %s, shutting down watcher...", signum)
        stop = True

    signal.signal(signal.SIGTERM, _handle_stop)
    signal.signal(signal.SIGINT, _handle_stop)

    logger.info(
        "Pipeline watcher started: watch_dir=%s, interval=%ds, api_url=%s",
        args.watch_dir,
        args.interval,
        args.api_url,
    )

    while not stop:
        scan_once(args.watch_dir, args.api_url, args.settle_seconds, logger)
        if args.once:
            break
        for _ in range(args.interval):
            if stop:
                break
            time.sleep(1)

    logger.info("Pipeline watcher stopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
