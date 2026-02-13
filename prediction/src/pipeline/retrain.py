"""Incremental retraining with crowd report data.

Pulls crowd_reports since last training, uses them as additional labels
(weighted lower than meter data), retrains occupancy model with warm start,
and updates transfer multipliers based on observed free-spot occupancy.
"""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier

from src.config import setup_logging, get_config, models_dir
from src.db import query, get_connection
from src.model.ensemble import compute_features

logger = logging.getLogger(__name__)

# Categorical encoding (must match build_training_data.py)
_SWEEPING_SIDE_MAP = {"none": 0, "left": 1, "right": 2, "both": 3}
_CURB_COLOR_MAP = {"none": 0, "green": 1, "white": 2, "red": 3, "yellow": 4, "blue": 5}
_ZONE_TYPE_MAP = {"residential": 0, "commercial": 1, "restaurant": 2, "gym": 3, "mixed": 4}


def _encode_categorical(features: dict) -> dict:
    if "sweeping_side" in features and isinstance(features["sweeping_side"], str):
        features["sweeping_side"] = _SWEEPING_SIDE_MAP.get(features["sweeping_side"], 0)
    if "curb_color" in features and isinstance(features["curb_color"], str):
        features["curb_color"] = _CURB_COLOR_MAP.get(features["curb_color"], 0)
    if "zone_type" in features and isinstance(features["zone_type"], str):
        features["zone_type"] = _ZONE_TYPE_MAP.get(features["zone_type"], 4)
    return features


def _get_crowd_training_data() -> pd.DataFrame | None:
    """Build training rows from crowd reports.

    Each report becomes a labeled sample:
      spot_free → label=0 (not occupied)
      spot_taken → label=1 (occupied)
    """
    reports = query(
        """SELECT spot_id, lat, lng, report_type, reported_at, confidence
           FROM crowd_reports
           ORDER BY reported_at"""
    )

    if not reports:
        logger.info("No crowd reports available for retraining")
        return None

    rows = []
    for report in reports:
        spot = {"lat": report["lat"], "lng": report["lng"]}
        try:
            ts = datetime.fromisoformat(report["reported_at"])
        except (ValueError, TypeError):
            continue

        features = compute_features(spot, ts)
        features = _encode_categorical(features)

        # Label from report type
        features["label"] = 1 if report["report_type"] == "spot_taken" else 0
        features["sample_weight"] = report.get("confidence", 0.5) * 0.5  # Lower weight than meter data
        rows.append(features)

    if not rows:
        return None

    return pd.DataFrame(rows)


def _update_transfer_multipliers(crowd_df: pd.DataFrame):
    """Update transfer multipliers based on observed free-spot occupancy.

    Compare crowd-reported occupancy rates per zone against meter predictions
    to calibrate the transfer multipliers.
    """
    if "zone_type" not in crowd_df.columns or "label" not in crowd_df.columns:
        return

    zone_map_inv = {v: k for k, v in _ZONE_TYPE_MAP.items()}

    for zone_id in crowd_df["zone_type"].unique():
        zone_data = crowd_df[crowd_df["zone_type"] == zone_id]
        if len(zone_data) < 10:
            continue

        observed_occ = zone_data["label"].mean()
        zone_name = zone_map_inv.get(zone_id, "mixed")
        logger.info(
            "Zone '%s': observed occupancy=%.3f from %d reports",
            zone_name, observed_occ, len(zone_data),
        )
        # Future: update config with learned multipliers


def retrain():
    """Run incremental retraining pipeline."""
    setup_logging()
    out_dir = models_dir()

    # Load existing model
    occ_path = out_dir / "occupancy.joblib"
    if not occ_path.exists():
        logger.error("No existing occupancy model found. Run train.py first.")
        return

    bundle = joblib.load(occ_path)
    model = bundle["model"]
    feature_cols = bundle["feature_cols"]

    # Get crowd data
    crowd_df = _get_crowd_training_data()
    if crowd_df is None or len(crowd_df) < 10:
        logger.info("Not enough crowd data for retraining (need >=10 reports)")
        return

    logger.info("Retraining with %d crowd reports", len(crowd_df))

    # Update transfer multipliers
    _update_transfer_multipliers(crowd_df)

    # Prepare features
    available_cols = [c for c in feature_cols if c in crowd_df.columns]
    missing_cols = [c for c in feature_cols if c not in crowd_df.columns]
    if missing_cols:
        for col in missing_cols:
            crowd_df[col] = float("nan")

    X = crowd_df[feature_cols].values
    y = crowd_df["label"].values
    weights = crowd_df.get("sample_weight", pd.Series(np.ones(len(crowd_df)))).values

    # Incremental training: fit with warm start on crowd data
    # XGBoost doesn't have native warm_start, so we use a small number of rounds
    # on top of the existing model by saving/loading the booster
    new_model = XGBClassifier(
        n_estimators=50,  # Small number of additional trees
        max_depth=6,
        learning_rate=0.02,  # Lower learning rate for fine-tuning
        eval_metric="logloss",
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
    )

    new_model.fit(X, y, sample_weight=weights, xgb_model=model.get_booster())

    # Bump version
    version = bundle.get("version", "1.0.0")
    parts = version.split(".")
    parts[-1] = str(int(parts[-1]) + 1)
    new_version = ".".join(parts)

    # Save new model
    new_bundle = {
        "model": new_model,
        "feature_cols": feature_cols,
        "version": new_version,
        "retrained_at": datetime.now().isoformat(),
        "crowd_samples": len(crowd_df),
    }
    joblib.dump(new_bundle, occ_path)
    logger.info("Saved retrained model v%s to %s", new_version, occ_path)


if __name__ == "__main__":
    retrain()
