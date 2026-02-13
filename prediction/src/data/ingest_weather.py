"""Ingest OpenWeatherMap current weather data into realtime_signals.

Uses free tier (1000 calls/day). Single API call for SF center.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta

import requests

from src.db import get_connection

logger = logging.getLogger(__name__)

_OWM_URL = "https://api.openweathermap.org/data/2.5/weather"
_SF_LAT = 37.7749
_SF_LNG = -122.4194


def fetch_weather() -> dict | None:
    """Fetch current weather for San Francisco."""
    api_key = os.environ.get("OPENWEATHERMAP_API_KEY")
    if not api_key:
        logger.debug("OPENWEATHERMAP_API_KEY not configured")
        return None

    try:
        resp = requests.get(
            _OWM_URL,
            params={
                "lat": _SF_LAT,
                "lon": _SF_LNG,
                "appid": api_key,
                "units": "imperial",
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        weather_main = data.get("weather", [{}])[0].get("main", "")
        is_raining = weather_main.lower() in ("rain", "drizzle", "thunderstorm")

        return {
            "is_raining": is_raining,
            "temperature_f": data.get("main", {}).get("temp"),
            "humidity": data.get("main", {}).get("humidity"),
            "weather_main": weather_main,
            "weather_description": data.get("weather", [{}])[0].get("description", ""),
            "wind_speed_mph": data.get("wind", {}).get("speed"),
        }

    except Exception as e:
        logger.error("Weather fetch failed: %s", e)
        return None


def ingest():
    """Fetch weather and store in realtime_signals."""
    data = fetch_weather()
    if not data:
        return

    now = datetime.now().isoformat()
    expires = (datetime.now() + timedelta(minutes=30)).isoformat()

    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO realtime_signals
               (signal_type, lat, lng, neighborhood, value_json, fetched_at, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            ("weather", _SF_LAT, _SF_LNG, "sf_global",
             json.dumps(data), now, expires),
        )
        conn.commit()
    finally:
        conn.close()

    logger.info("Ingested weather: %s, %.0f°F", data.get("weather_main"), data.get("temperature_f", 0))


if __name__ == "__main__":
    from src.config import setup_logging
    setup_logging()
    ingest()
