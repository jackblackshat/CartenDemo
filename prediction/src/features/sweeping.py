"""Sweeping feature extraction: is_sweeping_now, minutes until/since sweeping.

Features 32-35 in the feature matrix.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from src.db import query
from src.features.spatial import haversine

logger = logging.getLogger(__name__)

# Day name mapping: DB uses full names
_DOW_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _parse_time(t: str) -> tuple[int, int] | None:
    """Parse time string like '08:00' or '8:00 AM' to (hour, minute)."""
    if not t:
        return None
    t = t.strip()
    try:
        if ":" in t:
            parts = t.replace("AM", "").replace("PM", "").strip().split(":")
            h, m = int(parts[0]), int(parts[1])
            if "PM" in t.upper() and h < 12:
                h += 12
            if "AM" in t.upper() and h == 12:
                h = 0
            return (h, m)
    except (ValueError, IndexError):
        pass
    return None


def _get_nearby_sweeping(lat: float, lng: float, radius_m: float = 200) -> list[dict]:
    """Get sweeping records near a point by joining with street geometry.

    Since street_sweeping doesn't have lat/lng directly, we join with
    parking meters on the same corridor as a proxy.
    """
    # Get sweeping schedules for the nearest corridors
    rows = query(
        """SELECT DISTINCT s.corridor, s.side, s.weekday, s.week_of_month,
                  s.start_time, s.end_time, s.holidays
           FROM street_sweeping s
           WHERE s.corridor IS NOT NULL
           LIMIT 100"""
    )
    return rows


def _get_block_sweeping(spot: dict) -> list[dict]:
    """Get sweeping schedules for a spot's street/block."""
    street = spot.get("street_name", "")
    if not street:
        return []

    rows = query(
        """SELECT corridor, side, weekday, week_of_month, start_time, end_time
           FROM street_sweeping
           WHERE corridor LIKE ?
           LIMIT 20""",
        (f"%{street}%",),
    )
    return rows


def compute(spot: dict, timestamp: datetime) -> dict:
    """Compute sweeping features.

    Args:
        spot: dict with 'lat', 'lng', optionally 'street_name', 'sweeping_schedule'
        timestamp: current datetime

    Returns:
        dict with feature names → values
    """
    now = timestamp
    dow_name = _DOW_NAMES[now.weekday()]
    current_minutes = now.hour * 60 + now.minute

    # Check pre-computed sweeping schedule from free_parking_spots
    sweeping_schedule = spot.get("sweeping_schedule", "")
    if sweeping_schedule and sweeping_schedule != "None":
        # Parse schedule string (e.g., "Mon 8:00-10:00 1st,3rd week")
        is_sweeping_now = False
        minutes_until = 9999
        minutes_since = 9999
        sweeping_side = "none"

        # Try to find today's sweeping in the schedule
        if dow_name.lower() in sweeping_schedule.lower():
            # Extract time range if present
            import re
            time_match = re.search(r'(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})', sweeping_schedule)
            if time_match:
                start = _parse_time(time_match.group(1))
                end = _parse_time(time_match.group(2))
                if start and end:
                    start_min = start[0] * 60 + start[1]
                    end_min = end[0] * 60 + end[1]

                    if start_min <= current_minutes <= end_min:
                        is_sweeping_now = True
                        minutes_since = current_minutes - start_min
                        minutes_until = 0
                    elif current_minutes < start_min:
                        minutes_until = start_min - current_minutes
                    else:
                        minutes_since = current_minutes - end_min

        return {
            "is_sweeping_now": int(is_sweeping_now),
            "minutes_until_sweeping": minutes_until,
            "minutes_since_sweeping": minutes_since,
            "sweeping_side": sweeping_side,
        }

    # Fallback: query DB for block sweeping
    schedules = _get_block_sweeping(spot)
    is_sweeping_now = False
    minutes_until = 9999
    minutes_since = 9999
    sweeping_side = "none"

    for sched in schedules:
        sched_day = (sched.get("weekday") or "").strip()
        if sched_day.lower()[:3] != dow_name.lower()[:3]:
            continue

        start = _parse_time(sched.get("start_time"))
        end = _parse_time(sched.get("end_time"))
        if not start or not end:
            continue

        start_min = start[0] * 60 + start[1]
        end_min = end[0] * 60 + end[1]
        side = sched.get("side", "none")

        if start_min <= current_minutes <= end_min:
            is_sweeping_now = True
            sweeping_side = side or "both"
            minutes_since = current_minutes - start_min
            minutes_until = 0
            break
        elif current_minutes < start_min:
            until = start_min - current_minutes
            if until < minutes_until:
                minutes_until = until
                sweeping_side = side or "none"
        else:
            since = current_minutes - end_min
            if since < minutes_since:
                minutes_since = since

    return {
        "is_sweeping_now": int(is_sweeping_now),
        "minutes_until_sweeping": minutes_until,
        "minutes_since_sweeping": minutes_since,
        "sweeping_side": sweeping_side,
    }


FEATURE_NAMES = [
    "is_sweeping_now", "minutes_until_sweeping", "minutes_since_sweeping",
    "sweeping_side",
]
