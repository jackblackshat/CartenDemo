"""Evaluate trained models on held-out test set.

Metrics:
  - AUC-ROC (target > 0.75)
  - Brier Score (target < 0.20)
  - Precision@0.7 (target > 0.65)
  - Log Loss (target < 0.55)

Per-zone and per-neighborhood breakdowns.
"""

from __future__ import annotations

import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    brier_score_loss,
    log_loss,
    precision_score,
    roc_auc_score,
)

from src.config import setup_logging, models_dir

logger = logging.getLogger(__name__)

_TARGETS = {
    "AUC-ROC": 0.75,
    "Brier Score": 0.20,
    "Precision@0.7": 0.65,
    "Log Loss": 0.55,
}

# Neighborhood ID → name
_NBHD_NAMES = {
    0: "Financial District",
    1: "SoMa",
    2: "Mission",
    3: "North Beach",
    4: "Marina",
    5: "Civic Center",
    6: "Union Square",
    7: "Chinatown",
    8: "Castro",
    9: "Haight",
}

# Zone type ID → name
_ZONE_NAMES = {
    0: "residential",
    1: "commercial",
    2: "restaurant",
    3: "gym",
    4: "mixed",
}


def _compute_metrics(y_true: np.ndarray, y_prob: np.ndarray) -> dict:
    """Compute all evaluation metrics."""
    metrics = {}

    if len(np.unique(y_true)) < 2:
        logger.warning("Only one class in y_true — skipping AUC-ROC")
        metrics["AUC-ROC"] = float("nan")
    else:
        metrics["AUC-ROC"] = roc_auc_score(y_true, y_prob)

    metrics["Brier Score"] = brier_score_loss(y_true, y_prob)
    metrics["Log Loss"] = log_loss(y_true, y_prob, labels=[0, 1])

    # Precision at threshold 0.7: among spots where P(free) >= 0.7, how many are actually free?
    # P(free) = 1 - P(occupied), so P(occupied) <= 0.3
    pred_free = (y_prob <= 0.3).astype(int)
    actual_free = (1 - y_true).astype(int)
    if pred_free.sum() > 0:
        metrics["Precision@0.7"] = float(
            actual_free[pred_free == 1].sum() / pred_free.sum()
        )
    else:
        metrics["Precision@0.7"] = float("nan")

    return metrics


def _print_metrics(name: str, metrics: dict, n: int):
    """Print metrics table with pass/fail indicators."""
    logger.info("\n=== %s (n=%d) ===", name, n)
    for metric_name, value in metrics.items():
        target = _TARGETS.get(metric_name)
        if target is None:
            status = ""
        elif np.isnan(value):
            status = "  [N/A]"
        elif metric_name in ("Brier Score", "Log Loss"):
            status = "  [PASS]" if value <= target else "  [FAIL]"
        else:
            status = "  [PASS]" if value >= target else "  [FAIL]"
        logger.info("  %-20s %8.4f  (target: %s)%s", metric_name, value, target, status)


def evaluate():
    """Run evaluation on test set."""
    setup_logging()
    out_dir = models_dir()

    # Load model
    occ_path = out_dir / "occupancy.joblib"
    if not occ_path.exists():
        logger.error("No occupancy model found at %s. Run train.py first.", occ_path)
        return

    bundle = joblib.load(occ_path)
    model = bundle["model"]
    feature_cols = bundle["feature_cols"]

    # Load test data
    test_path = out_dir / "test_data.parquet"
    if not test_path.exists():
        logger.error("No test data found at %s.", test_path)
        return

    df = pd.read_parquet(test_path)
    logger.info("Test data: %d rows", len(df))

    X = df[feature_cols].values
    y = df["label"].values

    # Overall predictions
    y_prob = model.predict_proba(X)[:, 1]  # P(occupied)

    # Overall metrics
    overall = _compute_metrics(y, y_prob)
    _print_metrics("Overall", overall, len(y))

    # Per-neighborhood breakdown
    if "neighborhood_id" in df.columns:
        logger.info("\n--- Per-Neighborhood Breakdown ---")
        for nbhd_id, nbhd_name in sorted(_NBHD_NAMES.items()):
            mask = df["neighborhood_id"] == nbhd_id
            if mask.sum() < 50:
                continue
            m = _compute_metrics(y[mask], y_prob[mask])
            _print_metrics(nbhd_name, m, mask.sum())

    # Per-zone breakdown
    if "zone_type" in df.columns:
        logger.info("\n--- Per-Zone Breakdown ---")
        for zone_id, zone_name in sorted(_ZONE_NAMES.items()):
            mask = df["zone_type"] == zone_id
            if mask.sum() < 50:
                continue
            m = _compute_metrics(y[mask], y_prob[mask])
            _print_metrics(zone_name, m, mask.sum())

    # Sanity checks
    logger.info("\n--- Sanity Checks ---")

    # Financial District at 9am should have high P(occupied)
    fd_morning = (
        (df.get("neighborhood_id", pd.Series()) == 0)
        & (df.get("hour_of_week", pd.Series()).between(24 + 9, 24 + 9))  # Mon 9am
    )
    if fd_morning.sum() > 0:
        avg_occ = y_prob[fd_morning].mean()
        logger.info("  Financial District Mon 9am: avg P(occupied)=%.3f (expect high)", avg_occ)

    # Marina at 2am should have low P(occupied)
    marina_night = (
        (df.get("neighborhood_id", pd.Series()) == 4)
        & (df.get("hour_of_week", pd.Series()).between(0 + 2, 0 + 2))  # Mon 2am
    )
    if marina_night.sum() > 0:
        avg_occ = y_prob[marina_night].mean()
        logger.info("  Marina Mon 2am: avg P(occupied)=%.3f (expect low)", avg_occ)


if __name__ == "__main__":
    evaluate()
