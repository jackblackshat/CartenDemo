"""Ensemble module: chains Model A → B → C + confidence + time decay.

Routes prediction through:
  1. Occupancy model (A) → P(occupied)
  2. Calibration → calibrated P(occupied)
  3. Transfer layer (B) → adjusted P(occupied) for free spots
  4. Turnover model (C) → sessions/hour → half-life
  5. Confidence scoring → multi-source confidence
  6. Time decay → future predictions

Returns final SpotPrediction dict.
"""

from __future__ import annotations

import logging
from datetime import datetime

from src.features import temporal, spatial, meter_patterns, sweeping, sign_rules, zone_classifier
from src.features import traffic, weather, events
from src.model import occupancy, turnover, transfer, confidence, time_decay, calibration

logger = logging.getLogger(__name__)

# Categorical encoding maps (must match build_training_data.py)
_SWEEPING_SIDE_MAP = {"none": 0, "left": 1, "right": 2, "both": 3}
_CURB_COLOR_MAP = {"none": 0, "green": 1, "white": 2, "red": 3, "yellow": 4, "blue": 5}
_ZONE_TYPE_MAP = {"residential": 0, "commercial": 1, "restaurant": 2, "gym": 3, "mixed": 4}


def _encode_categorical(features: dict) -> dict:
    """Convert categorical features to integers."""
    if "sweeping_side" in features and isinstance(features["sweeping_side"], str):
        features["sweeping_side"] = _SWEEPING_SIDE_MAP.get(features["sweeping_side"], 0)
    if "curb_color" in features and isinstance(features["curb_color"], str):
        features["curb_color"] = _CURB_COLOR_MAP.get(features["curb_color"], 0)
    if "zone_type" in features and isinstance(features["zone_type"], str):
        features["zone_type"] = _ZONE_TYPE_MAP.get(features["zone_type"], 4)
    return features


def compute_features(spot: dict, timestamp: datetime) -> dict:
    """Compute full feature vector for a spot at a time."""
    features = {}
    features.update(temporal.compute(spot, timestamp))
    features.update(spatial.compute(spot, timestamp))
    features.update(meter_patterns.compute(spot, timestamp))
    features.update(sweeping.compute(spot, timestamp))
    features.update(sign_rules.compute(spot, timestamp))
    features.update(zone_classifier.compute(spot, timestamp))
    # Real-time signals (NaN if unavailable — XGBoost handles natively)
    features.update(traffic.compute(spot, timestamp))
    features.update(weather.compute(spot, timestamp))
    features.update(events.compute(spot, timestamp))
    return features


def predict_spot(spot: dict, timestamp: datetime = None) -> dict:
    """Full prediction pipeline for a single spot.

    Args:
        spot: dict with at least 'lat', 'lng', optionally spot metadata
        timestamp: prediction time (defaults to now)

    Returns:
        dict with prediction results matching SpotPrediction schema
    """
    if timestamp is None:
        timestamp = datetime.now()

    # Step 1: Compute features
    raw_features = compute_features(spot, timestamp)
    zone_type_str = raw_features.get("zone_type", "mixed")
    if isinstance(zone_type_str, int):
        # Reverse map for display
        zone_type_str = {v: k for k, v in _ZONE_TYPE_MAP.items()}.get(zone_type_str, "mixed")

    # Encode categoricals for model input
    features = _encode_categorical(raw_features.copy())

    # Step 2: Occupancy model → P(occupied)
    if occupancy.is_loaded():
        p_occupied = occupancy.predict(features)
    else:
        # Fallback: use nearest meter occupancy if available
        p_occupied = features.get("nearest_meter_occupancy", 0.5)
        if p_occupied != p_occupied:  # NaN check
            p_occupied = 0.5

    # Step 3: Calibration
    p_occupied = calibration.calibrate(p_occupied, zone_type_str)

    # Step 4: Transfer adjustment (meter → free spot)
    p_occupied_adj = transfer.adjust(p_occupied, zone_type_str)
    p_free = 1.0 - p_occupied_adj

    # Step 5: Turnover model → sessions/hour
    turnover_rate = turnover.predict(features, zone_type_str)

    # Step 6: Confidence scoring
    sample_count = features.get("meter_sample_count", 0)
    if sample_count != sample_count:  # NaN
        sample_count = 0

    has_sign = features.get("no_parking_signs_nearby", 0) > 0 or features.get("has_time_limit", 0)
    has_curb = features.get("curb_color", 0) != 0  # non-"none"
    data_sources = spot.get("data_sources", "")
    has_sfmta = "sfmta" in data_sources.lower() if data_sources else False

    conf = confidence.compute_confidence(
        sample_count=int(sample_count),
        has_sign=bool(has_sign),
        has_curb=bool(has_curb),
        has_sfmta=has_sfmta,
        signal_age_min=None,  # Updated when realtime signals are available
        p_occupied=p_occupied_adj,
    )

    # Step 7: Guarantee level
    guarantee = confidence.guarantee_level(p_free, conf["score"])

    # Step 8: Time decay
    decay_info = time_decay.time_decay_info(p_free, turnover_rate)

    # Build restrictions from features
    restrictions = []
    if features.get("is_sweeping_now"):
        restrictions.append("Street sweeping in progress")
    if features.get("has_time_limit") and features.get("time_limit_minutes", 0) > 0:
        restrictions.append(f"{int(features['time_limit_minutes'])}min time limit")
    if features.get("is_permit_zone"):
        restrictions.append("Permit zone")

    return {
        "spot_id": spot.get("spot_id"),
        "street": spot.get("street_name") or "",
        "lat": spot["lat"],
        "lng": spot["lng"],
        "p_free": round(p_free, 3),
        "guarantee_level": guarantee,
        "confidence": conf,
        "time_decay": decay_info,
        "turnover_rate": round(turnover_rate, 2),
        "zone_type": zone_type_str,
        "restrictions": restrictions,
        "neighborhood": spot.get("neighborhood", ""),
    }


def load_models():
    """Load all model artifacts. Call once at startup."""
    occ_ok = occupancy.load()
    turn_ok = turnover.load()
    cal_ok = calibration.load()
    logger.info(
        "Models loaded — occupancy: %s, turnover: %s, calibration: %s",
        occ_ok, turn_ok, cal_ok,
    )
    return occ_ok
