"""Sign/rule feature extraction from mapillary_sign_features and parking_regulations.

Features 36-40 in the feature matrix.
"""

from __future__ import annotations

import logging
from datetime import datetime

from src.db import query
from src.features.spatial import haversine

logger = logging.getLogger(__name__)

# Sign types that indicate no-parking
_NO_PARKING_TYPES = {
    "regulatory--no-parking--g1",
    "regulatory--no-parking--g2",
    "regulatory--no-stopping-or-standing--g1",
    "regulatory--no-standing-or-parking--g1",
}

# Sign types that indicate time limits
_TIME_LIMIT_TYPES = {
    "regulatory--parking-restrictions--g1",
    "regulatory--maximum-duration-parking--g1",
}


def compute(spot: dict, timestamp: datetime) -> dict:
    """Compute sign/rule features for a spot.

    Aggregates sign detections and parking regulations within 30m.

    Args:
        spot: dict with 'lat', 'lng', optionally 'time_limit', 'permit_zone', 'curb_color'
        timestamp: not used (time-invariant features)

    Returns:
        dict with feature names → values
    """
    lat = spot["lat"]
    lng = spot["lng"]

    # Check pre-computed fields from free_parking_spots
    time_limit_str = spot.get("time_limit")
    permit_zone = spot.get("permit_zone")
    curb_color = spot.get("curb_color", "none")

    has_time_limit = False
    time_limit_minutes = 0

    if time_limit_str and time_limit_str not in ("None", "none", ""):
        has_time_limit = True
        # Parse time limit string (e.g., "2 hours", "30 min", "1 hr")
        import re
        match = re.search(r'(\d+)\s*(hour|hr|min)', time_limit_str.lower())
        if match:
            val = int(match.group(1))
            unit = match.group(2)
            if "hour" in unit or "hr" in unit:
                time_limit_minutes = val * 60
            else:
                time_limit_minutes = val

    is_permit_zone = bool(permit_zone and permit_zone not in ("None", "none", ""))

    # Count no-parking signs within 30m from mapillary_sign_features
    # Use a bounding box approximation first, then haversine filter
    lat_offset = 30 / 111_320
    lng_offset = 30 / (111_320 * 0.788)  # cos(37.8°)

    sign_rows = query(
        """SELECT object_value, lat, lng FROM mapillary_sign_features
           WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?""",
        (lat - lat_offset, lat + lat_offset, lng - lng_offset, lng + lng_offset),
    )

    no_parking_count = 0
    for sign in sign_rows:
        if sign.get("lat") is None or sign.get("lng") is None:
            continue
        dist = haversine(lat, lng, sign["lat"], sign["lng"])
        if dist <= 30:
            obj_val = sign.get("object_value", "")
            if obj_val in _NO_PARKING_TYPES:
                no_parking_count += 1
            if obj_val in _TIME_LIMIT_TYPES and not has_time_limit:
                has_time_limit = True
                time_limit_minutes = 120  # Default 2hr if detected but not parsed

    # Also check parking_regulations for this area
    reg_rows = query(
        """SELECT regulation, time_limit FROM parking_regulations
           WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?""",
        (lat - lat_offset, lat + lat_offset, lng - lng_offset, lng + lng_offset),
    )

    for reg in reg_rows:
        regulation = reg.get("regulation", "")
        if regulation and "permit" in regulation.lower():
            is_permit_zone = True
        tl = reg.get("time_limit")
        if tl and not has_time_limit:
            try:
                time_limit_minutes = int(tl)
                has_time_limit = True
            except (ValueError, TypeError):
                pass

    # Normalize curb color
    if curb_color and curb_color.lower() in ("green", "white", "red", "yellow", "blue"):
        curb = curb_color.lower()
    else:
        curb = "none"

    return {
        "has_time_limit": int(has_time_limit),
        "time_limit_minutes": time_limit_minutes,
        "is_permit_zone": int(is_permit_zone),
        "curb_color": curb,
        "no_parking_signs_nearby": no_parking_count,
    }


FEATURE_NAMES = [
    "has_time_limit", "time_limit_minutes", "is_permit_zone",
    "curb_color", "no_parking_signs_nearby",
]
