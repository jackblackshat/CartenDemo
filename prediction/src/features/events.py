"""Event feature extraction from realtime_signals.

Feature 46 in the feature matrix.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime

from src.db import query
from src.features.spatial import haversine, classify_neighborhood

logger = logging.getLogger(__name__)


def _get_latest_events(neighborhood_key: str) -> dict | None:
    """Get the most recent non-expired event signal for a neighborhood."""
    rows = query(
        """SELECT value_json FROM realtime_signals
           WHERE signal_type = 'event'
             AND neighborhood = ?
             AND expires_at > datetime('now')
           ORDER BY fetched_at DESC LIMIT 1""",
        (neighborhood_key,),
    )
    if rows:
        return json.loads(rows[0]["value_json"])
    return None


def compute(spot: dict, timestamp: datetime) -> dict:
    """Compute event features for a spot.

    Counts active events within 500m.
    """
    nan = float("nan")
    lat, lng = spot["lat"], spot["lng"]

    # Determine neighborhood key
    nbhd = spot.get("neighborhood", "")
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
    nbhd_key = _name_to_key.get(nbhd, "")
    if not nbhd_key:
        name, _ = classify_neighborhood(lat, lng)
        nbhd_key = _name_to_key.get(name or "", "")

    event_data = _get_latest_events(nbhd_key)
    if not event_data:
        return {"active_events_500m": nan}

    # Count events within 500m
    events = event_data.get("events", [])
    nearby = 0
    for ev in events:
        ev_lat = ev.get("lat", 0)
        ev_lng = ev.get("lng", 0)
        if ev_lat and ev_lng:
            dist = haversine(lat, lng, ev_lat, ev_lng)
            if dist <= 500:
                nearby += 1

    return {"active_events_500m": nearby}


FEATURE_NAMES = ["active_events_500m"]
