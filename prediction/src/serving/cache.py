"""TTL cache for predictions.

Keyed on (round(lat,3), round(lng,3), time_bucket_15min).
Invalidated when real-time signals update.
"""

from __future__ import annotations

import logging
from datetime import datetime
from cachetools import TTLCache

from src.config import get_config

logger = logging.getLogger(__name__)

_cache = None


def _get_cache() -> TTLCache:
    global _cache
    if _cache is None:
        cfg = get_config()
        ttl = cfg["serving"]["cache_ttl_seconds"]
        _cache = TTLCache(maxsize=4096, ttl=ttl)
    return _cache


def _make_key(lat: float, lng: float, timestamp: datetime, radius_m: float) -> str:
    """Create a cache key from location + time bucket."""
    lat_r = round(lat, 3)
    lng_r = round(lng, 3)
    # 15-minute time bucket
    bucket = timestamp.hour * 4 + timestamp.minute // 15
    return f"{lat_r}:{lng_r}:{timestamp.date()}:{bucket}:{int(radius_m)}"


def get(lat: float, lng: float, timestamp: datetime, radius_m: float):
    """Get cached prediction response, or None."""
    cache = _get_cache()
    key = _make_key(lat, lng, timestamp, radius_m)
    return cache.get(key)


def put(lat: float, lng: float, timestamp: datetime, radius_m: float, value):
    """Cache a prediction response."""
    cache = _get_cache()
    key = _make_key(lat, lng, timestamp, radius_m)
    cache[key] = value


def invalidate_all():
    """Clear the entire cache (e.g., after realtime signal update)."""
    global _cache
    if _cache is not None:
        _cache.clear()
        logger.info("Prediction cache cleared")


def invalidate_area(lat: float, lng: float, radius_m: float = 500):
    """Invalidate cache entries near a point.

    Since cachetools TTLCache doesn't support partial key matching,
    we clear the whole cache. For a production system, use a more
    sophisticated cache with spatial keys.
    """
    invalidate_all()
