"""Ingest nearby events from Eventbrite/Ticketmaster into realtime_signals.

Searches for events happening now or within the next few hours
near each of the 10 SF neighborhoods.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta

import requests

from src.config import neighborhoods
from src.db import get_connection

logger = logging.getLogger(__name__)

_TM_URL = "https://app.ticketmaster.com/discovery/v2/events.json"


def fetch_events_ticketmaster(lat: float, lng: float, radius_km: float = 1) -> list[dict]:
    """Fetch events near a location from Ticketmaster Discovery API."""
    api_key = os.environ.get("TICKETMASTER_API_KEY")
    if not api_key:
        return []

    now = datetime.utcnow()
    end = now + timedelta(hours=6)

    try:
        resp = requests.get(
            _TM_URL,
            params={
                "apikey": api_key,
                "latlong": f"{lat},{lng}",
                "radius": str(int(radius_km)),
                "unit": "km",
                "startDateTime": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "endDateTime": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "size": 20,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        events = []
        for event in data.get("_embedded", {}).get("events", []):
            venue = event.get("_embedded", {}).get("venues", [{}])[0]
            events.append({
                "name": event.get("name", ""),
                "venue": venue.get("name", ""),
                "start_time": event.get("dates", {}).get("start", {}).get("dateTime"),
                "lat": float(venue.get("location", {}).get("latitude", 0)),
                "lng": float(venue.get("location", {}).get("longitude", 0)),
            })
        return events

    except Exception as e:
        logger.error("Ticketmaster fetch failed: %s", e)
        return []


def ingest_all():
    """Fetch events for all neighborhoods and store in realtime_signals."""
    nbhds = neighborhoods()
    now = datetime.now().isoformat()
    expires = (datetime.now() + timedelta(hours=2)).isoformat()

    conn = get_connection()
    count = 0
    try:
        for key, nbhd in nbhds.items():
            events = fetch_events_ticketmaster(nbhd["lat"], nbhd["lng"])
            if events:
                conn.execute(
                    """INSERT INTO realtime_signals
                       (signal_type, lat, lng, neighborhood, value_json, fetched_at, expires_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    ("event", nbhd["lat"], nbhd["lng"], key,
                     json.dumps({"events": events, "count": len(events)}),
                     now, expires),
                )
                count += 1
        conn.commit()
    finally:
        conn.close()

    logger.info("Ingested events for %d neighborhoods", count)


if __name__ == "__main__":
    from src.config import setup_logging
    setup_logging()
    ingest_all()
