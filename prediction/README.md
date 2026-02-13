# Carten Prediction Engine

ML-powered parking availability predictions for San Francisco. Uses XGBoost models trained on 36 months of meter transaction data, combined with real-time signals (traffic, weather, events), to predict P(free) for 5,827 free parking spots across 10 SF neighborhoods.

## Architecture

```
Mobile App (React Native)
    │
    ▼
Express Server :4000
  /spot-intelligence ──► proxies to Python
    │
    ▼
FastAPI Server :8000       (this service)
  POST /predict
  GET  /blocks
  POST /report
  GET  /health
    │
    ├── Occupancy Model (XGBoost Classifier) ── P(occupied) per spot
    ├── Transfer Layer ── Meter → free-spot calibration
    └── Turnover Model (XGBoost Regressor) ── sessions/hour
    │
    ▼
sf_parking.db (SQLite)
```

## Quick Start

```bash
cd prediction

# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up environment variables (see below)
cp .env.example .env
# Edit .env with your API keys

# 3. Start the prediction server
make serve
# Server runs at http://localhost:8000
```

## Environment Variables

Create a `.env` file in the `prediction/` directory:

```bash
# ── Required ──────────────────────────────────────────────
# Database path is configured in config.yaml (default: ../../sf-free-parking/db/sf_parking.db)
# The sf_parking.db must exist with free_parking_spots table (from the sf-free-parking pipeline)

# ── Optional: INRIX Traffic ───────────────────────────────
# Reuse credentials from CartenDemo/server/.env
APP_ID=your_inrix_app_id
HASH_TOKEN=your_inrix_hash_token
AUTH_TOKEN_URL=https://api.iq.inrix.com/auth/v1/appToken

# ── Optional: OpenWeatherMap ──────────────────────────────
# Free tier: 1000 calls/day. Sign up at https://openweathermap.org/api
OPENWEATHERMAP_API_KEY=your_owm_api_key

# ── Optional: Ticketmaster Events ─────────────────────────
# Free tier. Sign up at https://developer.ticketmaster.com/
TICKETMASTER_API_KEY=your_ticketmaster_api_key
```

**Note:** All external API keys are optional. The prediction engine runs without them using historical patterns only. Real-time signals (traffic, weather, events) enhance accuracy but are not required.

## Make Commands

| Command | Description |
|---------|-------------|
| `make install` | Install Python dependencies |
| `make serve` | Start FastAPI dev server on :8000 with hot reload |
| `make ingest` | Ingest 36-month meter transaction CSV into SQLite |
| `make train` | Build training data matrix + train XGBoost models |
| `make evaluate` | Evaluate models (AUC-ROC, Brier score, per-zone) |
| `make retrain` | Incremental retrain with crowd report data |
| `make test` | Run pytest test suite |
| `make clean` | Remove model artifacts and training data |

## API Endpoints

### `POST /predict`

Predict parking availability for spots near a location.

**Request:**
```json
{
  "lat": 37.7946,
  "lng": -122.3999,
  "radius_m": 500,
  "time": "2025-03-15T14:30:00",
  "limit": 20,
  "tier": "free"
}
```

- `time` (optional) — ISO 8601 timestamp, defaults to now
- `tier` — `"free"` (block-level precision) or `"pro"` (exact coords within 200m)

**Response:**
```json
{
  "predictions": [
    {
      "spot_id": 42,
      "street": "battery st, financial district",
      "lat": 37.7920,
      "lng": -122.4005,
      "p_free": 0.73,
      "guarantee_level": "probable",
      "confidence": {
        "score": 0.68,
        "tier": "medium",
        "sources": { "meter_data": 0.85, "spatial": 0.6, "realtime": 0.4, "model": 0.72 }
      },
      "time_decay": {
        "half_life_minutes": 30.0,
        "valid_for_minutes": 12.5,
        "future_confidence": { "1min": 0.72, "3min": 0.70, "5min": 0.67, "10min": 0.61 }
      },
      "turnover_rate": 2.0,
      "zone_type": "commercial",
      "restrictions": ["2hr limit Mon-Sat 8AM-6PM"],
      "distance_m": 150.3,
      "neighborhood": "financial_district"
    }
  ],
  "nearby_garages": [...],
  "meta": {
    "model_version": "1.0.0",
    "prediction_time_ms": 23.5,
    "total_spots_searched": 45,
    "timestamp": "2025-03-15T14:30:00"
  }
}
```

### `GET /blocks?lat=37.79&lng=-122.40&radius_m=500`

Block-level aggregated predictions (safe for all tiers, no exact coordinates).

**Response:**
```json
{
  "blocks": [
    {
      "street": "Battery St",
      "neighborhood": "financial_district",
      "total_spots": 8,
      "avg_p_free": 0.65,
      "best_p_free": 0.82,
      "zone_type": "commercial"
    }
  ],
  "meta": { ... }
}
```

### `POST /report`

Submit a crowd report (user-reported spot status).

**Request:**
```json
{
  "user_id": "user_abc",
  "spot_id": 42,
  "lat": 37.7920,
  "lng": -122.4005,
  "report_type": "spot_free",
  "confidence": 0.9
}
```

### `GET /health`

Health check — returns model status, DB connectivity, and indexed spot count.

```json
{
  "status": "ok",
  "model_loaded": true,
  "db_connected": true,
  "spots_indexed": 5827
}
```

## Project Structure

```
prediction/
├── README.md
├── requirements.txt          # Python dependencies
├── config.yaml               # Model params, neighborhoods, privacy gating, polling intervals
├── Makefile                  # Build/serve/train commands
├── models/                   # Saved .joblib model artifacts (after training)
├── notebooks/                # EDA notebooks
├── tests/                    # Pytest tests
└── src/
    ├── config.py             # YAML loader, .env reader, path resolution
    ├── db.py                 # SQLite schema + helpers (reuses sf_parking.db)
    ├── data/
    │   ├── ingest_meters.py      # 36mo meter CSV → meter_transactions table
    │   ├── ingest_traffic.py     # INRIX speed/congestion → realtime_signals
    │   ├── ingest_weather.py     # OpenWeatherMap → realtime_signals
    │   ├── ingest_events.py      # Ticketmaster events → realtime_signals
    │   ├── ingest_garages.py     # SFpark garage availability
    │   └── feature_store.py      # Plugin registry for future data sources
    ├── features/
    │   ├── temporal.py           # Cyclic encoding, holidays, rush hour (16 features)
    │   ├── spatial.py            # KDTree, nearest meters, density (8 features)
    │   ├── meter_patterns.py     # Occupancy/turnover from 36mo data (7 features)
    │   ├── sweeping.py           # Sweeping schedule parsing (4 features)
    │   ├── sign_rules.py         # Time limits, curb colors, signs (5 features)
    │   ├── zone_classifier.py    # Residential/commercial/restaurant/gym/mixed
    │   ├── traffic.py            # INRIX speed ratios (3 features)
    │   ├── weather.py            # Rain, temperature (2 features)
    │   └── events.py             # Nearby active events (1 feature)
    ├── model/
    │   ├── occupancy.py          # XGBoost classifier: P(occupied)
    │   ├── turnover.py           # XGBoost regressor: sessions/hour
    │   ├── transfer.py           # Meter → free-spot calibration multipliers
    │   ├── confidence.py         # Multi-source confidence scoring
    │   ├── time_decay.py         # Exponential decay toward 0.5
    │   ├── calibration.py        # Platt scaling per zone
    │   └── ensemble.py           # Chains occupancy → transfer → turnover → decay
    ├── pipeline/
    │   ├── build_training_data.py # Meter × 15-min → feature matrix (parquet)
    │   ├── train.py              # Train occupancy + turnover, Platt calibrate
    │   ├── evaluate.py           # AUC-ROC, Brier, per-zone breakdowns
    │   └── retrain.py            # Incremental retrain with crowd data
    └── serving/
        ├── app.py                # FastAPI app + lifespan (load models on startup)
        ├── routes.py             # POST /predict, GET /blocks, POST /report, GET /health
        ├── schemas.py            # Pydantic request/response models
        ├── spatial_index.py      # R-tree for fast nearby-spot lookup (<1ms)
        ├── cache.py              # TTL cache keyed on (lat, lng, time_bucket)
        └── realtime.py           # Background polling: traffic/weather/events/garages
```

## Feature Matrix (47 features)

| Category | Features | Source |
|----------|----------|--------|
| Temporal (16) | hour/dow/month cyclic, weekend, rush hour, lunch, holiday, evening, overnight, metered hours, sweeping day, hour_of_week | Timestamp |
| Meter Patterns (7) | nearest meter occupancy, 3-meter avg, block avg, turnover rate, session duration, occupancy trend, sample count | 36mo meter transactions |
| Spatial (8) | lat, lng, neighborhood, distance to nearest meter, meters within 100/200m, block density, dist to garage | sf_parking.db |
| Sweeping (4) | is_sweeping_now, minutes_until/since_sweeping, sweeping_side | Street sweeping schedule |
| Signs/Rules (5) | has_time_limit, time_limit_minutes, is_permit_zone, curb_color, no_parking_signs | Mapillary sign detections |
| Traffic (3) | speed_ratio, congestion_level, speed_trend | INRIX API |
| Weather (2) | is_raining, temperature_f | OpenWeatherMap |
| Events (1) | active_events_500m | Ticketmaster |
| Zone (1) | zone_type | Neighborhood heuristic |

## Models

### Occupancy Model (XGBoost Classifier)
- **Input:** 47 features
- **Output:** P(occupied) for a spot at time t
- **Training:** 36 months of meter transactions, 15-min intervals
- **Config:** 500 trees, max depth 8, learning rate 0.05, early stopping
- **Targets:** AUC-ROC > 0.75, Brier < 0.20

### Transfer Layer
Calibrates meter-trained predictions for free spots using zone-based multipliers:

| Zone | Multiplier | Neighborhoods |
|------|-----------|---------------|
| Residential | 1.15 | Marina |
| Commercial | 1.25 | Financial District, Union Square, Civic Center |
| Restaurant | 1.30 | North Beach, Chinatown |
| Gym | 1.10 | Per-spot detection |
| Mixed | 1.20 | Mission, SoMa, Castro, Haight |

### Turnover Model (XGBoost Regressor)
- **Output:** Expected sessions/hour
- **Used for:** Time decay half-life calculation

## Privacy Gating

| Tier | > 400m | 200-400m | < 200m |
|------|--------|----------|--------|
| Free | Block-level only | Block-level only | Block-level only |
| Pro | Block-level | Street + ~50m fuzz | Exact coordinates |

## Express Server Integration

The Express backend (`server/index.js`) proxies `/spot-intelligence` to the FastAPI service:

```
GET /spot-intelligence?lat=X&lng=Y&radius=500
  ├─ if FastAPI is up → proxy to POST http://localhost:8000/predict
  │   → transform response to match IntelligenceResponse type
  └─ else (fallback) → use hardcoded parkingIntelligence/ logic
```

Zero changes needed in the mobile/web app — same response shape.

## Data Dependencies

The prediction engine reads from `sf_parking.db`, which is built by the [sf-free-parking](https://github.com/jackblackshat/sf-free-parking) pipeline. Required tables:

- `free_parking_spots` (5,827 rows) — spot locations, street, neighborhood, confidence
- `parking_meters` (38,000 rows) — meter locations for spatial features
- `street_sweeping` (37,000 rows) — sweeping schedules
- `mapillary_sign_features` (34,502 rows) — ML-detected parking signs
- `parking_regulations` — time limits, RPP zones

## Real-Time Signal Polling

When running, the server polls external APIs on a schedule:

| Signal | Interval | API |
|--------|----------|-----|
| Traffic | Every 5 min | INRIX |
| Weather | Every 15 min | OpenWeatherMap |
| Events | Every 1 hour | Ticketmaster |
| Garages | Every 10 min | SFpark |

All signals are optional and stored in `realtime_signals` table with TTL expiry.
