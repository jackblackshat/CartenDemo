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
import { findNearestCamera, projectSpotsToGeo, applyDemoVariation, applyOccupancyOverride, YOLO_RESULTS } from './parkingIntelligence/cameraData.js';
import { rankSpots, makeRerouteDecision, REROUTE_THRESHOLD } from './parkingIntelligence/intelligenceEngine.js';
import { getSimulatedUsers } from './parkingIntelligence/simulatedUsers.js';
import { ALTERNATIVE_LOTS } from './parkingIntelligence/alternativeLots.js';
import { logPipeline, logWorkScenario } from './parkingIntelligence/pipelineLogger.js';
import { evaluateLegalStatus, classifyRecommendation, PARKING_REGULATIONS } from './parkingIntelligence/legalData.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const polygonData = JSON.parse(readFileSync(join(__dirname, '..', 'data_ml', 'CameraPrediction', 'datasets', 'data', 'test', 'pLot3stalls.json'), 'utf8'));

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

// --- Parking Intelligence Endpoints ---

app.get("/spot-detection", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { lat, lng, radius = 500 } = req.query;

  if (!lat || !lng) {
    res.status(400).send({ error: 'lat and lng parameters required' });
    return;
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  const { camera, distance: cameraDistance } = findNearestCamera(userLat, userLng, calculateDistance);

  if (!camera || cameraDistance > parseFloat(radius)) {
    res.status(404).send({ error: 'No camera found within radius' });
    return;
  }

  // Project YOLO results to geo coordinates around nearest camera
  const geoSpots = projectSpotsToGeo(camera, YOLO_RESULTS, polygonData);
  // Apply time-seeded demo variation
  const variedSpots = applyDemoVariation(geoSpots);

  res.json({
    camera: {
      id: camera.id,
      name: camera.name,
      lotName: camera.lotName,
      lat: camera.lat,
      lng: camera.lng,
    },
    cameraDistance: Math.round(cameraDistance),
    spots: variedSpots,
    timestamp: new Date().toISOString(),
  });
});

app.get("/spot-intelligence", (req, res) => {
  const startTime = Date.now();
  res.setHeader("Access-Control-Allow-Origin", "*");
  const {
    lat, lng,
    demoOccupancy, demoForceReroute, demoCameraSpotAvailable, demoPhoneSpotFree, demoTraffic,
    workScenario, parkingDuration: pdParam,
  } = req.query;

  if (!lat || !lng) {
    res.status(400).send({ error: 'lat and lng parameters required' });
    return;
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const userLocation = { lat: userLat, lng: userLng };
  const isWorkScenario = workScenario === 'true';
  const parkingDuration = pdParam ? parseInt(pdParam) : 120;

  // Find nearest camera
  const { camera, distance: cameraDistance } = findNearestCamera(userLat, userLng, calculateDistance);

  if (!camera) {
    res.status(404).send({ error: 'No cameras available' });
    return;
  }

  // Project spots (save pre-variation copy for logging)
  const geoSpots = projectSpotsToGeo(camera, YOLO_RESULTS, polygonData);
  let variedSpots = applyDemoVariation(geoSpots);

  // Apply demo occupancy override if provided
  if (demoOccupancy !== undefined) {
    const pct = parseFloat(demoOccupancy);
    if (!isNaN(pct) && pct >= 0 && pct <= 100) {
      variedSpots = applyOccupancyOverride(variedSpots, pct);
    }
  }

  // Get simulated users (empty when demo "phone/crowd: no one in spot")
  const simulatedUsers = demoPhoneSpotFree === 'true' ? [] : getSimulatedUsers(demoTraffic || null);

  // Rank spots
  let { recommendations, lotSummary } = rankSpots(userLocation, variedSpots, simulatedUsers);

  // Demo: camera spot available = false → force low confidence so reroute triggers
  if (demoCameraSpotAvailable === 'false' && recommendations.length > 0) {
    const lowConf = 0.25;
    recommendations = recommendations.map((r) => ({
      ...r,
      overallConfidence: lowConf,
      futureConfidence: {
        '1min': lowConf * 0.86, '3min': lowConf * 0.64, '5min': lowConf * 0.47, '10min': lowConf * 0.22,
      },
    }));
  }

  // Demo: camera spot available = true → force high confidence on best spot so no reroute
  if (demoCameraSpotAvailable === 'true' && recommendations.length > 0) {
    recommendations = recommendations.map((r, i) => {
      if (i > 0) return r;
      const highConf = 0.9;
      return {
        ...r,
        overallConfidence: highConf,
        futureConfidence: {
          '1min': highConf * 0.86, '3min': highConf * 0.64, '5min': highConf * 0.47, '10min': highConf * 0.22,
        },
      };
    });
  }

  // Check reroute
  let rerouteDecision = makeRerouteDecision(recommendations, userLocation);

  // Apply demo force reroute override
  if (demoForceReroute === 'true' && !rerouteDecision.shouldReroute) {
    rerouteDecision = {
      ...rerouteDecision,
      shouldReroute: true,
      reason: rerouteDecision.reason || 'Demo: forced reroute',
    };
  }

  // Compute crowdsource spots
  const timestamp = new Date().toISOString();
  const allCrowdsourceWithDist = SF_PARKING_SPOTS.map(spot => ({
    ...spot,
    distance: Math.round(calculateDistance(userLocation, spot)),
  })).sort((a, b) => a.distance - b.distance);
  const crowdsourceNearby = allCrowdsourceWithDist.filter(s => s.distance <= 500);

  const demoOverrides = { demoOccupancy, demoTraffic, demoForceReroute, demoCameraSpotAvailable, demoPhoneSpotFree };

  // Build response
  const response = {
    camera: {
      id: camera.id,
      name: camera.name,
      lotName: camera.lotName,
      lat: camera.lat,
      lng: camera.lng,
    },
    cameraDistance: Math.round(cameraDistance),
    lotSummary,
    recommendations,
    allSpots: variedSpots,
    rerouteDecision,
    simulatedUsers: simulatedUsers.length,
    timestamp,
  };

  // When workScenario is enabled, add legal evaluation stages
  if (isWorkScenario) {
    const legalEvaluations = [];

    // Camera lot legal status
    const cameraLegal = evaluateLegalStatus(camera.id, parkingDuration);
    const cameraReg = PARKING_REGULATIONS[camera.id];
    const estimatedCost = cameraLegal.rate ? (cameraLegal.rate * parkingDuration / 60) : null;
    legalEvaluations.push({
      locationId: camera.id,
      zoneName: cameraReg ? cameraReg.zoneName : camera.lotName,
      distance: null,
      ...cameraLegal,
      timeLimit: cameraReg?.restrictions?.timeLimit || null,
      enforcementStatus: null,
      estimatedCost,
      specialRules: cameraReg?.specialRules || null,
    });

    // Nearby crowdsource legal statuses
    for (const cs of crowdsourceNearby) {
      const csLegal = evaluateLegalStatus(cs.id, parkingDuration);
      const csReg = PARKING_REGULATIONS[cs.id];
      const csEnforcement = csReg?.restrictions?.enforcedHours
        ? (() => {
            const now = new Date();
            const h = now.getHours() + now.getMinutes() / 60;
            const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
            const dayActive = csReg.restrictions.enforcedDays?.includes(day);
            const hourActive = h >= csReg.restrictions.enforcedHours.start && h < csReg.restrictions.enforcedHours.end;
            return dayActive && hourActive ? `Active (${csReg.restrictions.enforcedDays.join(', ')} ${String(csReg.restrictions.enforcedHours.start).padStart(2, '0')}:00-${String(csReg.restrictions.enforcedHours.end).padStart(2, '0')}:00)` : 'Inactive';
          })()
        : null;
      const csCost = csLegal.rate ? (csLegal.rate * Math.min(parkingDuration, csReg?.restrictions?.timeLimit || parkingDuration) / 60) : null;

      legalEvaluations.push({
        locationId: cs.id,
        zoneName: csReg ? csReg.zoneName : cs.name,
        distance: cs.distance,
        ...csLegal,
        timeLimit: csReg?.restrictions?.timeLimit || null,
        enforcementStatus: csEnforcement,
        estimatedCost: csCost,
        specialRules: csReg?.specialRules || null,
      });
    }

    // Work recommendation classification
    const workRecommendations = [];

    // Classify top camera lot spots
    const topSpots = recommendations.slice(0, 5);
    for (const spot of topSpots) {
      const spotLegal = evaluateLegalStatus(camera.id, parkingDuration);
      const classification = classifyRecommendation(spotLegal, spot.overallConfidence);
      workRecommendations.push({
        spotId: spot.id,
        type: 'camera_lot',
        ...classification,
      });
    }

    // Classify nearby crowdsource street spots
    for (const cs of crowdsourceNearby) {
      const csLegal = evaluateLegalStatus(cs.id, parkingDuration);
      const classification = classifyRecommendation(csLegal, 0.5);
      workRecommendations.push({
        spotId: cs.id,
        type: 'street',
        ...classification,
      });
    }

    response.workRecommendations = workRecommendations;
    response.legalContext = legalEvaluations;
    response.parkingDuration = parkingDuration;

    // Log full work scenario
    try {
      logWorkScenario({
        timestamp,
        userLocation,
        camera,
        cameraDistance: Math.round(cameraDistance),
        geoSpots,
        variedSpots,
        simulatedUsers,
        crowdsourceSpots: crowdsourceNearby,
        allCrowdsourceSpots: allCrowdsourceWithDist,
        recommendations,
        lotSummary,
        rerouteDecision,
        startTime,
        parkingDuration,
        legalEvaluations,
        workRecommendations,
        demoOverrides,
      });
    } catch (e) {
      console.error('Work scenario logging error:', e.message);
    }
  } else {
    // Log standard pipeline
    try {
      logPipeline({
        timestamp,
        userLocation,
        camera,
        cameraDistance: Math.round(cameraDistance),
        geoSpots,
        variedSpots,
        simulatedUsers,
        crowdsourceSpots: crowdsourceNearby,
        allCrowdsourceSpots: allCrowdsourceWithDist,
        recommendations,
        lotSummary,
        rerouteDecision,
        startTime,
        demoOverrides,
      });
    } catch (e) {
      console.error('Pipeline logging error:', e.message);
    }
  }

  res.json(response);
});

app.get("/reroute-check", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { originlat, originlng, destinationlat, destinationlng, currentConfidence } = req.query;

  if (!originlat || !originlng || !destinationlat || !destinationlng) {
    res.status(400).send({ error: 'origin and destination coordinates required' });
    return;
  }

  const userLocation = { lat: parseFloat(originlat), lng: parseFloat(originlng) };
  const confidence = currentConfidence ? parseFloat(currentConfidence) : 0;

  // Build a fake recommendation array with just the confidence for the decision
  const fakeRecommendations = confidence > 0
    ? [{ overallConfidence: confidence }]
    : [];

  const decision = makeRerouteDecision(fakeRecommendations, userLocation);

  res.json(decision);
});

app.listen(port, () => {
  console.log(`Open the URL: http://localhost:${port} in your browser`);
});
