// Camera locations and YOLO detection results for parking intelligence
// Results sourced from data_ml/CameraPrediction/main.ipynb output

// 3 camera locations in San Diego near popular parking areas
const CAMERAS = [
  {
    id: 'cam_gaslamp_01',
    name: 'Gaslamp Quarter 5th Ave Lot',
    lat: 32.7107,
    lng: -117.1604,
    lotName: 'Gaslamp District Lot A',
  },
  {
    id: 'cam_eastvillage_01',
    name: 'East Village Market St Lot',
    lat: 32.7127,
    lng: -117.1541,
    lotName: 'East Village Parking Garage B',
  },
  {
    id: 'cam_littleitaly_01',
    name: 'Little Italy India St Lot',
    lat: 32.7259,
    lng: -117.1689,
    lotName: 'Little Italy Parking Lot C',
  },
];

// Hardcoded YOLO classification results from pLot3 inference
// B2/B8 occupied (B8 actually empty 0.71 but borderline), C4/C7/C8/C10/C11 occupied
const YOLO_RESULTS = [
  { id: 'A1', label: 'empty', confidence: 1.00, row: 'A' },
  { id: 'A2', label: 'empty', confidence: 1.00, row: 'A' },
  { id: 'A3', label: 'empty', confidence: 1.00, row: 'A' },
  { id: 'A4', label: 'empty', confidence: 1.00, row: 'A' },
  { id: 'A5', label: 'empty', confidence: 1.00, row: 'A' },
  { id: 'A6', label: 'empty', confidence: 1.00, row: 'A' },
  { id: 'B1', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B2', label: 'occupied', confidence: 0.89, row: 'B' },
  { id: 'B3', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B4', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B5', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B6', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B7', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B8', label: 'empty', confidence: 0.71, row: 'B' },
  { id: 'B9', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B10', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B11', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B12', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'B13', label: 'empty', confidence: 1.00, row: 'B' },
  { id: 'C1', label: 'empty', confidence: 1.00, row: 'C' },
  { id: 'C2', label: 'empty', confidence: 1.00, row: 'C' },
  { id: 'C3', label: 'empty', confidence: 1.00, row: 'C' },
  { id: 'C4', label: 'occupied', confidence: 0.99, row: 'C' },
  { id: 'C5', label: 'empty', confidence: 1.00, row: 'C' },
  { id: 'C6', label: 'empty', confidence: 1.00, row: 'C' },
  { id: 'C7', label: 'occupied', confidence: 1.00, row: 'C' },
  { id: 'C8', label: 'occupied', confidence: 0.98, row: 'C' },
  { id: 'C9', label: 'empty', confidence: 1.00, row: 'C' },
  { id: 'C10', label: 'occupied', confidence: 0.96, row: 'C' },
  { id: 'C11', label: 'occupied', confidence: 0.99, row: 'C' },
  { id: 'C12', label: 'empty', confidence: 1.00, row: 'C' },
];

// Row depth offsets from camera (meters) — row A is closest, C is farthest
const ROW_DEPTH = { A: 15, B: 35, C: 55 };
// Base angle from camera center (radians) — spread spots laterally
const ROW_BASE_ANGLE = { A: -0.3, B: -0.4, C: -0.5 };

/**
 * Projects pixel-space stall polygons to geo coordinates around a camera.
 * Uses row-based depth offsets and lateral spacing derived from polygon centroids.
 */
export function projectSpotsToGeo(camera, spots, polygonData) {
  const polygonMap = {};
  for (const p of polygonData) {
    polygonMap[p.id] = p;
  }

  // Image dimensions from pLot3 (400x287)
  const imgWidth = 400;
  const imgHeight = 287;

  return spots.map((spot) => {
    const polygon = polygonMap[spot.id];
    // Compute centroid of the polygon in pixel space
    let cx = 0, cy = 0;
    if (polygon) {
      for (const pt of polygon.points) {
        cx += pt[0];
        cy += pt[1];
      }
      cx /= polygon.points.length;
      cy /= polygon.points.length;
    }

    // Normalized position (0-1) within image
    const normX = cx / imgWidth;
    const normY = cy / imgHeight;

    // Depth from camera based on row + fine adjustment from Y position
    const depth = ROW_DEPTH[spot.row] + (1 - normY) * 10;

    // Lateral offset: map normalized X to angle spread
    const lateralAngle = ROW_BASE_ANGLE[spot.row] + normX * 0.8;

    // Convert polar offset to lat/lng delta
    // ~111,111 meters per degree latitude, ~96,500 at SD latitude (~32.7°)
    const metersPerDegLat = 111111;
    const metersPerDegLng = 96500;

    const dLat = (depth * Math.cos(lateralAngle)) / metersPerDegLat;
    const dLng = (depth * Math.sin(lateralAngle)) / metersPerDegLng;

    return {
      ...spot,
      lat: camera.lat + dLat,
      lng: camera.lng + dLng,
      distanceFromCamera: depth,
      polygonCentroid: polygon ? { x: cx, y: cy } : null,
    };
  });
}

/**
 * Returns the nearest camera to the user's location.
 */
export function findNearestCamera(userLat, userLng, calculateDistance) {
  let nearest = null;
  let minDist = Infinity;

  for (const cam of CAMERAS) {
    const dist = calculateDistance(
      { lat: userLat, lng: userLng },
      { lat: cam.lat, lng: cam.lng }
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = cam;
    }
  }

  return { camera: nearest, distance: minDist };
}

/**
 * Applies time-seeded random flips to 1-3 spots to simulate live camera updates.
 * Uses current minute as seed so results are consistent within the same minute
 * but change across minutes.
 */
export function applyDemoVariation(spots) {
  const minute = new Date().getMinutes();
  const seed = minute * 7 + 13; // Simple deterministic seed

  // Create a copy to avoid mutating original
  const varied = spots.map((s) => ({ ...s }));

  // Pick 1-3 spots to flip based on seed
  const flipCount = (seed % 3) + 1;
  const emptySpots = varied.filter((s) => s.label === 'empty');
  const occupiedSpots = varied.filter((s) => s.label === 'occupied');

  for (let i = 0; i < flipCount; i++) {
    const idx = (seed + i * 11) % emptySpots.length;
    if (emptySpots[idx]) {
      emptySpots[idx].label = 'occupied';
      emptySpots[idx].confidence = 0.65 + (((seed + i) % 30) / 100);
    }
  }

  // Occasionally flip an occupied spot to empty
  if (seed % 4 === 0 && occupiedSpots.length > 0) {
    const idx = seed % occupiedSpots.length;
    occupiedSpots[idx].label = 'empty';
    occupiedSpots[idx].confidence = 0.72 + ((seed % 20) / 100);
  }

  return varied;
}

/**
 * Override spot occupancy to reach a target percentage.
 * Flips empty→occupied or occupied→empty as needed.
 */
export function applyOccupancyOverride(spots, targetPercent) {
  const total = spots.length;
  const targetOccupied = Math.round((targetPercent / 100) * total);
  const varied = spots.map((s) => ({ ...s }));

  const currentOccupied = varied.filter((s) => s.label === 'occupied').length;
  const diff = targetOccupied - currentOccupied;

  if (diff > 0) {
    // Need more occupied spots
    const emptySpots = varied.filter((s) => s.label === 'empty');
    for (let i = 0; i < Math.min(diff, emptySpots.length); i++) {
      emptySpots[i].label = 'occupied';
      emptySpots[i].confidence = 0.85;
    }
  } else if (diff < 0) {
    // Need fewer occupied spots
    const occupiedSpots = varied.filter((s) => s.label === 'occupied');
    for (let i = 0; i < Math.min(-diff, occupiedSpots.length); i++) {
      occupiedSpots[i].label = 'empty';
      occupiedSpots[i].confidence = 0.90;
    }
  }

  return varied;
}

export { CAMERAS, YOLO_RESULTS };
