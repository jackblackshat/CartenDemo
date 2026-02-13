"""Tests for Pydantic schemas."""

from src.serving.schemas import (
    PredictRequest,
    PredictResponse,
    SpotPrediction,
    ConfidenceDetail,
    TimerDecayDetail,
    PredictMeta,
    ReportRequest,
    HealthResponse,
    BlockResponse,
    BlockSummary,
)


class TestPredictRequest:
    def test_defaults(self):
        req = PredictRequest(lat=37.79, lng=-122.40)
        assert req.radius_m == 500
        assert req.limit == 50
        assert req.tier == "free"
        assert req.time is None

    def test_validation(self):
        req = PredictRequest(lat=37.79, lng=-122.40, radius_m=100, limit=10, tier="pro")
        assert req.radius_m == 100


class TestSpotPrediction:
    def test_construction(self):
        pred = SpotPrediction(
            spot_id=1,
            street="Market St",
            lat=37.79,
            lng=-122.40,
            p_free=0.75,
            guarantee_level="probable",
            confidence=ConfidenceDetail(score=0.65, tier="medium", sources={}),
            time_decay=TimerDecayDetail(
                half_life_minutes=30,
                valid_for_minutes=52,
                future_confidence={"1min": 0.74, "3min": 0.71, "5min": 0.68, "10min": 0.60},
            ),
            turnover_rate=2.0,
            zone_type="commercial",
            distance_m=150.5,
        )
        assert pred.p_free == 0.75
        assert pred.guarantee_level == "probable"


class TestReportRequest:
    def test_spot_free(self):
        req = ReportRequest(lat=37.79, lng=-122.40, report_type="spot_free")
        assert req.report_type == "spot_free"
        assert req.confidence == 0.5


class TestHealthResponse:
    def test_construction(self):
        h = HealthResponse(
            status="ok",
            model_loaded=True,
            db_connected=True,
            spots_indexed=5827,
        )
        assert h.spots_indexed == 5827
