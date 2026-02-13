"""FastAPI application with lifespan: load models + spatial index on startup."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import setup_logging, get_config
from src.db import init_prediction_tables
from src.model.ensemble import load_models
from src.features.spatial import get_meter_index
from src.serving.spatial_index import get_spot_index
from src.serving.routes import router
from src.serving.realtime import start_polling, stop_polling

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, load models, build spatial index, start polling."""
    setup_logging()
    logger.info("Starting Carten Prediction Engine...")

    # Initialize database tables
    init_prediction_tables()

    # Load spatial indexes
    meter_index = get_meter_index()
    meter_index.load()

    spot_index = get_spot_index()
    spot_index.load()

    # Load ML models
    load_models()

    # Start real-time signal polling
    start_polling()

    logger.info("Prediction engine ready.")
    yield
    stop_polling()
    logger.info("Shutting down prediction engine.")


app = FastAPI(
    title="Carten Prediction Engine",
    description="ML-powered parking availability predictions for San Francisco",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
