"""Train occupancy (XGBoost classifier) and turnover (XGBoost regressor) models.

Time-based split:
  - Train: months 1-30
  - Validation: months 31-33
  - Test: months 34-36

Platt scaling on validation set per zone_type.
Exports model artifacts to prediction/models/.
"""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier, XGBRegressor

from src.config import setup_logging, get_config, models_dir

logger = logging.getLogger(__name__)

# Feature columns used by the models (exclude metadata columns)
_META_COLS = {"label", "meter_post_id", "timestamp", "is_state_change"}


def _load_training_data() -> pd.DataFrame:
    """Load training data parquet file."""
    path = Path(__file__).resolve().parent.parent.parent / "training_data.parquet"
    if not path.exists():
        raise FileNotFoundError(
            f"Training data not found at {path}. Run build_training_data.py first."
        )
    df = pd.read_parquet(path)
    logger.info("Loaded training data: %d rows × %d cols", len(df), len(df.columns))
    return df


def _time_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split data by month ranges from config.

    Falls back to random split if timestamps don't span enough months.
    """
    cfg = get_config()
    train_range = cfg["training"]["train_months"]
    val_range = cfg["training"]["val_months"]
    test_range = cfg["training"]["test_months"]

    if "timestamp" not in df.columns:
        logger.warning("No timestamp column — using random 70/15/15 split")
        train, rest = train_test_split(df, test_size=0.3, random_state=42)
        val, test = train_test_split(rest, test_size=0.5, random_state=42)
        return train, val, test

    # Compute month index from earliest date
    df["_ts"] = pd.to_datetime(df["timestamp"])
    min_date = df["_ts"].min()
    df["_month_idx"] = (
        (df["_ts"].dt.year - min_date.year) * 12
        + df["_ts"].dt.month - min_date.month + 1
    )

    max_month = df["_month_idx"].max()
    logger.info("Month range: 1 to %d", max_month)

    if max_month < test_range[1]:
        logger.warning(
            "Only %d months available (need %d). Scaling split proportionally.",
            max_month, test_range[1],
        )
        # Proportional split
        train_end = int(max_month * train_range[1] / test_range[1])
        val_end = int(max_month * val_range[1] / test_range[1])
        train = df[df["_month_idx"] <= train_end]
        val = df[(df["_month_idx"] > train_end) & (df["_month_idx"] <= val_end)]
        test = df[df["_month_idx"] > val_end]
    else:
        train = df[df["_month_idx"].between(train_range[0], train_range[1])]
        val = df[df["_month_idx"].between(val_range[0], val_range[1])]
        test = df[df["_month_idx"].between(test_range[0], test_range[1])]

    df.drop(columns=["_ts", "_month_idx"], inplace=True)
    for split in (train, val, test):
        split.drop(columns=["_ts", "_month_idx"], inplace=True, errors="ignore")

    logger.info("Split sizes — train: %d, val: %d, test: %d", len(train), len(val), len(test))
    return train, val, test


def _feature_cols(df: pd.DataFrame) -> list[str]:
    """Get feature column names (everything except metadata)."""
    return [c for c in df.columns if c not in _META_COLS]


def train_occupancy(
    train: pd.DataFrame, val: pd.DataFrame, feature_cols: list[str]
) -> XGBClassifier:
    """Train occupancy XGBoost classifier."""
    cfg = get_config()["model"]["occupancy"]
    logger.info("Training occupancy model (%d features)...", len(feature_cols))

    model = XGBClassifier(
        n_estimators=cfg["n_estimators"],
        max_depth=cfg["max_depth"],
        learning_rate=cfg["learning_rate"],
        eval_metric=cfg["eval_metric"],
        early_stopping_rounds=cfg["early_stopping_rounds"],
        tree_method="hist",
        enable_categorical=False,
        random_state=42,
        n_jobs=-1,
    )

    X_train = train[feature_cols].values
    y_train = train["label"].values
    X_val = val[feature_cols].values
    y_val = val["label"].values

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50,
    )

    # Log feature importance (top 15)
    importance = dict(zip(feature_cols, model.feature_importances_))
    top = sorted(importance.items(), key=lambda x: -x[1])[:15]
    logger.info("Top 15 features (occupancy):")
    for name, imp in top:
        logger.info("  %-30s %.4f", name, imp)

    return model


def train_turnover(
    train: pd.DataFrame, val: pd.DataFrame, feature_cols: list[str]
) -> XGBRegressor:
    """Train turnover XGBoost regressor.

    Target: turnover_rate (sessions/hour) from the feature matrix.
    """
    cfg = get_config()["model"]["turnover"]
    logger.info("Training turnover model...")

    if "turnover_rate" not in train.columns:
        logger.warning("No turnover_rate in training data — skipping turnover model")
        return None

    # Filter rows with valid turnover data
    mask_train = train["turnover_rate"].notna()
    mask_val = val["turnover_rate"].notna()

    if mask_train.sum() < 100:
        logger.warning("Too few turnover samples (%d) — skipping", mask_train.sum())
        return None

    model = XGBRegressor(
        n_estimators=cfg["n_estimators"],
        max_depth=cfg["max_depth"],
        learning_rate=cfg["learning_rate"],
        eval_metric=cfg["eval_metric"],
        early_stopping_rounds=cfg["early_stopping_rounds"],
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
    )

    X_train = train.loc[mask_train, feature_cols].values
    y_train = train.loc[mask_train, "turnover_rate"].values
    X_val = val.loc[mask_val, feature_cols].values
    y_val = val.loc[mask_val, "turnover_rate"].values

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50,
    )

    return model


def train_all():
    """Main training pipeline."""
    setup_logging()

    df = _load_training_data()
    train, val, test = _time_split(df)
    feature_cols = _feature_cols(df)
    logger.info("Feature columns (%d): %s", len(feature_cols), feature_cols)

    # Save feature column names for inference
    out_dir = models_dir()

    # Train occupancy model
    occ_model = train_occupancy(train, val, feature_cols)
    occ_path = out_dir / "occupancy.joblib"
    joblib.dump({"model": occ_model, "feature_cols": feature_cols}, occ_path)
    logger.info("Saved occupancy model to %s", occ_path)

    # Train turnover model
    turn_model = train_turnover(train, val, feature_cols)
    if turn_model:
        turn_path = out_dir / "turnover.joblib"
        joblib.dump({"model": turn_model, "feature_cols": feature_cols}, turn_path)
        logger.info("Saved turnover model to %s", turn_path)

    # Save test set for evaluation
    test_path = out_dir / "test_data.parquet"
    test.to_parquet(test_path, index=False)
    logger.info("Saved test data to %s", test_path)

    logger.info("Training complete.")


if __name__ == "__main__":
    train_all()
