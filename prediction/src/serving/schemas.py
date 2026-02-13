"""Pydantic request/response models for the prediction API."""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional


class PredictRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    radius_m: float = Field(500, ge=50, le=2000, description="Search radius in meters")
    time: Optional[str] = Field(None, description="ISO 8601 timestamp (defaults to now)")
    limit: int = Field(50, ge=1, le=200, description="Max results")
    tier: str = Field("free", description="User tier: 'free' or 'pro'")


class ConfidenceDetail(BaseModel):
    score: float
    tier: str  # high, medium, low
    sources: dict


class TimerDecayDetail(BaseModel):
    half_life_minutes: float
    valid_for_minutes: float
    future_confidence: dict  # { '1min': float, '3min': float, '5min': float, '10min': float }


class SpotPrediction(BaseModel):
    spot_id: Optional[int] = None
    street: str = ""
    lat: float
    lng: float
    p_free: float
    guarantee_level: str  # guaranteed, probable, possible, unlikely
    confidence: ConfidenceDetail
    time_decay: TimerDecayDetail
    turnover_rate: float
    zone_type: str
    restrictions: list[str] = []
    distance_m: float = 0
    neighborhood: str = ""


class GarageInfo(BaseModel):
    garage_id: str
    name: str
    lat: float
    lng: float
    total_spaces: Optional[int] = None
    available_spaces: Optional[int] = None
    hourly_rate: Optional[float] = None
    distance_m: float


class PredictMeta(BaseModel):
    model_version: str = "1.0.0"
    prediction_time_ms: float
    total_spots_searched: int
    timestamp: str


class PredictResponse(BaseModel):
    predictions: list[SpotPrediction]
    nearby_garages: list[GarageInfo] = []
    meta: PredictMeta


class BlockSummary(BaseModel):
    street: str
    neighborhood: str
    total_spots: int
    avg_p_free: float
    best_p_free: float
    zone_type: str


class BlockResponse(BaseModel):
    blocks: list[BlockSummary]
    meta: PredictMeta


class ReportRequest(BaseModel):
    user_id: Optional[str] = None
    spot_id: Optional[int] = None
    lat: float
    lng: float
    report_type: str  # 'spot_free' or 'spot_taken'
    confidence: float = Field(0.5, ge=0, le=1)


class ReportResponse(BaseModel):
    report_id: int
    message: str = "Report received"


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    db_connected: bool
    spots_indexed: int
