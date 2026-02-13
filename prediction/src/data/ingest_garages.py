"""Ingest SFpark garage availability data.

SFpark API provides real-time parking garage availability.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta

import requests

from src.db import get_connection, insert_or_ignore

logger = logging.getLogger(__name__)

_SFPARK_URL = "https://data.sfgov.org/resource/uupn-yfaw.json"


def fetch_garages() -> list[dict]:
    """Fetch garage data from SFpark/SFMTA API."""
    try:
        resp = requests.get(_SFPARK_URL, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        garages = []
        for g in data:
            lat = g.get("latitude") or g.get("lat")
            lng = g.get("longitude") or g.get("lng") or g.get("lon")
            if not lat or not lng:
                continue

            garages.append({
                "garage_id": g.get("facility_id", g.get("name", "")),
                "name": g.get("facility_name", g.get("name", "")),
                "lat": float(lat),
                "lng": float(lng),
                "total_spaces": int(g["total_spaces"]) if g.get("total_spaces") else None,
                "hourly_rate": float(g["hourly_rate"]) if g.get("hourly_rate") else None,
                "source": "sfpark",
            })
        return garages

    except Exception as e:
        logger.error("SFpark garage fetch failed: %s", e)
        return []


def ingest():
    """Fetch and store garage data."""
    garages = fetch_garages()
    if not garages:
        return

    conn = get_connection()
    try:
        # Upsert garage info
        for g in garages:
            conn.execute(
                """INSERT OR REPLACE INTO garages
                   (garage_id, name, lat, lng, total_spaces, hourly_rate, source)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (g["garage_id"], g["name"], g["lat"], g["lng"],
                 g["total_spaces"], g["hourly_rate"], g["source"]),
            )

        # Store availability snapshot
        now = datetime.now().isoformat()
        for g in garages:
            if g.get("total_spaces"):
                conn.execute(
                    """INSERT OR IGNORE INTO garage_availability
                       (garage_id, timestamp, available_spaces)
                       VALUES (?, ?, ?)""",
                    (g["garage_id"], now, g.get("total_spaces")),
                )

        conn.commit()
    finally:
        conn.close()

    logger.info("Ingested %d garages", len(garages))


if __name__ == "__main__":
    from src.config import setup_logging
    setup_logging()
    ingest()
