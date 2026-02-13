"""Transfer layer: adjust P(occupied) from metered spots to free spots.

Model B in the architecture. Free spots are typically 15-25% more occupied
than metered spots (no payment friction discourages long parking).

Multipliers start as heuristics and become trainable as crowd reports arrive.
"""

from __future__ import annotations

import logging

from src.config import get_config

logger = logging.getLogger(__name__)


def get_multiplier(zone_type: str) -> float:
    """Get transfer multiplier for a zone type.

    Returns a value > 1.0 that increases P(occupied) for free spots.
    """
    cfg = get_config()
    multipliers = cfg.get("transfer_multipliers", {})
    return multipliers.get(zone_type, 1.20)


def adjust(p_occupied: float, zone_type: str) -> float:
    """Apply transfer adjustment from metered to free spot.

    The multiplier increases the base P(occupied) to account for
    free spots being more utilized than metered ones.

    Args:
        p_occupied: base P(occupied) from the occupancy model
        zone_type: zone classification

    Returns:
        float: adjusted P(occupied), clamped to [0.01, 0.99]
    """
    mult = get_multiplier(zone_type)

    # Apply multiplier to the occupied probability
    # Use logit space to avoid saturation near 0 or 1
    import math
    if p_occupied <= 0.01:
        p_occupied = 0.01
    if p_occupied >= 0.99:
        p_occupied = 0.99

    logit = math.log(p_occupied / (1 - p_occupied))
    # Shift logit by log(multiplier)
    adjusted_logit = logit + math.log(mult)
    adjusted = 1.0 / (1.0 + math.exp(-adjusted_logit))

    return max(0.01, min(0.99, adjusted))
