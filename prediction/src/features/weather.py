"""Weather feature extraction from OpenWeatherMap data in realtime_signals.

Features 44-45 in the feature matrix.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime

from src.db import query

logger = logging.getLogger(__name__)


def _get_latest_weather() -> dict | None:
    """Get the most recent non-expired weather signal."""
    rows = query(
        """SELECT value_json FROM realtime_signals
           WHERE signal_type = 'weather'
             AND expires_at > datetime('now')
           ORDER BY fetched_at DESC LIMIT 1"""
    )
    if rows:
        return json.loads(rows[0]["value_json"])
    return None


def compute(spot: dict, timestamp: datetime) -> dict:
    """Compute weather features.

    Returns NaN when no real-time weather data is available.
    """
    nan = float("nan")
    weather = _get_latest_weather()

    if not weather:
        return {
            "is_raining": nan,
            "temperature_f": nan,
        }

    return {
        "is_raining": int(weather.get("is_raining", False)),
        "temperature_f": weather.get("temperature_f", nan),
    }


FEATURE_NAMES = ["is_raining", "temperature_f"]
