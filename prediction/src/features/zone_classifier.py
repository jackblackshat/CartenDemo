"""Zone classification: residential / commercial / restaurant / gym / mixed.

Feature 47 in the feature matrix. MVP uses heuristic assignment by neighborhood.
"""

from __future__ import annotations

import logging
from datetime import datetime

from src.config import get_config
from src.db import query
from src.features.spatial import classify_neighborhood

logger = logging.getLogger(__name__)

# Zone type → integer encoding for XGBoost
ZONE_TYPE_IDS = {
    "residential": 0,
    "commercial": 1,
    "restaurant": 2,
    "gym": 3,
    "mixed": 4,
}


def _neighborhood_to_zone(neighborhood_key: str) -> str:
    """Map neighborhood key to zone type using config defaults."""
    cfg = get_config()
    zone_defaults = cfg.get("zone_defaults", {})
    for zone_type, zone_cfg in zone_defaults.items():
        if neighborhood_key in zone_cfg.get("neighborhoods", []):
            return zone_type
    return "mixed"


def _neighborhood_name_to_key(name: str) -> str:
    """Convert neighborhood display name to config key."""
    mapping = {
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
    return mapping.get(name, "")


def classify_zone(spot: dict) -> str:
    """Determine zone type for a spot.

    Priority:
    1. DB zone_classifications table (if exists)
    2. Heuristic by neighborhood
    """
    spot_id = spot.get("spot_id")
    if spot_id is not None:
        rows = query(
            "SELECT zone_type FROM zone_classifications WHERE spot_id = ?",
            (spot_id,),
        )
        if rows:
            return rows[0]["zone_type"]

    # Heuristic: neighborhood → zone type
    nbhd_name = spot.get("neighborhood")
    if nbhd_name:
        key = _neighborhood_name_to_key(nbhd_name)
        if key:
            return _neighborhood_to_zone(key)

    # Fallback: classify by coordinates
    lat = spot.get("lat")
    lng = spot.get("lng")
    if lat is not None and lng is not None:
        name, _ = classify_neighborhood(lat, lng)
        if name:
            key = _neighborhood_name_to_key(name)
            if key:
                return _neighborhood_to_zone(key)

    return "mixed"


def base_churn(zone_type: str) -> float:
    """Get base churn rate (turnovers/hour) for a zone type."""
    cfg = get_config()
    zone_defaults = cfg.get("zone_defaults", {})
    return zone_defaults.get(zone_type, {}).get("base_churn", 1.0)


def compute(spot: dict, timestamp: datetime) -> dict:
    """Compute zone classification features.

    Args:
        spot: dict with spot data
        timestamp: not used (time-invariant)

    Returns:
        dict with zone_type feature
    """
    zone = classify_zone(spot)
    return {
        "zone_type": zone,
    }


FEATURE_NAMES = ["zone_type"]
