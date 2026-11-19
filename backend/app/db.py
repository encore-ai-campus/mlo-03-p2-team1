import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def connect() -> psycopg.Connection:
    return psycopg.connect(
        host=os.getenv("DBHOST", "100.100.100.60"),
        port=os.getenv("DBPORT", "5432"),
        dbname=os.getenv("DBNAME", "web"),
        user=os.getenv("DBID", "web"),
        password=os.getenv("DBPW", ""),
        sslmode=os.getenv("DBSSLMODE", "require"),
        connect_timeout=5,
    )
