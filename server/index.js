// consists of a bunch of middleware that helps to handle requests and responses cycle. It is used to set up routes, handle requests, and manage responses.
import express from "express";
// is a security feature that allows or restricts resources on a web server depending on where the HTTP request was initiated
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());
// axios is used to handle HTTP requests and responses like GET, POST, PUT, DELETE, etc.
import axios from "axios";
// node cache is a way to store frequently accessed data in memory for a certain period of time to improve performance and reduce latency.
import NodeCache from "node-cache";
const apiCache = new NodeCache();
// for environment variables
import { config as _config } from "dotenv";
_config();
// crowdsourcing spots
import { SF_PARKING_SPOTS } from './phoneData/crowdsourceSpots.js';
import { calculateDistance } from './phoneData/utils.js';
// parking intelligence
import { YOLO_RESULTS, findNearestCamera, projectSpotsToGeo, applyDemoVariation } from './parkingIntelligence/cameraData.js';
import { rankSpots, makeRerouteDecision } from './parkingIntelligence/intelligenceEngine.js';
import { getSimulatedUsers } from './parkingIntelligence/simulatedUsers.js';
import { ALTERNATIVE_LOTS } from './parkingIntelligence/alternativeLots.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const polygonData = JSON.parse(
  readFileSync(join(__dirname, '..', 'data_ml', 'CameraPrediction', 'datasets', 'data', 'test', 'pLot3stalls.json'), 'utf-8')
);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const config = {
  appId: process.env.APP_ID,
  hashToken: process.env.HASH_TOKEN,
  authTokenUrl: process.env.AUTH_TOKEN_URL,
  parkingDataUrl: process.env.PARKING_DATA_URL,
  mapboxDirectionsApiUrl: process.env.MAPBOX_DIRECTIONS_API_URL,
  mapboxDirectionsApiToken: process.env.MAPBOX_DIRECTIONS_API_TOKEN
};

const DEBUG_LOG = (payload) => { try { require('http').request({ hostname: '127.0.0.1', port: 7243, path: '/ingest/bb2dc183-ae2c-480c-a833-e5e9fcaa5246', method: 'POST', headers: { 'Content-Type': 'application/json' } }, () => {}).end(JSON.stringify({ ...payload, timestamp: Date.now(), sessionId: 'debug-session' })); } catch (e) {} };

app.get("/getToken", (req, res) => {
  // #region agent log
  DEBUG_LOG({ location: 'server/index.js:getToken:entry', message: 'getToken called', data: { hasAppId: !!process.env.APP_ID, hasHashToken: !!process.env.HASH_TOKEN, hasAuthTokenUrl: !!config.authTokenUrl }, hypothesisId: 'A' });
  // #endregion
  // url to produce token based on appId and hashToken
  res.setHeader("Access-Control-Allow-Origin", "*"); // setup cors compatibility
  // get from .env variables
  const appId = process.env.APP_ID; // req.query.appId
  const hashToken = process.env.HASH_TOKEN;

  if (apiCache.has(appId)) {
    // Serve response from cache
    // console.log('Retrieved value from cache !!!');
    res.json(apiCache.get(appId));
  } else {
    // create server request
    axios.get(
      config.authTokenUrl,
      {
        params: {
          appId,
          hashToken,
        },
        headers: {
          "content-type": "application/json",
          Accept: "application/json",
        },
      },
    )
      .then((response) => {
        // #region agent log
        DEBUG_LOG({ location: 'server/index.js:getToken:then', message: 'getToken axios then', data: { status: response.status, hasResult: !!(response.data && response.data.result), hasToken: !!(response.data && response.data.result && response.data.result.token) }, hypothesisId: 'C' });
        // #endregion
        if (response.status === 200) {
          const oneHour = 1 * 60 * 60; // One hour in seconds
          //const twelvehours = 15;
          const exp = (new Date().getTime() + oneHour * 1000) / 1000;

          const payload = {
            token: response.data.result.token,
            exp, //in seconds
          };
          // Set value for same appId, in order to serve future requests efficiently
          apiCache.set(appId, payload);
          // send the json response and end request/response cycle
          res.json(payload);
        }
      })
      .catch((error) => {
        // #region agent log
        DEBUG_LOG({ location: 'server/index.js:getToken:catch', message: 'getToken axios catch', data: { errMessage: error?.message }, hypothesisId: 'A' });
        // #endregion
        // res.json(error);
        res.status(500).send({ error: 'error fetching token' })
      });
  }
});

app.get("/parking", (req, res) => {
  // #region agent log
  DEBUG_LOG({ location: 'server/index.js:parking:entry', message: 'parking called', data: { point: req.query.point, radius: req.query.radius }, hypothesisId: 'B' });
  // #endregion
  res.setHeader("Access-Control-Allow-Origin", "*"); // setup cors compatibility
  const { point, radius } = req.query;

  if (!point) {
    res.status(400).send({ error: 'point parameter is required' });
    return;
  }
  else if (!radius) {
    res.status(400).send({ error: 'radius parameter is required' });
    return;
  }

  const cacheKey = `parking_${point}_${radius}`;
  const appId = config.appId;

  if (apiCache.has(cacheKey)) {
    res.json(apiCache.get(cacheKey));
  }
  else {
    const cashed = apiCache.get(appId);
    if (!cashed) {
      res.status(500).send({ error: 'missing or expired token, please fetch a new token' });
      return;
    }

    axios.get(
      config.parkingDataUrl,
      {
        params: {
          point,
          radius,
        },
        headers: {
          Authorization: `Bearer ${cashed.token}`,
          "content-type": "application/json",
          Accept: "application/json",
        },
      },
    )
      .then((response) => {
        if (response.status === 200) {
          const blocks = response.data.result;
          if (!blocks || blocks.length === 0) {
            res.status(404).send({ error: 'no parking data found for the given parameters' });
            return;
          }

          const openBlocks = blocks.filter(b => b.segments && b.segments.some(s => s.isOpen));
          // #region agent log
          DEBUG_LOG({ location: 'server/index.js:parking:filter', message: 'parking openBlocks', data: { blocksCount: blocks.length, openBlocksCount: openBlocks.length }, hypothesisId: 'B' });
          // #endregion
          const bestBlock = openBlocks.reduce((best, item) => {
            return item.probability > best.probability ? item : best;
          });
          const bestSegment = bestBlock.segments.filter(s => s.isOpen).reduce((best, item) => {
            return item.spacesTotal > best.spacesTotal ? item : best;
          });

          // map through an array of objects and extract a block with the highest probability
          const payload = {
            blockId: bestBlock.id,
            name: bestBlock.name,
            probability: bestBlock.probability,
            distance: bestBlock.distance,
            totalOpenSpaces: bestSegment.spacesTotal,
            data: bestBlock,
            segment: bestSegment,
            geoSegment: bestSegment.polyline6,
            exp: 60,
          };
          apiCache.set(cacheKey, payload, 60);
          res.json(payload);
          // console.log(bestBlock);
          // console.log(bestSegment);
          // console.log(bestBlock.probability)
          // console.log(bestSegment.polyline6)
        };
      })
      .catch((error) => {
        // #region agent log
        DEBUG_LOG({ location: 'server/index.js:parking:catch', message: 'parking axios catch', data: { errMessage: error?.message }, hypothesisId: 'B' });
        // #endregion
        res.status(500).send({ error: 'error fetching parking data' });
      });
  }
});

app.get("/routing", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { originlng, originlat, destinationlng, destinationlat } = req.query;
  // console.log(req.query);
  if (!originlng || !originlat || !destinationlng || !destinationlat) {
    res.status(400).send({ error: 'long and lat parameters are required' });
    return;
  }

  axios.get(
    `${config.mapboxDirectionsApiUrl}/${encodeURIComponent(`${originlng},${originlat};${destinationlng},${destinationlat}`)}`,
    {
      params: {
        geometries: 'geojson',
        access_token: config.mapboxDirectionsApiToken
      },
      headers: {
        "Accept": "application/json"
      }
    }
  )
    .then((response) => {
      if (response.status === 200) {
        res.json(response.data);
      }
    })
    .catch((error) => {
      res.status(500).send({ error: 'error fetching routing data' });
    });
});

app.get("/checkConfig", (req, res) => {
  let exists = false;
  if (config.appId && config.hashToken && config.authTokenUrl) {
    exists = true;
  }
  const payload = {
    exists,
  };
  res.json(payload);
});

app.get("/crowdsource-spots", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { lat, lng, radius = 50 } = req.query;

  if (!lat || !lng) {
    res.status(400).send({ error: 'lat and lng parameters required' });
    return;
  }

  const spots = SF_PARKING_SPOTS.filter(spot => {
    const distance = calculateDistance(
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      spot
    );
    return distance <= parseFloat(radius);
  });

  res.json({ spots });
});

app.post("/crowdsource-response", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { spotId, isOpen, timestamp, userLocation } = req.body;

  if (!spotId || isOpen === undefined) {
    res.status(400).send({ error: 'spotId and isOpen are required' });
    return;
  }

  // For MVP: just log the response
  console.log('Crowdsource response:', {
    spotId,
    isOpen,
    timestamp,
    userLocation
  });

  res.json({ success: true, message: 'Response recorded' });
});

// ---- Parking Intelligence Endpoints ----

app.get("/spot-detection", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { lat, lng, radius = 500 } = req.query;

  if (!lat || !lng) {
    res.status(400).send({ error: 'lat and lng parameters are required' });
    return;
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  const { camera, distance } = findNearestCamera(userLat, userLng, calculateDistance);

  if (!camera || distance > parseFloat(radius)) {
    res.status(404).send({ error: 'No camera found within radius' });
    return;
  }

  // Apply demo variation to simulate live updates
  const variedSpots = applyDemoVariation(YOLO_RESULTS);

  // Project pixel-space spots to geo coordinates around camera
  const geoSpots = projectSpotsToGeo(camera, variedSpots, polygonData);

  res.json({
    camera: {
      id: camera.id,
      name: camera.name,
      lotName: camera.lotName,
      lat: camera.lat,
      lng: camera.lng,
    },
    cameraDistance: Math.round(distance),
    spots: geoSpots,
    timestamp: new Date().toISOString(),
  });
});

app.get("/spot-intelligence", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400).send({ error: 'lat and lng parameters are required' });
    return;
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const userLocation = { lat: userLat, lng: userLng };

  // Find nearest camera
  const { camera, distance: camDist } = findNearestCamera(userLat, userLng, calculateDistance);

  if (!camera) {
    res.status(404).send({ error: 'No camera available' });
    return;
  }

  // Get varied YOLO results and project to geo
  const variedSpots = applyDemoVariation(YOLO_RESULTS);
  const geoSpots = projectSpotsToGeo(camera, variedSpots, polygonData);

  // Get simulated other users
  const simulatedUsers = getSimulatedUsers();

  // Rank spots
  const { recommendations, lotSummary } = rankSpots(userLocation, geoSpots, simulatedUsers);

  // Check reroute decision
  const rerouteDecision = makeRerouteDecision(recommendations, userLocation);

  res.json({
    camera: {
      id: camera.id,
      name: camera.name,
      lotName: camera.lotName,
      lat: camera.lat,
      lng: camera.lng,
    },
    cameraDistance: Math.round(camDist),
    lotSummary,
    recommendations: recommendations.slice(0, 10), // top 10
    allSpots: geoSpots, // all spots for map markers
    rerouteDecision,
    simulatedUsers: simulatedUsers.length,
    timestamp: new Date().toISOString(),
  });
});

app.get("/reroute-check", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { originlat, originlng, destinationlat, destinationlng, currentConfidence } = req.query;

  if (!originlat || !originlng) {
    res.status(400).send({ error: 'origin coordinates are required' });
    return;
  }

  const userLocation = {
    lat: parseFloat(originlat),
    lng: parseFloat(originlng),
  };

  const conf = parseFloat(currentConfidence || '0');

  // Compare with alternatives
  const alternatives = ALTERNATIVE_LOTS.map((lot) => {
    const dist = calculateDistance(userLocation, { lat: lot.lat, lng: lot.lng });
    return { ...lot, distanceFromUser: Math.round(dist) };
  }).sort((a, b) => b.estimatedConfidence - a.estimatedConfidence);

  const bestAlt = alternatives[0];
  const shouldReroute = conf < 0.35 && bestAlt && bestAlt.estimatedConfidence > conf;

  res.json({
    shouldReroute,
    currentConfidence: conf,
    alternatives,
    recommendation: shouldReroute ? {
      lot: bestAlt,
      reason: `Current confidence ${Math.round(conf * 100)}% is low. ${bestAlt.name} has ~${Math.round(bestAlt.estimatedConfidence * 100)}% availability.`,
      timeDelta: bestAlt.estimatedDriveMinutes,
    } : null,
  });
});

app.listen(port, () => {
  console.log(`Open the URL: http://localhost:${port} in your browser`);
});
