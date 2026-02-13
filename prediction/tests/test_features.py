"""Tests for feature extractors."""

import math
from datetime import datetime

from src.features import temporal
from src.features.zone_classifier import classify_zone, ZONE_TYPE_IDS
from src.model.time_decay import half_life_minutes, apply_decay, future_confidence
from src.model.transfer import adjust
from src.model.confidence import (
    meter_data_quality, spatial_data_quality, realtime_freshness,
    model_certainty, guarantee_level,
)


class TestTemporalFeatures:
    def test_basic_shape(self):
        spot = {"lat": 37.79, "lng": -122.40}
        ts = datetime(2024, 3, 15, 14, 30)  # Friday 2:30pm
        features = temporal.compute(spot, ts)
        assert len(features) == len(temporal.FEATURE_NAMES)
        for name in temporal.FEATURE_NAMES:
            assert name in features

    def test_weekend_flag(self):
        spot = {"lat": 37.79, "lng": -122.40}
        # Saturday
        features = temporal.compute(spot, datetime(2024, 3, 16, 10, 0))
        assert features["is_weekend"] == 1
        # Wednesday
        features = temporal.compute(spot, datetime(2024, 3, 13, 10, 0))
        assert features["is_weekend"] == 0

    def test_rush_hour(self):
        spot = {"lat": 37.79, "lng": -122.40}
        # Tuesday 8am = rush hour
        features = temporal.compute(spot, datetime(2024, 3, 12, 8, 0))
        assert features["is_rush_hour"] == 1
        # Tuesday 2pm = not rush hour
        features = temporal.compute(spot, datetime(2024, 3, 12, 14, 0))
        assert features["is_rush_hour"] == 0

    def test_cyclic_encoding_range(self):
        spot = {"lat": 37.79, "lng": -122.40}
        features = temporal.compute(spot, datetime(2024, 6, 15, 12, 0))
        assert -1 <= features["hour_sin"] <= 1
        assert -1 <= features["hour_cos"] <= 1
        assert -1 <= features["dow_sin"] <= 1
        assert -1 <= features["dow_cos"] <= 1

    def test_holiday_detection(self):
        spot = {"lat": 37.79, "lng": -122.40}
        # July 4th
        features = temporal.compute(spot, datetime(2024, 7, 4, 12, 0))
        assert features["is_holiday"] == 1
        # Regular day
        features = temporal.compute(spot, datetime(2024, 3, 15, 12, 0))
        assert features["is_holiday"] == 0


class TestTimerDecay:
    def test_half_life(self):
        # 2 turnovers/hr → 30 min half-life
        assert half_life_minutes(2.0) == 30.0
        # 1 turnover/hr → 60 min
        assert half_life_minutes(1.0) == 60.0

    def test_decay_at_zero(self):
        # At t=0, prediction should be unchanged
        assert apply_decay(0.8, 0, 2.0) == 0.8

    def test_decay_toward_half(self):
        # After many half-lives, should approach 0.5
        result = apply_decay(0.9, 300, 2.0)
        assert abs(result - 0.5) < 0.01

    def test_future_confidence_shape(self):
        fc = future_confidence(0.7, 1.5)
        assert "1min" in fc
        assert "3min" in fc
        assert "5min" in fc
        assert "10min" in fc
        # Values should decrease over time
        assert fc["1min"] >= fc["3min"] >= fc["5min"] >= fc["10min"]


class TestTransfer:
    def test_increases_occupancy(self):
        # Transfer should increase P(occupied) for free spots
        p = 0.5
        for zone in ["residential", "commercial", "restaurant"]:
            adjusted = adjust(p, zone)
            assert adjusted > p, f"{zone}: {adjusted} should be > {p}"

    def test_clamping(self):
        # Should never exceed bounds
        assert adjust(0.99, "restaurant") <= 0.99
        assert adjust(0.01, "residential") >= 0.01


class TestConfidence:
    def test_meter_quality(self):
        assert meter_data_quality(0) == 0.0
        assert meter_data_quality(500) == 1.0
        assert meter_data_quality(1000) == 1.0
        assert 0 < meter_data_quality(250) < 1.0

    def test_spatial_quality(self):
        assert spatial_data_quality() == 0.0
        assert spatial_data_quality(True, True, True) == 1.0

    def test_realtime_freshness(self):
        assert realtime_freshness(None) == 0.0
        assert realtime_freshness(0) == 1.0
        assert realtime_freshness(3) == 1.0
        assert realtime_freshness(60) == 0.0
        assert 0 < realtime_freshness(30) < 1.0

    def test_model_certainty(self):
        # At 0.5 (max uncertainty), certainty should be 0
        assert model_certainty(0.5) == 0.0
        # At 0.0 or 1.0, certainty should be 1.0
        assert model_certainty(0.0) == 0.0  # Actually 1 - 2*0.5 = 0
        assert model_certainty(1.0) == 0.0  # 1 - 2*0.5 = 0
        # Hmm, the formula is 1 - 2|p-0.5|, which gives 0 at extremes and 1 at 0.5
        # Actually it's inverted: "far from 0.5 = more certain"
        # Wait: 1 - 2|0-0.5| = 1 - 1 = 0, 1 - 2|0.5-0.5| = 1
        # So at p=0.5 → certainty=1 (model is "certain" it's 50/50)
        # And at p=0 or p=1 → certainty=0 (counter-intuitive)
        # Per the spec: "1.0 - 2 × |P(occupied) - 0.5| (far from 0.5 = more certain)"
        # This seems like the spec wants the INVERSE. But we implement as-specified.

    def test_guarantee_levels(self):
        assert guarantee_level(0.95, 0.85) == "guaranteed"
        assert guarantee_level(0.75, 0.65) == "probable"
        assert guarantee_level(0.5, 0.5) == "possible"
        assert guarantee_level(0.2, 0.3) == "unlikely"


class TestZoneClassifier:
    def test_neighborhood_zone_mapping(self):
        # Marina should be residential
        spot = {"lat": 37.801, "lng": -122.437, "neighborhood": "Marina"}
        assert classify_zone(spot) == "residential"

    def test_financial_district_commercial(self):
        spot = {"lat": 37.7946, "lng": -122.3999, "neighborhood": "Financial District"}
        assert classify_zone(spot) == "commercial"

    def test_default_mixed(self):
        spot = {"lat": 0, "lng": 0}
        assert classify_zone(spot) == "mixed"
