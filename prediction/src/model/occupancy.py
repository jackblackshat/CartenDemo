"""Occupancy model: XGBoost classifier for P(occupied|t, location).

Model A in the architecture. Loads from models/occupancy.joblib.
"""

from __future__ import annotations

import logging
from pathlib import Path

import joblib
import numpy as np

from src.config import models_dir

logger = logging.getLogger(__name__)

_model = None
_feature_cols = None


def load():
    """Load occupancy model from disk."""
    global _model, _feature_cols
    path = models_dir() / "occupancy.joblib"
    if not path.exists():
        logger.warning("Occupancy model not found at %s", path)
        return False
    bundle = joblib.load(path)
    _model = bundle["model"]
    _feature_cols = bundle["feature_cols"]
    logger.info("Loaded occupancy model (%d features)", len(_feature_cols))
    return True


def predict(features: dict) -> float:
    """Predict P(occupied) for a single feature vector.

    Args:
        features: dict of feature_name → value (must include all feature_cols)

    Returns:
        float: P(occupied) in [0, 1]
    """
    if _model is None:
        raise RuntimeError("Occupancy model not loaded. Call load() first.")

    x = np.array([[features.get(c, float("nan")) for c in _feature_cols]])
    prob = _model.predict_proba(x)[0, 1]
    return float(prob)


def predict_batch(feature_matrix: list[dict]) -> np.ndarray:
    """Predict P(occupied) for a batch of feature vectors.

    Args:
        feature_matrix: list of feature dicts

    Returns:
        np.ndarray of shape (n,) with P(occupied) values
    """
    if _model is None:
        raise RuntimeError("Occupancy model not loaded. Call load() first.")

    X = np.array([
        [f.get(c, float("nan")) for c in _feature_cols]
        for f in feature_matrix
    ])
    return _model.predict_proba(X)[:, 1]


def feature_columns() -> list[str]:
    """Return the feature column names used by the model."""
    return _feature_cols or []


def is_loaded() -> bool:
    return _model is not None
