"""Background polling for real-time signals: traffic, weather, events, garages.

Uses APScheduler to run periodic fetch jobs. Invalidates prediction cache
when new signals arrive.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from src.config import get_config
from src.serving import cache

logger = logging.getLogger(__name__)

_scheduler = None


def _poll_traffic():
    """Fetch latest traffic data."""
    try:
        from src.data.ingest_traffic import ingest_all
        ingest_all()
        cache.invalidate_all()
    except Exception as e:
        logger.error("Traffic poll failed: %s", e)


def _poll_weather():
    """Fetch latest weather data."""
    try:
        from src.data.ingest_weather import ingest
        ingest()
        cache.invalidate_all()
    except Exception as e:
        logger.error("Weather poll failed: %s", e)


def _poll_events():
    """Fetch latest event data."""
    try:
        from src.data.ingest_events import ingest_all
        ingest_all()
        cache.invalidate_all()
    except Exception as e:
        logger.error("Events poll failed: %s", e)


def _poll_garages():
    """Fetch latest garage availability."""
    try:
        from src.data.ingest_garages import ingest
        ingest()
    except Exception as e:
        logger.error("Garage poll failed: %s", e)


def start_polling():
    """Start background polling scheduler."""
    global _scheduler
    if _scheduler is not None:
        return

    cfg = get_config()["realtime"]

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        _poll_traffic, "interval",
        seconds=cfg["traffic_interval"],
        id="traffic",
        next_run_time=None,  # Don't run immediately (let startup complete)
    )
    _scheduler.add_job(
        _poll_weather, "interval",
        seconds=cfg["weather_interval"],
        id="weather",
        next_run_time=None,
    )
    _scheduler.add_job(
        _poll_events, "interval",
        seconds=cfg["events_interval"],
        id="events",
        next_run_time=None,
    )
    _scheduler.add_job(
        _poll_garages, "interval",
        seconds=cfg["garages_interval"],
        id="garages",
        next_run_time=None,
    )

    _scheduler.start()
    logger.info(
        "Realtime polling started — traffic: %ds, weather: %ds, events: %ds, garages: %ds",
        cfg["traffic_interval"], cfg["weather_interval"],
        cfg["events_interval"], cfg["garages_interval"],
    )


def stop_polling():
    """Stop background polling."""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Realtime polling stopped")
