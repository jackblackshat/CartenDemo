// Parking intelligence engine: ranking, confidence, future prediction, reroute

import { calculateDistance } from '../phoneData/utils.js';
import { ALTERNATIVE_LOTS } from './alternativeLots.js';

const WALKING_SPEED_MPS = 1.4; // average walking speed in meters/second
const MAX_USEFUL_DISTANCE = 200; // meters — spots beyond this get 0 distance score
const QUEUE_PENALTY_PER_CAR = 0.25; // -25% per car ahead
const DECAY_RATE = 0.15; // exponential decay rate per minute for future prediction
const REROUTE_THRESHOLD = 0.35; // minimum confidence before suggesting reroute

// Hardcoded confidence for Row C spots (demo / predictable values)
const ROW_C_HARDCODED_CONFIDENCE = {
  C1: 0.92, C2: 0.88, C3: 0.85, C4: 0.82, C5: 0.78, C6: 0.75,
  C7: 0.72, C8: 0.68, C9: 0.65, C10: 0.62, C11: 0.58, C12: 0.55,
};

/**
 * Ranks empty spots by a combined confidence score.
 *
 * overallConfidence = mlConfidence * distancePenalty * queuePenalty
 *   - distancePenalty: linear decay from 1.0 (0m) to 0.0 (200m+)
 *   - queuePenalty: -25% per simulated user closer to each spot
 *
 * Returns sorted array of recommendations with future predictions.
 */
export function rankSpots(userLocation, detectedSpots, simulatedUsers) {
  // Filter to empty spots only
  const emptySpots = detectedSpots.filter((s) => s.label === 'empty');
  const occupiedCount = detectedSpots.length - emptySpots.length;

  const recommendations = emptySpots.map((spot) => {
    const spotCoords = { lat: spot.lat, lng: spot.lng };

    // Distance from user to spot
    const distance = calculateDistance(userLocation, spotCoords);
    const walkingTimeSeconds = distance / WALKING_SPEED_MPS;
    const walkingTimeMinutes = walkingTimeSeconds / 60;

    // Distance penalty: linear from 1.0 at 0m to 0.0 at 200m+
    const distancePenalty = Math.max(0, 1 - distance / MAX_USEFUL_DISTANCE);

    // Queue: count simulated users closer to this spot than the real user
    let queuePosition = 0;
    for (const simUser of simulatedUsers) {
      const simDist = calculateDistance(
        { lat: simUser.lat, lng: simUser.lng },
        spotCoords
      );
      if (simDist < distance) {
        queuePosition++;
      }
    }
    const queuePenalty = Math.max(0, 1 - queuePosition * QUEUE_PENALTY_PER_CAR);

    // Overall confidence (Row C uses hardcoded values for demo)
    let overallConfidence = spot.confidence * distancePenalty * queuePenalty;
    if (spot.row === 'C' && ROW_C_HARDCODED_CONFIDENCE[spot.id] != null) {
      overallConfidence = ROW_C_HARDCODED_CONFIDENCE[spot.id];
    }

    // Future confidence at 1, 3, 5, 10 minutes via exponential decay
    const futureConfidence = {
      '1min': overallConfidence * Math.exp(-DECAY_RATE * 1),
      '3min': overallConfidence * Math.exp(-DECAY_RATE * 3),
      '5min': overallConfidence * Math.exp(-DECAY_RATE * 5),
      '10min': overallConfidence * Math.exp(-DECAY_RATE * 10),
    };

    return {
      id: spot.id,
      row: spot.row,
      label: spot.label,
      lat: spot.lat,
      lng: spot.lng,
      mlConfidence: spot.confidence,
      distance: Math.round(distance),
      walkingTimeMinutes: Math.round(walkingTimeMinutes * 10) / 10,
      queuePosition,
      distancePenalty: Math.round(distancePenalty * 100) / 100,
      queuePenalty: Math.round(queuePenalty * 100) / 100,
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      futureConfidence: {
        '1min': Math.round(futureConfidence['1min'] * 100) / 100,
        '3min': Math.round(futureConfidence['3min'] * 100) / 100,
        '5min': Math.round(futureConfidence['5min'] * 100) / 100,
        '10min': Math.round(futureConfidence['10min'] * 100) / 100,
      },
    };
  });

  // Sort by overall confidence descending
  recommendations.sort((a, b) => b.overallConfidence - a.overallConfidence);

  return {
    recommendations,
    lotSummary: {
      totalSpots: detectedSpots.length,
      openSpots: emptySpots.length,
      occupiedSpots: occupiedCount,
      occupancyRate: Math.round((occupiedCount / detectedSpots.length) * 100),
    },
  };
}

/**
 * Decides whether the user should reroute to an alternative lot.
 * If the best spot confidence < 35%, recommends the best alternative.
 */
export function makeRerouteDecision(recommendations, userLocation) {
  const bestConfidence = recommendations.length > 0
    ? recommendations[0].overallConfidence
    : 0;

  if (bestConfidence >= REROUTE_THRESHOLD) {
    return {
      shouldReroute: false,
      reason: null,
      currentConfidence: bestConfidence,
      alternative: null,
    };
  }

  // Find best alternative lot
  let bestAlt = null;
  let bestAltScore = 0;

  for (const lot of ALTERNATIVE_LOTS) {
    const dist = calculateDistance(userLocation, { lat: lot.lat, lng: lot.lng });
    // Score: higher confidence and shorter drive are better
    const score = lot.estimatedConfidence * (1 - lot.estimatedDriveMinutes / 20);
    if (score > bestAltScore) {
      bestAltScore = score;
      bestAlt = lot;
    }
  }

  if (!bestAlt) {
    return {
      shouldReroute: false,
      reason: 'No alternative lots available',
      currentConfidence: bestConfidence,
      alternative: null,
    };
  }

  const timeDelta = bestAlt.estimatedDriveMinutes;
  const confidenceDelta = Math.round(
    (bestAlt.estimatedConfidence - bestConfidence) * 100
  );

  return {
    shouldReroute: true,
    reason: `Current lot confidence is low (${Math.round(bestConfidence * 100)}%). ${bestAlt.name} has ${confidenceDelta}% higher availability, ${timeDelta} min drive.`,
    currentConfidence: Math.round(bestConfidence * 100) / 100,
    alternative: {
      id: bestAlt.id,
      name: bestAlt.name,
      lat: bestAlt.lat,
      lng: bestAlt.lng,
      estimatedConfidence: bestAlt.estimatedConfidence,
      estimatedDriveMinutes: bestAlt.estimatedDriveMinutes,
      totalSpots: bestAlt.totalSpots,
      typicalOpenSpots: bestAlt.typicalOpenSpots,
    },
  };
}

export { MAX_USEFUL_DISTANCE, QUEUE_PENALTY_PER_CAR, DECAY_RATE, REROUTE_THRESHOLD, ROW_C_HARDCODED_CONFIDENCE };
