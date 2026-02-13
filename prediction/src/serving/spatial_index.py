"""R-tree spatial index for fast nearby-spot lookup.

Loads all 5,827 free_parking_spots into an R-tree at startup.
query_nearby(lat, lng, radius_m) returns spots in <1ms.
"""

from __future__ import annotations

import logging
import math

from rtree import index as rtree_index

from src.db import query
from src.features.spatial import haversine, meters_to_degrees

logger = logging.getLogger(__name__)


class SpotIndex:
    """R-tree index over free_parking_spots for fast spatial queries."""

    def __init__(self):
        self._idx = None
        self._spots = {}  # spot_id → spot dict
        self._loaded = False

    def load(self):
        """Load all free_parking_spots into the R-tree."""
        rows = query(
            """SELECT spot_id, lat, lng, street_name, neighborhood,
                      time_limit, hours, days, permit_zone,
                      sweeping_schedule, curb_color, confidence_score,
                      data_sources, zone_id
               FROM free_parking_spots
               WHERE lat IS NOT NULL AND lng IS NOT NULL"""
        )

        p = rtree_index.Property()
        p.dimension = 2
        self._idx = rtree_index.Index(properties=p)
        self._spots = {}

        for row in rows:
            sid = row["spot_id"]
            self._spots[sid] = dict(row)
            # R-tree uses (minx, miny, maxx, maxy) = (lng, lat, lng, lat) for points
            self._idx.insert(sid, (row["lng"], row["lat"], row["lng"], row["lat"]))

        self._loaded = True
        logger.info("SpotIndex loaded %d spots into R-tree", len(self._spots))

    def is_loaded(self) -> bool:
        return self._loaded

    def count(self) -> int:
        return len(self._spots)

    def query_nearby(
        self, lat: float, lng: float, radius_m: float, limit: int = 50
    ) -> list[dict]:
        """Find spots within radius_m of (lat, lng).

        Returns list of spot dicts with added 'distance_m' field,
        sorted by distance ascending.
        """
        if not self._loaded:
            self.load()

        # Expand to bounding box
        lat_off, lng_off = meters_to_degrees(radius_m, lat)
        bbox = (lng - lng_off, lat - lat_off, lng + lng_off, lat + lat_off)

        candidates = list(self._idx.intersection(bbox))
        results = []

        for sid in candidates:
            spot = self._spots[sid]
            dist = haversine(lat, lng, spot["lat"], spot["lng"])
            if dist <= radius_m:
                result = dict(spot)
                result["distance_m"] = round(dist, 1)
                results.append(result)

        # Sort by distance, limit
        results.sort(key=lambda s: s["distance_m"])
        return results[:limit]

    def get_spot(self, spot_id: int) -> dict | None:
        """Get a spot by ID."""
        return self._spots.get(spot_id)


# Module-level singleton
_spot_index = SpotIndex()


def get_spot_index() -> SpotIndex:
    return _spot_index
