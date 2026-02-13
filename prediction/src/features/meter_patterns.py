"""Meter pattern features: occupancy + turnover from 36-month transaction data.

Features 17-23 in the feature matrix. These are the most important features —
they provide the ground truth signal from real occupancy data.
"""

from __future__ import annotations

import logging
from datetime import datetime

from src.db import query
from src.features.spatial import get_meter_index

logger = logging.getLogger(__name__)


def _get_occupancy(meter_post_id: str, dow: int, hour: int, month: int | None = None) -> dict | None:
    """Look up pre-computed occupancy for a meter at a specific time.

    Tries month-specific first, falls back to all-month aggregate.
    """
    if month is not None:
        rows = query(
            """SELECT occupancy_rate, avg_duration, turnover_rate, sample_count
               FROM meter_occupancy_hourly
               WHERE meter_post_id = ? AND day_of_week = ? AND hour = ? AND month = ?""",
            (meter_post_id, dow, hour, month),
        )
        if rows:
            return rows[0]

    # Fall back to all-month aggregate
    rows = query(
        """SELECT occupancy_rate, avg_duration, turnover_rate, sample_count
           FROM meter_occupancy_hourly
           WHERE meter_post_id = ? AND day_of_week = ? AND hour = ? AND month IS NULL""",
        (meter_post_id, dow, hour),
    )
    return rows[0] if rows else None


def _get_prior_hour_occupancy(meter_post_id: str, dow: int, hour: int) -> float | None:
    """Get occupancy rate for the prior hour (for trend calculation)."""
    prior_hour = (hour - 1) % 24
    prior_dow = dow if hour > 0 else (dow - 1) % 7
    rows = query(
        """SELECT occupancy_rate FROM meter_occupancy_hourly
           WHERE meter_post_id = ? AND day_of_week = ? AND hour = ? AND month IS NULL""",
        (meter_post_id, prior_dow, prior_hour),
    )
    return rows[0]["occupancy_rate"] if rows else None


def compute(spot: dict, timestamp: datetime) -> dict:
    """Compute meter pattern features for a spot at a given time.

    Args:
        spot: dict with 'lat', 'lng'
        timestamp: datetime for time-dependent lookup

    Returns:
        dict with feature names → values (NaN for missing data)
    """
    lat = spot["lat"]
    lng = spot["lng"]
    dow = (timestamp.weekday() + 1) % 7  # SQLite: 0=Sun, Python: 0=Mon → convert
    hour = timestamp.hour
    month = timestamp.month

    meter_index = get_meter_index()
    nearest = meter_index.nearest(lat, lng, k=3)

    nan = float("nan")

    if not nearest:
        return {
            "nearest_meter_occupancy": nan,
            "nearest_3_meter_avg": nan,
            "block_avg_occupancy": nan,
            "turnover_rate": nan,
            "avg_session_duration": nan,
            "occupancy_trend": nan,
            "meter_sample_count": 0,
        }

    # Nearest meter occupancy
    nearest_id = nearest[0][0]
    nearest_occ = _get_occupancy(nearest_id, dow, hour, month)

    if nearest_occ:
        nearest_occupancy = nearest_occ["occupancy_rate"]
        turnover = nearest_occ["turnover_rate"]
        avg_duration = nearest_occ["avg_duration"]
        sample_count = nearest_occ["sample_count"]
    else:
        nearest_occupancy = nan
        turnover = nan
        avg_duration = nan
        sample_count = 0

    # Average of 3 nearest meters
    occ_values = []
    for mid, _ in nearest:
        occ = _get_occupancy(mid, dow, hour, month)
        if occ:
            occ_values.append(occ["occupancy_rate"])
    avg_3 = sum(occ_values) / len(occ_values) if occ_values else nan

    # Block average: all meters within ~100m (same block approximation)
    # Reuse nearest with more meters if available
    block_meters = meter_index.nearest(lat, lng, k=10)
    block_occ_values = []
    for mid, dist in block_meters:
        if dist > 100:
            break
        occ = _get_occupancy(mid, dow, hour, month)
        if occ:
            block_occ_values.append(occ["occupancy_rate"])
    block_avg = sum(block_occ_values) / len(block_occ_values) if block_occ_values else nan

    # Occupancy trend: delta vs prior hour
    prior = _get_prior_hour_occupancy(nearest_id, dow, hour)
    if prior is not None and nearest_occ:
        trend = nearest_occ["occupancy_rate"] - prior
    else:
        trend = nan

    return {
        "nearest_meter_occupancy": nearest_occupancy,
        "nearest_3_meter_avg": avg_3,
        "block_avg_occupancy": block_avg,
        "turnover_rate": turnover,
        "avg_session_duration": avg_duration,
        "occupancy_trend": trend,
        "meter_sample_count": sample_count,
    }


FEATURE_NAMES = [
    "nearest_meter_occupancy", "nearest_3_meter_avg", "block_avg_occupancy",
    "turnover_rate", "avg_session_duration", "occupancy_trend",
    "meter_sample_count",
]
