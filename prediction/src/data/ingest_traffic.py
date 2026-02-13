"""Ingest INRIX traffic speed/congestion data into realtime_signals.

Reuses INRIX credentials from CartenDemo/server/.env (APP_ID, HASH_TOKEN).
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta

import requests

from src.config import get_config, neighborhoods
from src.db import get_connection, execute

logger = logging.getLogger(__name__)

# INRIX API endpoints
_AUTH_URL = os.environ.get("AUTH_TOKEN_URL", "https://api.iq.inrix.com/auth/v1/appToken")
_SPEED_URL = "https://api.iq.inrix.com/traffic/inrix.php"

_token_cache = {"token": None, "expires": None}


def _get_token() -> str | None:
    """Get or refresh INRIX auth token."""
    if _token_cache["token"] and _token_cache["expires"] and datetime.now() < _token_cache["expires"]:
        return _token_cache["token"]

    app_id = os.environ.get("APP_ID")
    hash_token = os.environ.get("HASH_TOKEN")
    if not app_id or not hash_token:
        logger.warning("INRIX credentials not configured (APP_ID, HASH_TOKEN)")
        return None

    try:
        resp = requests.get(
            _AUTH_URL,
            params={"appId": app_id, "hashToken": hash_token},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        token = data.get("result", {}).get("token")
        if token:
            _token_cache["token"] = token
            _token_cache["expires"] = datetime.now() + timedelta(hours=1)
            return token
    except Exception as e:
        logger.error("INRIX auth failed: %s", e)

    return None


def fetch_traffic(neighborhood_key: str, nbhd: dict) -> dict | None:
    """Fetch current traffic data for a neighborhood.

    Returns dict with speed_ratio, congestion_level, speed values.
    """
    token = _get_token()
    if not token:
        return None

    lat, lng = nbhd["lat"], nbhd["lng"]
    radius_m = nbhd.get("radius_m", 500)

    try:
        # Use INRIX speed in box
        resp = requests.get(
            _SPEED_URL,
            params={
                "Action": "GetSegmentSpeedInBox",
                "Token": token,
                "Corner1": f"{lat - 0.005}|{lng - 0.005}",
                "Corner2": f"{lat + 0.005}|{lng + 0.005}",
                "Format": "json",
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        segments = data.get("result", {}).get("segmentSpeeds", [])
        if not segments:
            return None

        speeds = [s.get("speed", 0) for s in segments if s.get("speed")]
        freeflow = [s.get("average", s.get("speed", 0)) for s in segments if s.get("average") or s.get("speed")]

        if not speeds:
            return None

        avg_speed = sum(speeds) / len(speeds)
        avg_freeflow = sum(freeflow) / len(freeflow) if freeflow else avg_speed
        ratio = avg_speed / avg_freeflow if avg_freeflow > 0 else 1.0

        if ratio >= 0.8:
            congestion = "free"
        elif ratio >= 0.5:
            congestion = "moderate"
        else:
            congestion = "heavy"

        return {
            "speed_ratio": round(ratio, 3),
            "congestion_level": congestion,
            "avg_speed_mph": round(avg_speed, 1),
            "avg_freeflow_mph": round(avg_freeflow, 1),
            "segment_count": len(segments),
        }

    except Exception as e:
        logger.error("INRIX speed fetch failed for %s: %s", neighborhood_key, e)
        return None


def ingest_all():
    """Fetch traffic data for all neighborhoods and store in realtime_signals."""
    nbhds = neighborhoods()
    now = datetime.now().isoformat()
    expires = (datetime.now() + timedelta(minutes=10)).isoformat()

    conn = get_connection()
    count = 0
    try:
        for key, nbhd in nbhds.items():
            data = fetch_traffic(key, nbhd)
            if data:
                conn.execute(
                    """INSERT INTO realtime_signals
                       (signal_type, lat, lng, neighborhood, value_json, fetched_at, expires_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    ("traffic", nbhd["lat"], nbhd["lng"], key,
                     json.dumps(data), now, expires),
                )
                count += 1
        conn.commit()
    finally:
        conn.close()

    logger.info("Ingested traffic data for %d neighborhoods", count)


if __name__ == "__main__":
    from src.config import setup_logging
    setup_logging()
    ingest_all()
