import asyncio
import csv
import logging
import os
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Event

import psycopg
from fastapi import FastAPI
from psycopg.types.json import Jsonb

from . import db
from .pipeline import feed

ROOT = Path(__file__).resolve().parents[2]
WATCH_DIR = ROOT / "data" / "watch"
LOG_PATH = ROOT / "report" / "watch.log"
POLL_SECONDS = 60
CSV_COLUMNS = ("aptNm", "dealYear", "dealAmount")
logger = logging.getLogger(__name__)


def load_csv(path: Path, destination: Path) -> int:
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream, strict=True)
        if sorted(reader.fieldnames or []) != sorted(CSV_COLUMNS):
            raise ValueError("Expected CSV columns aptNm, dealYear, dealAmount")
        rows = list(reader)
    if not rows or any(None in row or None in row.values() for row in rows):
        raise ValueError("Expected at least one CSV row with three fields")

    relative_path = destination.relative_to(ROOT).as_posix()
    row_count = len(rows)
    with db.connect() as connection, connection.cursor() as cursor:
        (file_id,) = cursor.execute(
            """INSERT INTO public.bronze_file
                   (relative_path, target_table, expected_rows, parquet_schema,
                    data_status, loaded_rows, loaded_at)
               VALUES (%s, 'apt_trade', %s, %s, 'loaded', %s, CURRENT_TIMESTAMP)
               RETURNING file_id""",
            (relative_path, row_count, Jsonb([]), row_count),
        ).fetchone()
        records = (
            (file_id, number, row["aptNm"], row["dealYear"], row["dealAmount"])
            for number, row in enumerate(rows, start=1)
        )
        cursor.executemany(
            """INSERT INTO public.apt_trade
                   (_file_id, _file_row_number, "aptNm", "dealYear", "dealAmount")
               VALUES (%s, %s, %s, %s, %s)""",
            records,
        )
    return row_count


def scan(watch_dir: Path = WATCH_DIR) -> None:
    watch_dir.mkdir(parents=True, exist_ok=True)
    processed = watch_dir.with_name("processed")
    processed.mkdir(exist_ok=True)
    for path in sorted(path for path in watch_dir.glob("*.csv") if path.is_file()):
        destination = processed / path.name
        if destination.exists():
            logger.error("File already exists in processed: %s", path.name)
            continue
        logger.info("Detected %s", path.name)
        try:
            row_count = load_csv(path, destination)
        except psycopg.Error as error:
            logger.error("Database load failed for %s (%s)", path.name, error.sqlstate or type(error).__name__)
            continue
        except (OSError, ValueError, csv.Error) as error:
            logger.error("CSV load failed for %s: %s", path.name, error)
            continue

        try:
            path.rename(destination)
        except OSError as error:
            logger.error("Committed %s (%d rows) but could not archive it: %s", path.name, row_count, error)
            continue
        logger.info("Loaded %s (%d rows) and moved it to processed", path.name, row_count)


def poll(stop: Event, pipeline_mode: bool) -> None:
    while not stop.is_set():
        try:
            if pipeline_mode:
                logger.info("apt_trade pipeline status=%s", feed.scan())
            else:
                scan(WATCH_DIR)
        except (OSError, ValueError, subprocess.CalledProcessError, psycopg.Error):
            logger.exception("Watch scan failed")
        stop.wait(POLL_SECONDS)


@asynccontextmanager
async def watch_lifespan(_app: FastAPI):
    pipeline_mode = os.getenv("APT_PIPELINE_WATCH") == "1"
    log_path = feed.WORKSPACE / "report" / "watch.log" if pipeline_mode else LOG_PATH
    log_path.parent.mkdir(parents=True, exist_ok=True)
    handler = logging.FileHandler(log_path, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    previous_level = logger.level
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)
    stop = Event()
    target = "apt_trade API completion markers" if pipeline_mode else WATCH_DIR
    logger.info("Watching %s every %d seconds", target, POLL_SECONDS)
    task = asyncio.create_task(asyncio.to_thread(poll, stop, pipeline_mode))
    try:
        yield
    finally:
        stop.set()
        try:
            await task
        finally:
            logger.info("Watch stopped")
            logger.removeHandler(handler)
            logger.setLevel(previous_level)
            handler.close()
