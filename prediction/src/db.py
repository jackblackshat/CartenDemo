"""SQLite schema and helpers for the prediction engine.

Reuses patterns from sf-free-parking/src/database.py. Adds new tables for
meter transactions, occupancy, zone classifications, real-time signals,
garages, and crowd reports to the same sf_parking.db database.
"""

from __future__ import annotations

import sqlite3
import logging
from pathlib import Path

from src.config import db_path

logger = logging.getLogger(__name__)

# New tables added by prediction engine (existing sf-free-parking tables untouched)
_PREDICTION_SCHEMA = """
-- Raw meter transactions (36 months, ~50-100M rows)
CREATE TABLE IF NOT EXISTS meter_transactions (
    txn_id          INTEGER PRIMARY KEY,
    meter_post_id   TEXT NOT NULL,
    session_start   TEXT NOT NULL,
    session_end     TEXT,
    duration_min    REAL,
    payment_cents   INTEGER,
    UNIQUE(meter_post_id, session_start)
);
CREATE INDEX IF NOT EXISTS idx_txn_meter ON meter_transactions(meter_post_id);
CREATE INDEX IF NOT EXISTS idx_txn_start ON meter_transactions(session_start);

-- Pre-computed hourly patterns (derived from transactions)
CREATE TABLE IF NOT EXISTS meter_occupancy_hourly (
    meter_post_id   TEXT NOT NULL,
    day_of_week     INTEGER NOT NULL,
    hour            INTEGER NOT NULL,
    month           INTEGER,
    occupancy_rate  REAL NOT NULL,
    avg_duration    REAL,
    turnover_rate   REAL,
    sample_count    INTEGER NOT NULL,
    PRIMARY KEY (meter_post_id, day_of_week, hour, month)
);

-- Zone classification per spot
CREATE TABLE IF NOT EXISTS zone_classifications (
    spot_id         INTEGER PRIMARY KEY,
    zone_type       TEXT NOT NULL,
    confidence      REAL,
    classified_by   TEXT
);

-- Real-time signal cache
CREATE TABLE IF NOT EXISTS realtime_signals (
    signal_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_type     TEXT NOT NULL,
    lat             REAL,
    lng             REAL,
    neighborhood    TEXT,
    value_json      TEXT NOT NULL,
    fetched_at      TEXT NOT NULL,
    expires_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rt_type_expires ON realtime_signals(signal_type, expires_at);

-- Garage data
CREATE TABLE IF NOT EXISTS garages (
    garage_id       TEXT PRIMARY KEY,
    name            TEXT,
    lat             REAL,
    lng             REAL,
    total_spaces    INTEGER,
    hourly_rate     REAL,
    source          TEXT
);
CREATE TABLE IF NOT EXISTS garage_availability (
    garage_id       TEXT NOT NULL,
    timestamp       TEXT NOT NULL,
    available_spaces INTEGER,
    PRIMARY KEY (garage_id, timestamp)
);

-- Crowd reports
CREATE TABLE IF NOT EXISTS crowd_reports (
    report_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT,
    spot_id         INTEGER,
    lat             REAL,
    lng             REAL,
    report_type     TEXT,
    reported_at     TEXT NOT NULL,
    confidence      REAL
);
"""


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection with WAL mode and foreign keys."""
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_prediction_tables():
    """Create prediction-engine tables (idempotent)."""
    conn = get_connection()
    conn.executescript(_PREDICTION_SCHEMA)
    conn.commit()
    conn.close()
    logger.info("Prediction tables initialized at %s", db_path())


def insert_or_ignore(table: str, rows: list[dict], conn=None) -> int:
    """Insert list of dicts, ignoring duplicates. Returns count inserted."""
    if not rows:
        return 0
    own_conn = conn is None
    if own_conn:
        conn = get_connection()
    cols = list(rows[0].keys())
    placeholders = ", ".join(["?"] * len(cols))
    col_str = ", ".join(cols)
    sql = f"INSERT OR IGNORE INTO {table} ({col_str}) VALUES ({placeholders})"
    cursor = conn.executemany(sql, [tuple(r[c] for c in cols) for r in rows])
    if own_conn:
        conn.commit()
        conn.close()
    return cursor.rowcount


def insert_returning_id(table: str, row: dict, conn=None) -> int:
    """Insert a single dict and return the autoincrement ID."""
    own_conn = conn is None
    if own_conn:
        conn = get_connection()
    cols = list(row.keys())
    placeholders = ", ".join(["?"] * len(cols))
    col_str = ", ".join(cols)
    sql = f"INSERT INTO {table} ({col_str}) VALUES ({placeholders})"
    cursor = conn.execute(sql, tuple(row[c] for c in cols))
    rowid = cursor.lastrowid
    if own_conn:
        conn.commit()
        conn.close()
    return rowid


def query(sql: str, params=(), conn=None) -> list[dict]:
    """Run a SELECT and return list of dicts."""
    own_conn = conn is None
    if own_conn:
        conn = get_connection()
    rows = conn.execute(sql, params).fetchall()
    result = [dict(r) for r in rows]
    if own_conn:
        conn.close()
    return result


def execute(sql: str, params=(), conn=None) -> int:
    """Run an INSERT/UPDATE/DELETE and return rowcount."""
    own_conn = conn is None
    if own_conn:
        conn = get_connection()
    cursor = conn.execute(sql, params)
    if own_conn:
        conn.commit()
        conn.close()
    return cursor.rowcount


def count(table: str, where: str = "1=1", params=(), conn=None) -> int:
    """Return row count with optional WHERE clause."""
    own_conn = conn is None
    if own_conn:
        conn = get_connection()
    row = conn.execute(
        f"SELECT COUNT(*) as cnt FROM {table} WHERE {where}", params
    ).fetchone()
    if own_conn:
        conn.close()
    return row["cnt"]
