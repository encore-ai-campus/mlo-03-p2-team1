"""Gold / AI Ready Parquet 산출물을 PostgreSQL(gold / ai_ready 스키마)에 적재한다.

사용법:
  python pipeline_container/load_postgres.py --stage gold
  python pipeline_container/load_postgres.py --stage ai_ready
  python pipeline_container/load_postgres.py --stage all

참고:
- 루트 .env 의 DBHOST/DBPORT/DBNAME/DBID/DBPW/DBSSLMODE 를 사용한다.
- Docker Compose 기본값(DBHOST=postgres)으로 호스트에서 직접 실행할 때는
  자동으로 127.0.0.1 로 연결한다 (--host 로 수동 지정 가능).
"""
from __future__ import annotations

import argparse
import io
import os
import sys
import time
from pathlib import Path

import pandas as pd
import psycopg
from dotenv import load_dotenv
from psycopg import sql

ROOT_DIR = Path(__file__).resolve().parents[1]
GOLD_DIR = ROOT_DIR / "data" / "gold"
AI_READY_DIR = ROOT_DIR / "data" / "ai_ready"

GOLD_TABLES: list[tuple[str, str, str]] = [
    ("gold", "dim_region", "04_gold__dim_region.parquet"),
    ("gold", "dim_date", "04_gold__dim_date.parquet"),
    ("gold", "dim_lcns_induty", "04_gold__dim_lcns_induty.parquet"),
    ("gold", "fact_apt_idx_qtr", "04_gold__fact_apt_idx_qtr.parquet"),
    ("gold", "fact_apt_trd_qtr", "04_gold__fact_apt_trd_qtr.parquet"),
    ("gold", "fact_lcns_qtr", "04_gold__fact_lcns_qtr.parquet"),
    ("gold", "mart_ldong_infra_qtr", "04_gold__mart_ldong_infra_qtr.parquet"),
    ("gold", "fact_apt_trd", "04_gold__fact_apt_trd.parquet"),
]

AI_READY_TABLES: list[tuple[str, str, str]] = [
    ("ai_ready", "feature_set", "05_ai_ready__feature_set.parquet"),
    ("ai_ready", "prediction", "05_ai_ready__prediction.parquet"),
]

INT_PG_TYPES = {"smallint", "integer", "bigint"}


def resolve_host(cli_host: str | None) -> str:
    if cli_host:
        return cli_host
    env_host = os.getenv("DBHOST", "127.0.0.1").strip() or "127.0.0.1"
    in_docker = Path("/.dockerenv").exists()
    if env_host == "postgres" and not in_docker:
        return "127.0.0.1"
    return env_host


def connect_pg(host_override: str | None, port_override: int | None) -> psycopg.Connection:
    load_dotenv(ROOT_DIR / ".env", override=False)
    host = resolve_host(host_override)
    port = port_override or int(os.getenv("DBPORT", "5432"))
    dbname = os.getenv("DBNAME", "web")
    user = os.getenv("DBID", "web")
    password = os.getenv("DBPW", "localdev")
    sslmode = os.getenv("DBSSLMODE", "disable")
    return psycopg.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        sslmode=sslmode,
        connect_timeout=10,
    )


def get_table_column_types(cur: psycopg.Cursor, schema: str, table: str) -> dict[str, str]:
    cur.execute(
        """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s
        ORDER BY ordinal_position
        """,
        (schema, table),
    )
    rows = cur.fetchall()
    if not rows:
        raise RuntimeError(
            f"테이블 {schema}.{table} 이 존재하지 않습니다. "
            "docker/postgres/init/01_schema.sql 이 적용되었는지 확인하세요."
        )
    return {name: dtype for name, dtype in rows}


def load_table(cur: psycopg.Cursor, schema: str, table: str, parquet_path: Path) -> int:
    if not parquet_path.is_file():
        raise FileNotFoundError(f"Parquet 파일이 없습니다: {parquet_path}")

    col_types = get_table_column_types(cur, schema, table)
    df = pd.read_parquet(parquet_path)

    # DB 스키마에 정의된 컬럼 순서대로 정렬
    missing = [c for c in col_types if c not in df.columns]
    if missing:
        raise ValueError(f"{schema}.{table} 에 필요한 컬럼이 Parquet에 없습니다: {missing}")
    df = df[list(col_types.keys())].copy()

    # 정수형 컬럼에 NaN 때문에 .0 이 붙지 않도록 nullable Int64 로 정리
    for col, pg_type in col_types.items():
        if pg_type in INT_PG_TYPES:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    buf = io.StringIO()
    df.to_csv(buf, index=False, header=False, na_rep="")
    csv_payload = buf.getvalue()

    cur.execute(sql.SQL("TRUNCATE TABLE {}.{}").format(sql.Identifier(schema), sql.Identifier(table)))
    copy_stmt = sql.SQL("COPY {}.{} ({}) FROM STDIN WITH (FORMAT csv, NULL '')").format(
        sql.Identifier(schema),
        sql.Identifier(table),
        sql.SQL(", ").join(sql.Identifier(c) for c in col_types.keys()),
    )
    with cur.copy(copy_stmt) as copy:
        copy.write(csv_payload)

    return len(df)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--stage", choices=("gold", "ai_ready", "all"), default="all", help="적재 대상 스키마")
    parser.add_argument("--gold-dir", type=Path, default=GOLD_DIR, help="Gold Parquet 폴더 경로")
    parser.add_argument("--ai-ready-dir", type=Path, default=AI_READY_DIR, help="AI Ready Parquet 폴더 경로")
    parser.add_argument("--skip-fact-trd", action="store_true", help="대용량 gold.fact_apt_trd 적재 생략")
    parser.add_argument("--host", type=str, default=None, help="PostgreSQL 호스트 수동 지정")
    parser.add_argument("--port", type=int, default=None, help="PostgreSQL 포트 수동 지정")
    args = parser.parse_args()

    targets: list[tuple[str, str, Path]] = []
    if args.stage in ("gold", "all"):
        for schema, table, filename in GOLD_TABLES:
            if args.skip_fact_trd and table == "fact_apt_trd":
                continue
            targets.append((schema, table, args.gold_dir / filename))
    if args.stage in ("ai_ready", "all"):
        for schema, table, filename in AI_READY_TABLES:
            targets.append((schema, table, args.ai_ready_dir / filename))

    started = time.perf_counter()
    with connect_pg(args.host, args.port) as conn:
        info = conn.info
        print(f"[DB] Connected: {info.user}@{info.host}:{info.port}/{info.dbname}")
        total_rows = 0
        with conn.cursor() as cur:
            for schema, table, parquet_path in targets:
                t0 = time.perf_counter()
                rows = load_table(cur, schema, table, parquet_path)
                total_rows += rows
                print(f"  - {schema}.{table:<24s} {rows:>9,d} rows ({time.perf_counter() - t0:.2f}s)")
        conn.commit()
    print(f"[DB] Done: {len(targets)} tables, {total_rows:,d} rows in {time.perf_counter() - started:.2f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
