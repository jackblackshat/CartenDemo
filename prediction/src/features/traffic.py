"""Traffic feature extraction from INRIX data in realtime_signals.

Features 41-43 in the feature matrix.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime

from src.db import query
from src.features.spatial import classify_neighborhood

logger = logging.getLogger(__name__)

_CONGESTION_MAP = {"free": 0, "moderate": 1, "heavy": 2}


def _get_latest_traffic(neighborhood_key: str) -> dict | None:
    """Get the most recent non-expired traffic signal for a neighborhood."""
    rows = query(
        """SELECT value_json, fetched_at FROM realtime_signals
           WHERE signal_type = 'traffic'
             AND neighborhood = ?
             AND expires_at > datetime('now')
           ORDER BY fetched_at DESC LIMIT 1""",
        (neighborhood_key,),
    )
    if rows:
        return json.loads(rows[0]["value_json"])
    return None


def compute(spot: dict, timestamp: datetime) -> dict:
    """Compute traffic features for a spot.

    Returns NaN for features when no real-time data is available
    (XGBoost handles missing values natively).
    """
    nan = float("nan")

    # Determine neighborhood
    nbhd = spot.get("neighborhood", "")
    if not nbhd:
        name, _ = classify_neighborhood(spot["lat"], spot["lng"])
        nbhd = name or ""

    # Map display name to config key
    _name_to_key = {
        "Financial District": "financial_district",
        "SoMa": "soma",
        "Mission": "mission",
        "Fisherman's Wharf / North Beach": "north_beach",
        "Marina": "marina",
        "Civic Center / Hayes Valley": "civic_center",
        "Union Square": "union_square",
        "Chinatown": "chinatown",
        "Castro": "castro",
        "Haight-Ashbury": "haight",
    }
    nbhd_key = _name_to_key.get(nbhd, nbhd.lower().replace(" ", "_"))

    traffic = _get_latest_traffic(nbhd_key)
    if not traffic:
        return {
            "speed_ratio": nan,
            "congestion_level": nan,
            "speed_trend": nan,
        }

    return {
        "speed_ratio": traffic.get("speed_ratio", nan),
        "congestion_level": _CONGESTION_MAP.get(
            traffic.get("congestion_level", ""), nan
        ),
        "speed_trend": nan,  # Requires comparing with 30-min-ago signal
    }


FEATURE_NAMES = ["speed_ratio", "congestion_level", "speed_trend"]
