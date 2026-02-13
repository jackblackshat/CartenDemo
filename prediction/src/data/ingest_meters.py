"""Ingest 36-month meter transaction CSV into meter_transactions table,
then aggregate into meter_occupancy_hourly.

Usage:
    python -m src.data.ingest_meters --csv path/to/transactions.csv

CSV expected columns (SFMTA format):
    POST_ID, SESSION_START_DT, SESSION_END_DT, DURATION_MINUTES, GROSS_PAID_AMT
"""

from __future__ import annotations

import argparse
import csv
import logging
from datetime import datetime
from pathlib import Path

from tqdm import tqdm

from src.config import setup_logging
from src.db import get_connection, init_prediction_tables, insert_or_ignore, query, count

logger = logging.getLogger(__name__)

CHUNK_SIZE = 50_000  # rows per batch insert


def _parse_row(row: dict) -> dict | None:
    """Convert a CSV row to a meter_transactions dict."""
    post_id = row.get("POST_ID", "").strip()
    start = row.get("SESSION_START_DT", "").strip()
    if not post_id or not start:
        return None

    end = row.get("SESSION_END_DT", "").strip() or None
    duration = row.get("DURATION_MINUTES", "").strip()
    paid = row.get("GROSS_PAID_AMT", "").strip()

    return {
        "meter_post_id": post_id,
        "session_start": start,
        "session_end": end,
        "duration_min": float(duration) if duration else None,
        "payment_cents": int(float(paid) * 100) if paid else None,
    }


def ingest_csv(csv_path: str):
    """Chunked import of meter transaction CSV."""
    path = Path(csv_path)
    if not path.exists():
        logger.error("CSV not found: %s", csv_path)
        return

    init_prediction_tables()
    logger.info("Ingesting meter transactions from %s", csv_path)

    total = 0
    inserted = 0
    chunk = []

    conn = get_connection()
    try:
        with open(path, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in tqdm(reader, desc="Ingesting meters"):
                parsed = _parse_row(row)
                if parsed is None:
                    continue
                chunk.append(parsed)
                total += 1

                if len(chunk) >= CHUNK_SIZE:
                    inserted += insert_or_ignore("meter_transactions", chunk, conn)
                    conn.commit()
                    chunk = []

            # Final chunk
            if chunk:
                inserted += insert_or_ignore("meter_transactions", chunk, conn)
                conn.commit()
    finally:
        conn.close()

    logger.info("Ingested %d/%d transactions (%d new)", inserted, total, inserted)


def aggregate_hourly():
    """Compute meter_occupancy_hourly from meter_transactions.

    For each meter × day_of_week × hour (× optional month):
    - occupancy_rate: fraction of 15-min slots with an active session
    - avg_duration: mean session duration in minutes
    - turnover_rate: new sessions starting per hour
    - sample_count: number of data points
    """
    init_prediction_tables()
    logger.info("Aggregating hourly occupancy patterns...")

    conn = get_connection()
    try:
        # Clear existing aggregations for fresh recompute
        conn.execute("DELETE FROM meter_occupancy_hourly")

        # Aggregate by meter × dow × hour × month
        conn.execute("""
            INSERT INTO meter_occupancy_hourly
                (meter_post_id, day_of_week, hour, month,
                 occupancy_rate, avg_duration, turnover_rate, sample_count)
            SELECT
                meter_post_id,
                CAST(strftime('%w', session_start) AS INTEGER) AS day_of_week,
                CAST(strftime('%H', session_start) AS INTEGER) AS hour,
                CAST(strftime('%m', session_start) AS INTEGER) AS month,
                -- occupancy_rate: avg sessions active per 15-min slot in this hour
                -- approximate: if avg duration > 60, rate near 1.0
                MIN(1.0, AVG(COALESCE(duration_min, 30.0)) / 60.0) AS occupancy_rate,
                AVG(COALESCE(duration_min, 30.0)) AS avg_duration,
                -- turnover: count of new sessions / count of distinct dates in this bucket
                CAST(COUNT(*) AS REAL) / MAX(1, COUNT(DISTINCT date(session_start)))
                    AS turnover_rate,
                COUNT(*) AS sample_count
            FROM meter_transactions
            GROUP BY meter_post_id,
                     CAST(strftime('%w', session_start) AS INTEGER),
                     CAST(strftime('%H', session_start) AS INTEGER),
                     CAST(strftime('%m', session_start) AS INTEGER)
        """)

        # Also insert all-month aggregates (month = NULL)
        conn.execute("""
            INSERT INTO meter_occupancy_hourly
                (meter_post_id, day_of_week, hour, month,
                 occupancy_rate, avg_duration, turnover_rate, sample_count)
            SELECT
                meter_post_id,
                day_of_week,
                hour,
                NULL AS month,
                AVG(occupancy_rate) AS occupancy_rate,
                AVG(avg_duration) AS avg_duration,
                AVG(turnover_rate) AS turnover_rate,
                SUM(sample_count) AS sample_count
            FROM meter_occupancy_hourly
            WHERE month IS NOT NULL
            GROUP BY meter_post_id, day_of_week, hour
        """)

        conn.commit()
        row_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM meter_occupancy_hourly"
        ).fetchone()["cnt"]
        logger.info("meter_occupancy_hourly: %d rows", row_count)
    finally:
        conn.close()


def main():
    setup_logging()
    parser = argparse.ArgumentParser(description="Ingest meter transactions")
    parser.add_argument("--csv", help="Path to meter transactions CSV")
    parser.add_argument(
        "--aggregate-only", action="store_true",
        help="Skip CSV import, only recompute hourly aggregates"
    )
    args = parser.parse_args()

    if not args.aggregate_only:
        if not args.csv:
            logger.error("--csv required unless --aggregate-only")
            return
        ingest_csv(args.csv)

    aggregate_hourly()


if __name__ == "__main__":
    main()
