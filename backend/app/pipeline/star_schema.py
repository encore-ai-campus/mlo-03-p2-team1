import json
from pathlib import Path

from psycopg import sql
from psycopg.types.json import Jsonb

from .. import db

SCHEMA = "dashboard_gold"
TABLES = (
    "dim_region", "dim_date", "dim_lcns_induty", "fact_apt_trd_qtr",
    "fact_lcns_qtr", "mart_ldong_infra_qtr",
)
PREDICTIONS = "fact_apt_prediction"


def insert_rows(cursor, table: str, columns: list[str], rows: list[dict]) -> None:
    if not rows:
        return
    statement = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
        sql.Identifier(SCHEMA, table),
        sql.SQL(", ").join(map(sql.Identifier, columns)),
        sql.SQL(", ").join([sql.Placeholder()] * len(columns)),
    )
    cursor.executemany(statement, [tuple(row[column] for column in columns) for row in rows])


def run(gold: Path, report: Path) -> None:
    from pyarrow.parquet import ParquetFile
    import pandas as pd

    from . import training

    frames = {name: gold / f"{name}.parquet" for name in TABLES}
    if missing := [name for name, path in frames.items() if not path.is_file()]:
        raise ValueError(f"Gold 산출물 누락: {', '.join(missing)}")
    ddl = Path(__file__).with_suffix(".sql").read_text(encoding="utf-8")
    with db.connect() as connection, connection.cursor() as cursor:
        cursor.execute("SELECT pg_advisory_xact_lock(19721795)")
        cursor.execute(ddl)
        had_predictions = cursor.execute(
            "SELECT EXISTS (SELECT 1 FROM dashboard_gold.fact_apt_prediction)"
        ).fetchone()[0]
        for name in reversed((*TABLES, PREDICTIONS)):
            cursor.execute(sql.SQL("DELETE FROM {}").format(sql.Identifier(SCHEMA, name)))
        for name, path in frames.items():
            with ParquetFile(path) as source:
                columns = source.schema_arrow.names
                for batch in source.iter_batches(batch_size=5000):
                    rows = batch.to_pylist()
                    if "license_metrics" in columns:
                        for row in rows:
                            row["license_metrics"] = Jsonb(json.loads(row["license_metrics"]))
                    insert_rows(cursor, name, columns, rows)

        cursor.execute("""
            SELECT ldong_cd, yq, price_per_sqm_won, actual_growth_pct, trade_count
            FROM dashboard_gold.mart_ldong_infra_qtr
            ORDER BY yq, ldong_cd
        """)
        market = pd.DataFrame(cursor.fetchall(), columns=[column.name for column in cursor.description])
        predictions, summary = training.fit(market)
        if predictions.empty and had_predictions:
            raise ValueError("학습 입력 부족으로 기존 예측을 포함한 DB 스냅샷을 유지합니다")
        insert_rows(cursor, PREDICTIONS, list(predictions.columns), predictions.to_dict("records"))

    training.write_report(report, summary, source="postgresql")
