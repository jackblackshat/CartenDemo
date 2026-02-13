"""Platt scaling calibration per zone type.

Fits logistic regression on validation set predictions to improve
probability calibration. Loads from models/calibration.joblib.
"""

from __future__ import annotations

import logging
from pathlib import Path

import joblib
import numpy as np

from src.config import models_dir

logger = logging.getLogger(__name__)

_calibrators = None  # dict of zone_type → (a, b) Platt params
_global_calibrator = None  # fallback (a, b)


def load() -> bool:
    """Load calibration parameters from disk."""
    global _calibrators, _global_calibrator
    path = models_dir() / "calibration.joblib"
    if not path.exists():
        logger.info("No calibration file found — using raw probabilities")
        return False
    bundle = joblib.load(path)
    _calibrators = bundle.get("per_zone", {})
    _global_calibrator = bundle.get("global")
    logger.info("Loaded calibration for %d zones", len(_calibrators))
    return True


def _platt_transform(p: float, a: float, b: float) -> float:
    """Apply Platt scaling: P_calibrated = 1 / (1 + exp(a × logit + b))."""
    import math
    if p <= 0.001:
        p = 0.001
    if p >= 0.999:
        p = 0.999
    logit = math.log(p / (1 - p))
    return 1.0 / (1.0 + math.exp(a * logit + b))


def calibrate(p_occupied: float, zone_type: str = "mixed") -> float:
    """Calibrate a raw P(occupied) prediction.

    Uses zone-specific Platt scaling if available, otherwise global,
    otherwise returns raw probability.

    Args:
        p_occupied: raw model output
        zone_type: zone classification for zone-specific calibration

    Returns:
        float: calibrated P(occupied)
    """
    if _calibrators and zone_type in _calibrators:
        a, b = _calibrators[zone_type]
        return _platt_transform(p_occupied, a, b)
    if _global_calibrator:
        a, b = _global_calibrator
        return _platt_transform(p_occupied, a, b)
    return p_occupied


def fit_calibration(
    y_true: np.ndarray, y_prob: np.ndarray, zone_types: np.ndarray = None
):
    """Fit Platt scaling parameters and save to disk.

    Called during training on the validation set.

    Args:
        y_true: binary labels
        y_prob: raw predicted probabilities
        zone_types: optional zone type for each sample
    """
    from sklearn.linear_model import LogisticRegression

    # Fit global calibrator
    lr = LogisticRegression(C=1e10, solver="lbfgs", max_iter=1000)
    logits = np.log(np.clip(y_prob, 1e-6, 1 - 1e-6) / (1 - np.clip(y_prob, 1e-6, 1 - 1e-6)))
    lr.fit(logits.reshape(-1, 1), y_true)
    global_params = (float(lr.coef_[0, 0]), float(lr.intercept_[0]))

    per_zone = {}
    if zone_types is not None:
        for zone in np.unique(zone_types):
            mask = zone_types == zone
            if mask.sum() < 50:
                continue
            lr_z = LogisticRegression(C=1e10, solver="lbfgs", max_iter=1000)
            lr_z.fit(logits[mask].reshape(-1, 1), y_true[mask])
            per_zone[int(zone)] = (float(lr_z.coef_[0, 0]), float(lr_z.intercept_[0]))

    bundle = {"global": global_params, "per_zone": per_zone}
    out_path = models_dir() / "calibration.joblib"
    joblib.dump(bundle, out_path)
    logger.info("Saved calibration to %s", out_path)
