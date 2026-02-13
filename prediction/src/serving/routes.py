"""FastAPI route handlers: POST /predict, GET /blocks, POST /report, GET /health."""

from __future__ import annotations

import logging
import time
from datetime import datetime

from fastapi import APIRouter, HTTPException

from src.db import get_connection, insert_returning_id, query
from src.config import get_config
from src.model.ensemble import predict_spot
from src.features.spatial import haversine, get_meter_index, get_garage_index
from src.serving.spatial_index import get_spot_index
from src.serving import cache
from src.serving.schemas import (
    PredictRequest,
    PredictResponse,
    SpotPrediction,
    GarageInfo,
    PredictMeta,
    BlockResponse,
    BlockSummary,
    ReportRequest,
    ReportResponse,
    HealthResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _apply_privacy_gating(prediction: dict, distance_m: float, tier: str) -> dict:
    """Apply distance-based privacy gating.

    Free tier: block-level only (remove exact lat/lng, fuzz to ~100m)
    Pro tier: exact within 200m, ~50m fuzz 200-400m, block beyond
    """
    cfg = get_config()["privacy"]

    if tier == "pro":
        pro_cfg = cfg["pro_tier"]
        if distance_m <= pro_cfg["exact_within_m"]:
            return prediction  # exact coords
        elif distance_m <= pro_cfg["fuzzy_within_m"]:
            import random
            fuzz = pro_cfg["fuzz_meters"]
            # Add random offset ~50m
            offset_lat = (random.random() - 0.5) * 2 * fuzz / 111_320
            offset_lng = (random.random() - 0.5) * 2 * fuzz / (111_320 * 0.788)
            prediction["lat"] = round(prediction["lat"] + offset_lat, 5)
            prediction["lng"] = round(prediction["lng"] + offset_lng, 5)
            return prediction
        # Beyond 400m: block-level
    # Free tier or beyond pro range: block-level
    prediction["lat"] = round(prediction["lat"], 3)  # ~111m precision
    prediction["lng"] = round(prediction["lng"], 3)
    return prediction


def _get_nearby_garages(lat: float, lng: float, radius_m: float) -> list[GarageInfo]:
    """Fetch nearby garages with availability."""
    rows = query(
        """SELECT g.garage_id, g.name, g.lat, g.lng, g.total_spaces, g.hourly_rate,
                  ga.available_spaces
           FROM garages g
           LEFT JOIN garage_availability ga ON g.garage_id = ga.garage_id
             AND ga.timestamp = (SELECT MAX(timestamp) FROM garage_availability WHERE garage_id = g.garage_id)
           WHERE g.lat IS NOT NULL AND g.lng IS NOT NULL"""
    )

    garages = []
    for r in rows:
        dist = haversine(lat, lng, r["lat"], r["lng"])
        if dist <= radius_m * 2:  # Garages searched in wider radius
            garages.append(GarageInfo(
                garage_id=r["garage_id"],
                name=r["name"] or "",
                lat=r["lat"],
                lng=r["lng"],
                total_spaces=r["total_spaces"],
                available_spaces=r["available_spaces"],
                hourly_rate=r["hourly_rate"],
                distance_m=round(dist, 1),
            ))
    garages.sort(key=lambda g: g.distance_m)
    return garages[:10]


@router.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    """Predict P(free) for nearby spots."""
    start_time = time.time()

    # Parse timestamp
    if req.time:
        try:
            timestamp = datetime.fromisoformat(req.time)
        except ValueError:
            raise HTTPException(400, "Invalid time format. Use ISO 8601.")
    else:
        timestamp = datetime.now()

    # Check cache
    cached = cache.get(req.lat, req.lng, timestamp, req.radius_m)
    if cached is not None:
        return cached

    # Spatial query: find nearby spots
    spot_index = get_spot_index()
    nearby = spot_index.query_nearby(req.lat, req.lng, req.radius_m, req.limit)

    if not nearby:
        elapsed = (time.time() - start_time) * 1000
        return PredictResponse(
            predictions=[],
            nearby_garages=_get_nearby_garages(req.lat, req.lng, req.radius_m),
            meta=PredictMeta(
                prediction_time_ms=round(elapsed, 1),
                total_spots_searched=0,
                timestamp=timestamp.isoformat(),
            ),
        )

    # Predict for each spot
    predictions = []
    for spot in nearby:
        pred = predict_spot(spot, timestamp)
        pred["distance_m"] = spot["distance_m"]

        # Apply privacy gating
        pred = _apply_privacy_gating(pred, spot["distance_m"], req.tier)

        predictions.append(SpotPrediction(**pred))

    # Sort by p_free descending (best spots first)
    predictions.sort(key=lambda p: p.p_free, reverse=True)

    # Garages
    garages = _get_nearby_garages(req.lat, req.lng, req.radius_m)

    elapsed = (time.time() - start_time) * 1000
    response = PredictResponse(
        predictions=predictions,
        nearby_garages=garages,
        meta=PredictMeta(
            prediction_time_ms=round(elapsed, 1),
            total_spots_searched=len(nearby),
            timestamp=timestamp.isoformat(),
        ),
    )

    # Cache result
    cache.put(req.lat, req.lng, timestamp, req.radius_m, response)

    return response


@router.get("/blocks", response_model=BlockResponse)
async def get_blocks(
    lat: float,
    lng: float,
    radius_m: float = 500,
):
    """Get block-level aggregated predictions (safe for all tiers)."""
    start_time = time.time()
    timestamp = datetime.now()

    spot_index = get_spot_index()
    nearby = spot_index.query_nearby(lat, lng, radius_m, limit=200)

    # Group by street + neighborhood
    blocks: dict[str, list] = {}
    for spot in nearby:
        pred = predict_spot(spot, timestamp)
        key = f"{spot.get('street_name', 'Unknown')}|{spot.get('neighborhood', '')}"
        if key not in blocks:
            blocks[key] = []
        blocks[key].append(pred)

    block_summaries = []
    for key, preds in blocks.items():
        street, nbhd = key.split("|", 1)
        p_frees = [p["p_free"] for p in preds]
        block_summaries.append(BlockSummary(
            street=street,
            neighborhood=nbhd,
            total_spots=len(preds),
            avg_p_free=round(sum(p_frees) / len(p_frees), 3),
            best_p_free=round(max(p_frees), 3),
            zone_type=preds[0].get("zone_type", "mixed"),
        ))

    block_summaries.sort(key=lambda b: b.avg_p_free, reverse=True)

    elapsed = (time.time() - start_time) * 1000
    return BlockResponse(
        blocks=block_summaries,
        meta=PredictMeta(
            prediction_time_ms=round(elapsed, 1),
            total_spots_searched=len(nearby),
            timestamp=timestamp.isoformat(),
        ),
    )


@router.post("/report", response_model=ReportResponse)
async def submit_report(req: ReportRequest):
    """Submit a crowd report for a spot."""
    if req.report_type not in ("spot_free", "spot_taken"):
        raise HTTPException(400, "report_type must be 'spot_free' or 'spot_taken'")

    report_id = insert_returning_id("crowd_reports", {
        "user_id": req.user_id,
        "spot_id": req.spot_id,
        "lat": req.lat,
        "lng": req.lng,
        "report_type": req.report_type,
        "reported_at": datetime.now().isoformat(),
        "confidence": req.confidence,
    })

    # Invalidate cache near the report
    cache.invalidate_area(req.lat, req.lng)

    return ReportResponse(report_id=report_id)


@router.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    from src.model import occupancy

    spot_index = get_spot_index()

    # Check DB
    db_ok = False
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        pass

    return HealthResponse(
        status="ok" if occupancy.is_loaded() and db_ok else "degraded",
        model_loaded=occupancy.is_loaded(),
        db_connected=db_ok,
        spots_indexed=spot_index.count() if spot_index.is_loaded() else 0,
    )
