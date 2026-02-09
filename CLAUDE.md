# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Carten is a smart parking finder application. The repo contains three independent apps and a shared backend:

- **Mobile app** (root) — React Native + Expo (SDK 54) app with Mapbox maps
- **Web app** (`Newfront/`) — Vite + React web dashboard with Mapbox GL
- **Backend server** (`server/`) — Express.js API (ESM, port 4000)
- **ML data** (`data_ml/`) — Python scripts and datasets for camera-based parking spot detection

## Common Commands

### Mobile app (root directory)
```bash
npm install
npx expo start          # start Metro bundler
npx expo run:ios        # build and run on iOS
npx expo run:android    # build and run on Android
```

### Backend server
```bash
cd server && npm install && npm start   # Express on port 4000
```

### Web app
```bash
cd Newfront && npm install && npm run dev    # Vite dev server
cd Newfront && npm run build                 # production build
```

## Architecture

### Mobile App

Entry: `index.ts` → `App.tsx`. Provider hierarchy: `GestureHandlerRootView` → `PhoneDataCollectorProvider` → `DarkModeProvider` → `DemoProvider` → `NavigationContainer` → `NavigationProvider` → `RootNavigator`.

**Navigation** (`src/navigation/`): Bottom tab navigator with three tabs — MapTab (stack: MapHome → SearchResults → SpotDetail → Navigation → GaragePaid → Heatmap → EmptyState), ActivityTab, ProfileTab (stack: ProfileMain → NotificationSettings → MoreSettings). Tab bar is hidden on sub-screens.

**Context providers** (`src/context/`):
- `DarkModeContext` — theme toggle
- `DemoContext` — demo override controls (occupancy, traffic, reroute, camera/phone spot states) sent as query params to the server
- `NavigationContext` — selected destination state shared across screens

**Custom hooks** (`src/hooks/`): `useParking`, `useGeocoding`, `useRouting`, `useUserLocation`, `useSpotIntelligence` — each wraps a specific API call from `src/services/api.ts`.

**API layer**: `src/config/api.ts` builds URL strings for all endpoints. `src/services/api.ts` provides typed fetch wrappers. The mobile app talks to the local Express server for parking/routing/intelligence, and directly to Mapbox for geocoding. Routing has a fallback: tries local server first, then Mapbox Directions API directly.

**Phone data collection** (`src/lib/phoneData/`): `PhoneDataCollector` uses device sensors (accelerometer, gyroscope via expo-sensors) and location to detect parking events. `SensorManager` handles raw sensor streams. `ParkingSession` manages parking session lifecycle.

**Types**: All shared types in `src/types/index.ts` — covers parking spots, API responses, geocoding, routing, crowdsource, ML/intelligence types.

### Backend Server (`server/`)

Single-file Express server (`index.js`, ESM). Key endpoints:
- `GET /getToken` — fetches auth token from INRIX API (cached)
- `GET /parking` — proxies parking data from INRIX with caching
- `GET /routing` — proxies Mapbox Directions API
- `GET /crowdsource-spots` / `POST /crowdsource-response` — crowdsource parking data
- `GET /spot-detection` — camera-based spot detection using YOLO results projected to geo coords
- `GET /spot-intelligence` — full intelligence pipeline: camera detection + ranking + reroute decision. Accepts demo override query params.
- `GET /reroute-check` — checks whether to suggest rerouting

Parking intelligence modules (`server/parkingIntelligence/`):
- `cameraData.js` — camera locations, YOLO result projection to geo coords, demo variation
- `intelligenceEngine.js` — spot ranking algorithm, reroute decision logic
- `simulatedUsers.js` — simulated concurrent users for demo
- `alternativeLots.js` — alternative parking lot data for reroute suggestions

### Environment Variables

Server requires `.env` with: `APP_ID`, `HASH_TOKEN`, `AUTH_TOKEN_URL`, `PARKING_DATA_URL`, `MAPBOX_DIRECTIONS_API_URL`, `MAPBOX_DIRECTIONS_API_TOKEN`, `PORT` (optional, defaults to 4000).

Mobile app uses `API_BASE_URL` and `MAPBOX_TOKEN` via `expo-constants` extra config. Defaults to `localhost:4000` for dev.

Web app uses `VITE_MAPBOX_TOKEN` and `VITE_API_BASE_URL`.

## Key Technical Details

- React Native New Architecture is enabled (`newArchEnabled: true`)
- Mapbox is initialized at import time via `src/config/mapbox.ts` (imported first in App.tsx)
- TypeScript strict mode, extends `expo/tsconfig.base`
- No test framework is configured
- No linter is configured
