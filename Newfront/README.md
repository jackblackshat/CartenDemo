# Carten

Smart parking finder web application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file and configure:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

The app will open at http://localhost:3000

**Note:** After changing `.env` (e.g. `VITE_MAPBOX_TOKEN` or `VITE_API_BASE_URL`), stop the dev server (Ctrl+C) and run `npm run dev` again so Vite picks up the new values.

## Backend Server

This app requires the backend server to be running on port 4000:

```bash
cd ../server
npm install
npm start
```

## Features

- Real-time parking availability via INRIX API
- Location search via Mapbox geocoding
- Turn-by-turn navigation via Mapbox routing
- Crowdsourced parking data
- Dark mode support
