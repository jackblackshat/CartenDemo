"""Exponential time decay: predictions drift toward 0.5 as time passes.

half_life = 60 / turnover_rate  (minutes)
decay_factor = exp(-0.693 × elapsed_minutes / half_life)
p_current = 0.5 + (p_original - 0.5) × decay_factor

Stale when decay_factor < 0.3 → prediction reverts toward 0.5.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta

_LN2 = 0.693147


def half_life_minutes(turnover_rate: float) -> float:
    """Compute time-decay half-life from turnover rate.

    Args:
        turnover_rate: expected sessions/hour (>= 0.1)

    Returns:
        float: half-life in minutes
    """
    return 60.0 / max(0.1, turnover_rate)


def decay_factor(elapsed_minutes: float, turnover_rate: float) -> float:
    """Compute decay factor for a given elapsed time.

    Args:
        elapsed_minutes: time since prediction was made
        turnover_rate: sessions/hour for this spot

    Returns:
        float: decay factor in [0, 1]
    """
    hl = half_life_minutes(turnover_rate)
    return math.exp(-_LN2 * elapsed_minutes / hl)


def apply_decay(p_original: float, elapsed_minutes: float, turnover_rate: float) -> float:
    """Apply time decay to a prediction.

    Decayed prediction drifts toward 0.5 (maximum uncertainty).

    Args:
        p_original: original P(free) prediction
        elapsed_minutes: time since prediction
        turnover_rate: sessions/hour

    Returns:
        float: decayed P(free)
    """
    factor = decay_factor(elapsed_minutes, turnover_rate)
    return 0.5 + (p_original - 0.5) * factor


def is_stale(elapsed_minutes: float, turnover_rate: float) -> bool:
    """Check if a prediction is stale (decay_factor < 0.3)."""
    return decay_factor(elapsed_minutes, turnover_rate) < 0.3


def future_confidence(
    p_free: float, turnover_rate: float
) -> dict[str, float]:
    """Compute future P(free) at standard intervals.

    Matches the SpotRecommendation.futureConfidence type shape:
    { '1min', '3min', '5min', '10min' }

    Args:
        p_free: current P(free)
        turnover_rate: sessions/hour

    Returns:
        dict with time keys → decayed P(free) values
    """
    return {
        "1min": round(apply_decay(p_free, 1, turnover_rate), 3),
        "3min": round(apply_decay(p_free, 3, turnover_rate), 3),
        "5min": round(apply_decay(p_free, 5, turnover_rate), 3),
        "10min": round(apply_decay(p_free, 10, turnover_rate), 3),
    }


def time_decay_info(p_free: float, turnover_rate: float) -> dict:
    """Full time decay information for a prediction.

    Returns:
        dict with half_life, valid_until offset, and future confidence
    """
    hl = half_life_minutes(turnover_rate)

    # valid_until: minutes until decay_factor drops below 0.3
    # 0.3 = exp(-ln2 × t / hl) → t = -hl × ln(0.3) / ln2
    valid_minutes = hl * (-math.log(0.3) / _LN2)

    return {
        "half_life_minutes": round(hl, 1),
        "valid_for_minutes": round(valid_minutes, 1),
        "future_confidence": future_confidence(p_free, turnover_rate),
    }
