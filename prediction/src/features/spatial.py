"""Spatial feature extraction: lat/lng, neighborhood, meter density.

Features 24-31 in the feature matrix.
Uses KDTree for fast nearest-neighbor queries on parking meters.
"""

from __future__ import annotations

import math
import logging
from datetime import datetime
from functools import lru_cache

import numpy as np

from src.db import query
from src.config import neighborhoods as get_neighborhoods

logger = logging.getLogger(__name__)

# Earth radius in meters
_R = 6_371_000

# Neighborhood name → integer ID mapping
_NEIGHBORHOOD_IDS = {
    "Financial District": 0,
    "SoMa": 1,
    "Mission": 2,
    "Fisherman's Wharf / North Beach": 3,
    "Marina": 4,
    "Civic Center / Hayes Valley": 5,
    "Union Square": 6,
    "Chinatown": 7,
    "Castro": 8,
    "Haight-Ashbury": 9,
}


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance in meters between two lat/lng points."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return _R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def meters_to_degrees(meters: float, lat: float) -> tuple[float, float]:
    """Approximate conversion from meters to (lat_deg, lng_deg)."""
    lat_deg = meters / 111_320
    lng_deg = meters / (111_320 * math.cos(math.radians(lat)))
    return lat_deg, lng_deg


class MeterIndex:
    """Spatial index of parking meters for nearest-neighbor queries."""

    def __init__(self):
        self._meters = []  # list of (post_id, lat, lng)
        self._coords = None  # np.array of (lat, lng) in radians for fast distance
        self._loaded = False

    def load(self):
        """Load all parking meters from DB into memory."""
        rows = query("SELECT post_id, lat, lng FROM parking_meters WHERE lat IS NOT NULL")
        self._meters = [(r["post_id"], r["lat"], r["lng"]) for r in rows]
        if self._meters:
            coords = [(math.radians(m[1]), math.radians(m[2])) for m in self._meters]
            self._coords = np.array(coords)
        else:
            self._coords = np.empty((0, 2))
        self._loaded = True
        logger.info("MeterIndex loaded %d meters", len(self._meters))

    def _ensure_loaded(self):
        if not self._loaded:
            self.load()

    def nearest(self, lat: float, lng: float, k: int = 1) -> list[tuple[str, float]]:
        """Find k nearest meters. Returns list of (post_id, distance_m)."""
        self._ensure_loaded()
        if len(self._meters) == 0:
            return []

        # Vectorized approximate distance using equirectangular projection
        phi = math.radians(lat)
        lam = math.radians(lng)
        dphi = self._coords[:, 0] - phi
        dlam = (self._coords[:, 1] - lam) * math.cos(phi)
        dists = _R * np.sqrt(dphi ** 2 + dlam ** 2)

        if k >= len(self._meters):
            indices = np.argsort(dists)
        else:
            indices = np.argpartition(dists, k)[:k]
            indices = indices[np.argsort(dists[indices])]

        return [(self._meters[i][0], float(dists[i])) for i in indices]

    def count_within(self, lat: float, lng: float, radius_m: float) -> int:
        """Count meters within radius_m of a point."""
        self._ensure_loaded()
        if len(self._meters) == 0:
            return 0

        phi = math.radians(lat)
        lam = math.radians(lng)
        dphi = self._coords[:, 0] - phi
        dlam = (self._coords[:, 1] - lam) * math.cos(phi)
        dists = _R * np.sqrt(dphi ** 2 + dlam ** 2)
        return int(np.sum(dists <= radius_m))


# Garage index for nearest-garage distance
class GarageIndex:
    """Spatial index of garages."""

    def __init__(self):
        self._garages = []
        self._loaded = False

    def load(self):
        rows = query("SELECT garage_id, lat, lng FROM garages WHERE lat IS NOT NULL")
        self._garages = [(r["garage_id"], r["lat"], r["lng"]) for r in rows]
        self._loaded = True

    def nearest_distance(self, lat: float, lng: float) -> float:
        """Return distance in meters to nearest garage, or NaN if none."""
        if not self._loaded:
            self.load()
        if not self._garages:
            return float("nan")
        return min(haversine(lat, lng, g[1], g[2]) for g in self._garages)


# Module-level singletons
_meter_index = MeterIndex()
_garage_index = GarageIndex()


def get_meter_index() -> MeterIndex:
    return _meter_index


def get_garage_index() -> GarageIndex:
    return _garage_index


def classify_neighborhood(lat: float, lng: float) -> tuple[str | None, int]:
    """Return (neighborhood_name, neighborhood_id) for a point."""
    nbhds = get_neighborhoods()
    best_name = None
    best_dist = float("inf")
    for key, nbhd in nbhds.items():
        dist = haversine(lat, lng, nbhd["lat"], nbhd["lng"])
        if dist < nbhd["radius_m"] and dist < best_dist:
            best_dist = dist
            best_name = nbhd.get("name", key)
    nid = _NEIGHBORHOOD_IDS.get(best_name, -1)
    return best_name, nid


def compute(spot: dict, timestamp: datetime) -> dict:
    """Compute spatial features for a spot.

    Args:
        spot: dict with at least 'lat', 'lng', optionally 'neighborhood'
        timestamp: not used for spatial features (time-invariant)

    Returns:
        dict with feature names → values
    """
    lat = spot["lat"]
    lng = spot["lng"]

    # Nearest meters
    nearest = _meter_index.nearest(lat, lng, k=3)
    dist_nearest = nearest[0][1] if nearest else float("nan")
    meters_100 = _meter_index.count_within(lat, lng, 100)
    meters_200 = _meter_index.count_within(lat, lng, 200)

    # Neighborhood
    nbhd_name = spot.get("neighborhood")
    if nbhd_name:
        nbhd_id = _NEIGHBORHOOD_IDS.get(nbhd_name, -1)
    else:
        nbhd_name, nbhd_id = classify_neighborhood(lat, lng)

    # Nearest garage
    dist_garage = _garage_index.nearest_distance(lat, lng)

    # Block density: approximate from meters within 100m / 200m of street length
    block_density = meters_200 / 4.0 if meters_200 > 0 else 0.0  # ~4 × 100m segments

    return {
        "lat": lat,
        "lng": lng,
        "neighborhood_id": nbhd_id,
        "dist_to_nearest_meter": dist_nearest,
        "meters_within_100m": meters_100,
        "meters_within_200m": meters_200,
        "block_density": block_density,
        "dist_to_nearest_garage": dist_garage,
    }


FEATURE_NAMES = [
    "lat", "lng", "neighborhood_id",
    "dist_to_nearest_meter", "meters_within_100m", "meters_within_200m",
    "block_density", "dist_to_nearest_garage",
]
