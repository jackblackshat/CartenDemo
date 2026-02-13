"""Multi-source confidence scoring.

confidence = 0.4 × meter_data_quality
           + 0.2 × spatial_data_quality
           + 0.2 × realtime_freshness
           + 0.2 × model_certainty

Guarantee levels:
  Guaranteed: legally certain, no restrictions
  Probable:   P(free) >= 0.7 AND confidence >= 0.6
  Possible:   P(free) >= 0.3
  Unlikely:   P(free) < 0.3
"""

from __future__ import annotations

import logging
from datetime import datetime

from src.config import get_config

logger = logging.getLogger(__name__)


def meter_data_quality(sample_count: int) -> float:
    """Quality score based on volume of meter data backing the prediction."""
    cfg = get_config()
    threshold = cfg["confidence"]["meter_sample_threshold"]
    return min(1.0, sample_count / threshold)


def spatial_data_quality(
    has_sign_feature: bool = False,
    has_curb_detection: bool = False,
    has_sfmta_official: bool = False,
) -> float:
    """Quality score based on available spatial/regulatory data."""
    score = 0.0
    if has_sign_feature:
        score += 0.4
    if has_curb_detection:
        score += 0.3
    if has_sfmta_official:
        score += 0.3
    return score


def realtime_freshness(signal_age_minutes: float | None) -> float:
    """Quality score based on how fresh real-time signals are.

    1.0 if < 5 min, linear decay to 0.0 at 60 min.
    """
    if signal_age_minutes is None:
        return 0.0
    cfg = get_config()
    fresh = cfg["confidence"]["realtime_fresh_minutes"]
    stale = cfg["confidence"]["realtime_stale_minutes"]
    if signal_age_minutes <= fresh:
        return 1.0
    if signal_age_minutes >= stale:
        return 0.0
    return 1.0 - (signal_age_minutes - fresh) / (stale - fresh)


def model_certainty(p_occupied: float) -> float:
    """Certainty score: higher when prediction is far from 0.5.

    1.0 - 2 × |P(occupied) - 0.5| → inverted: far from 0.5 = more certain
    """
    return 1.0 - 2.0 * abs(p_occupied - 0.5)


def compute_confidence(
    sample_count: int = 0,
    has_sign: bool = False,
    has_curb: bool = False,
    has_sfmta: bool = False,
    signal_age_min: float | None = None,
    p_occupied: float = 0.5,
) -> dict:
    """Compute overall confidence score and component breakdown.

    Returns:
        dict with 'score', 'tier' ('high'/'medium'/'low'), and component values
    """
    cfg = get_config()
    w = cfg["confidence"]

    meter_q = meter_data_quality(sample_count)
    spatial_q = spatial_data_quality(has_sign, has_curb, has_sfmta)
    rt_fresh = realtime_freshness(signal_age_min)
    model_cert = model_certainty(p_occupied)

    score = (
        w["meter_data_weight"] * meter_q
        + w["spatial_data_weight"] * spatial_q
        + w["realtime_freshness_weight"] * rt_fresh
        + w["model_certainty_weight"] * model_cert
    )

    if score >= 0.7:
        tier = "high"
    elif score >= 0.4:
        tier = "medium"
    else:
        tier = "low"

    return {
        "score": round(score, 3),
        "tier": tier,
        "sources": {
            "meter_data": round(meter_q, 3),
            "spatial_data": round(spatial_q, 3),
            "realtime_freshness": round(rt_fresh, 3),
            "model_certainty": round(model_cert, 3),
        },
    }


def guarantee_level(p_free: float, confidence_score: float) -> str:
    """Determine guarantee level for a prediction.

    Args:
        p_free: probability that the spot is free (1 - P(occupied))
        confidence_score: overall confidence (0-1)

    Returns:
        str: 'guaranteed', 'probable', 'possible', or 'unlikely'
    """
    if p_free >= 0.95 and confidence_score >= 0.8:
        return "guaranteed"
    if p_free >= 0.7 and confidence_score >= 0.6:
        return "probable"
    if p_free >= 0.3:
        return "possible"
    return "unlikely"
