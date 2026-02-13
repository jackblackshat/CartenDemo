"""Turnover model: XGBoost regressor for sessions/hour.

Model C in the architecture. Loads from models/turnover.joblib.
Drives the time-decay half-life calculation.
"""

from __future__ import annotations

import logging

import joblib
import numpy as np

from src.config import models_dir
from src.features.zone_classifier import base_churn

logger = logging.getLogger(__name__)

_model = None
_feature_cols = None


def load() -> bool:
    """Load turnover model from disk."""
    global _model, _feature_cols
    path = models_dir() / "turnover.joblib"
    if not path.exists():
        logger.warning("Turnover model not found at %s — will use zone defaults", path)
        return False
    bundle = joblib.load(path)
    _model = bundle["model"]
    _feature_cols = bundle["feature_cols"]
    logger.info("Loaded turnover model (%d features)", len(_feature_cols))
    return True


def predict(features: dict, zone_type: str = "mixed") -> float:
    """Predict sessions/hour for a spot.

    Falls back to zone-based default if model not loaded.

    Args:
        features: dict of feature_name → value
        zone_type: zone classification for fallback

    Returns:
        float: expected sessions/hour (>= 0.1 to avoid division by zero)
    """
    if _model is not None:
        x = np.array([[features.get(c, float("nan")) for c in _feature_cols]])
        pred = float(_model.predict(x)[0])
        return max(0.1, pred)

    # Fallback to zone-based default
    return max(0.1, base_churn(zone_type))


def predict_batch(feature_matrix: list[dict], zone_types: list[str] = None) -> np.ndarray:
    """Predict sessions/hour for a batch."""
    if _model is not None:
        X = np.array([
            [f.get(c, float("nan")) for c in _feature_cols]
            for f in feature_matrix
        ])
        preds = _model.predict(X)
        return np.maximum(0.1, preds)

    # Fallback
    if zone_types is None:
        zone_types = ["mixed"] * len(feature_matrix)
    return np.array([max(0.1, base_churn(z)) for z in zone_types])


def is_loaded() -> bool:
    return _model is not None
