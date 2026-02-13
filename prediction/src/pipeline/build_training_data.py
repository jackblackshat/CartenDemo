"""Build training data matrix from meter transactions × 15-minute intervals.

For each meter × 15-min slot:
  - Compute all ~47 features
  - Label: 1 if meter occupied during interval (from meter_transactions)
  - Stratified sample: 100% state-change intervals + 20% random

Output: prediction/training_data.parquet
"""

from __future__ import annotations

import logging
import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from tqdm import tqdm

from src.config import setup_logging, get_config
from src.db import get_connection, query
from src.features import temporal, spatial, meter_patterns, sweeping, sign_rules, zone_classifier

logger = logging.getLogger(__name__)

# Categorical features that need encoding
_CATEGORICAL_FEATURES = {"sweeping_side", "curb_color", "zone_type"}

# Encoding maps for categorical → integer
_SWEEPING_SIDE_MAP = {"none": 0, "left": 1, "right": 2, "both": 3}
_CURB_COLOR_MAP = {"none": 0, "green": 1, "white": 2, "red": 3, "yellow": 4, "blue": 5}
_ZONE_TYPE_MAP = {"residential": 0, "commercial": 1, "restaurant": 2, "gym": 3, "mixed": 4}


def _encode_categorical(features: dict) -> dict:
    """Convert categorical features to integers for XGBoost."""
    if "sweeping_side" in features:
        features["sweeping_side"] = _SWEEPING_SIDE_MAP.get(features["sweeping_side"], 0)
    if "curb_color" in features:
        features["curb_color"] = _CURB_COLOR_MAP.get(features["curb_color"], 0)
    if "zone_type" in features:
        features["zone_type"] = _ZONE_TYPE_MAP.get(features["zone_type"], 4)
    return features


def _compute_all_features(spot: dict, timestamp: datetime) -> dict:
    """Compute the full feature vector for a spot at a time."""
    features = {}
    features.update(temporal.compute(spot, timestamp))
    features.update(spatial.compute(spot, timestamp))
    features.update(meter_patterns.compute(spot, timestamp))
    features.update(sweeping.compute(spot, timestamp))
    features.update(sign_rules.compute(spot, timestamp))
    features.update(zone_classifier.compute(spot, timestamp))
    return _encode_categorical(features)


def _get_meter_slots() -> list[dict]:
    """Get all meter locations for training data generation."""
    rows = query(
        """SELECT post_id, lat, lng, street_name, cap_color
           FROM parking_meters
           WHERE lat IS NOT NULL AND lng IS NOT NULL"""
    )
    return rows


def _is_occupied(meter_post_id: str, slot_start: datetime, slot_end: datetime, conn) -> int:
    """Check if a meter was occupied during a 15-min slot."""
    start_str = slot_start.strftime("%Y-%m-%d %H:%M:%S")
    end_str = slot_end.strftime("%Y-%m-%d %H:%M:%S")

    row = conn.execute(
        """SELECT COUNT(*) as cnt FROM meter_transactions
           WHERE meter_post_id = ?
             AND session_start <= ?
             AND (session_end >= ? OR session_end IS NULL)""",
        (meter_post_id, end_str, start_str),
    ).fetchone()
    return 1 if row["cnt"] > 0 else 0


def _detect_state_changes(meter_post_id: str, conn) -> set[str]:
    """Find timestamps where meter state changed (occupied ↔ free).

    Returns set of slot keys like '2023-01-15T09:00'.
    """
    rows = conn.execute(
        """SELECT session_start, session_end FROM meter_transactions
           WHERE meter_post_id = ?
           ORDER BY session_start""",
        (meter_post_id,),
    ).fetchall()

    change_slots = set()
    for row in rows:
        # Session start = state change (free → occupied)
        start = row["session_start"]
        if start:
            try:
                dt = datetime.fromisoformat(start)
                # Round to 15-min slot
                slot_min = (dt.minute // 15) * 15
                slot_key = dt.replace(minute=slot_min, second=0).strftime("%Y-%m-%dT%H:%M")
                change_slots.add(slot_key)
            except ValueError:
                pass

        # Session end = state change (occupied → free)
        end = row["session_end"]
        if end:
            try:
                dt = datetime.fromisoformat(end)
                slot_min = (dt.minute // 15) * 15
                slot_key = dt.replace(minute=slot_min, second=0).strftime("%Y-%m-%dT%H:%M")
                change_slots.add(slot_key)
            except ValueError:
                pass

    return change_slots


def build(output_path: str = None):
    """Build the training data matrix and save as parquet."""
    setup_logging()
    cfg = get_config()

    if output_path is None:
        output_path = str(Path(__file__).resolve().parent.parent.parent / "training_data.parquet")

    sample_rate = cfg["training"]["sample_rate_random"]
    slot_minutes = cfg["training"]["time_slot_minutes"]

    logger.info("Building training data (sample_rate=%.2f, slot=%dmin)", sample_rate, slot_minutes)

    # Initialize spatial indexes
    spatial.get_meter_index().load()

    meters = _get_meter_slots()
    logger.info("Found %d meters with coordinates", len(meters))

    if not meters:
        logger.warning("No meters found — training data will be empty")
        return

    # Get date range from transactions
    conn = get_connection()
    date_range = conn.execute(
        """SELECT MIN(date(session_start)) as min_date,
                  MAX(date(session_start)) as max_date
           FROM meter_transactions"""
    ).fetchone()

    if not date_range or not date_range["min_date"]:
        logger.warning("No transactions found — cannot build training data")
        conn.close()
        return

    min_date = datetime.strptime(date_range["min_date"], "%Y-%m-%d")
    max_date = datetime.strptime(date_range["max_date"], "%Y-%m-%d")
    logger.info("Transaction date range: %s to %s", min_date.date(), max_date.date())

    all_rows = []
    slot_delta = timedelta(minutes=slot_minutes)

    # Process meters in batches
    for meter in tqdm(meters, desc="Building features"):
        post_id = meter["post_id"]
        spot = {
            "lat": meter["lat"],
            "lng": meter["lng"],
            "street_name": meter.get("street_name"),
        }

        # Find state change slots for stratified sampling
        state_changes = _detect_state_changes(post_id, conn)

        # Generate 15-min slots across the date range (metered hours only: 9am-6pm)
        current = min_date.replace(hour=9, minute=0)
        while current <= max_date:
            if current.hour >= 18:
                current = (current + timedelta(days=1)).replace(hour=9, minute=0)
                continue

            slot_key = current.strftime("%Y-%m-%dT%H:%M")
            slot_end = current + slot_delta

            # Stratified sampling: keep all state changes + sample_rate of random
            is_change = slot_key in state_changes
            if not is_change and random.random() > sample_rate:
                current += slot_delta
                continue

            # Compute label
            label = _is_occupied(post_id, current, slot_end, conn)

            # Compute features
            features = _compute_all_features(spot, current)
            features["label"] = label
            features["meter_post_id"] = post_id
            features["timestamp"] = slot_key
            features["is_state_change"] = int(is_change)

            all_rows.append(features)
            current += slot_delta

    conn.close()

    if not all_rows:
        logger.warning("No training rows generated")
        return

    df = pd.DataFrame(all_rows)
    logger.info("Training data shape: %s", df.shape)
    logger.info("Label distribution:\n%s", df["label"].value_counts())
    logger.info("State change rows: %d / %d", df["is_state_change"].sum(), len(df))

    df.to_parquet(output_path, index=False)
    logger.info("Saved training data to %s", output_path)


if __name__ == "__main__":
    build()
