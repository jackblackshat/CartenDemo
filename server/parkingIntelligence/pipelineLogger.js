// Structured logging for parking intelligence pipeline
// Logs to console AND appends to server/logs/pipeline.log

import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MAX_USEFUL_DISTANCE, QUEUE_PENALTY_PER_CAR, DECAY_RATE, REROUTE_THRESHOLD, ROW_C_HARDCODED_CONFIDENCE } from './intelligenceEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_FILE = join(__dirname, '..', 'logs', 'pipeline.log');

function writeToFile(text) {
  try {
    appendFileSync(LOG_FILE, text + '\n');
  } catch (e) {
    console.error('Log write error:', e.message);
  }
}

const SEPARATOR = '================================================================================';
const STAGE_SEP = (n, title) => `--- [STAGE ${n}] ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`;

function pad(str, len) {
  const s = String(str);
  return s.length >= len ? s : s + ' '.repeat(len - s.length);
}

function padLeft(str, len) {
  const s = String(str);
  return s.length >= len ? s : ' '.repeat(len - s.length) + s;
}

/**
 * Logs the full 8-stage parking intelligence pipeline to console.
 */
export function logPipeline(data) {
  const {
    timestamp,
    userLocation,
    camera,
    cameraDistance,
    geoSpots,       // pre-variation spots
    variedSpots,    // post-variation spots
    simulatedUsers,
    crowdsourceSpots,
    allCrowdsourceSpots,
    recommendations,
    lotSummary,
    rerouteDecision,
    startTime,
    demoOverrides,
  } = data;

  const lines = [];
  const log = (s = '') => lines.push(s);

  // Header
  log(SEPARATOR);
  log(`  PARKING INTELLIGENCE PIPELINE  |  ${timestamp}`);
  log(`  User Location: [${userLocation.lat}, ${userLocation.lng}]`);

  // Show active demo overrides
  if (demoOverrides) {
    const parts = [];
    if (demoOverrides.demoOccupancy != null) parts.push(`occupancy=${demoOverrides.demoOccupancy}%`);
    if (demoOverrides.demoTraffic) parts.push(`traffic=${demoOverrides.demoTraffic}`);
    if (demoOverrides.demoForceReroute === 'true') parts.push('forceReroute=true');
    if (demoOverrides.demoCameraSpotAvailable != null) parts.push(`cameraSpot=${demoOverrides.demoCameraSpotAvailable}`);
    if (demoOverrides.demoPhoneSpotFree != null) parts.push(`phoneSpotFree=${demoOverrides.demoPhoneSpotFree}`);
    if (parts.length > 0) {
      log(`  Active Overrides: ${parts.join(', ')}`);
    }
  }

  log(SEPARATOR);

  // STAGE 1: Camera Model
  log('');
  log(STAGE_SEP(1, 'CAMERA MODEL'));
  log(`  Nearest Camera: ${camera.id} (${camera.name})`);
  log(`  Camera Location: [${camera.lat}, ${camera.lng}]  |  Distance: ${cameraDistance}m`);
  log('');
  const occupiedPre = geoSpots.filter(s => s.label === 'occupied');
  const emptyPre = geoSpots.filter(s => s.label === 'empty');
  log(`  YOLO Detection Summary:`);
  log(`    Total stalls: ${geoSpots.length}  |  Empty: ${emptyPre.length}  |  Occupied: ${occupiedPre.length}`);
  log(`    Occupancy Rate: ${(occupiedPre.length / geoSpots.length * 100).toFixed(1)}%`);
  if (occupiedPre.length > 0) {
    const occList = occupiedPre.map(s => `${s.id}(${s.confidence.toFixed(2)})`).join(', ');
    log(`    Occupied: ${occList}`);
  }

  // STAGE 2: Demo Variation
  log('');
  log(STAGE_SEP(2, 'DEMO VARIATION'));
  const minute = new Date(timestamp).getMinutes();
  const seed = minute * 7 + 13;
  log(`  Seed: minute=${minute} -> seed=${seed}`);

  // Diff pre vs post variation
  const flipped = [];
  for (const vs of variedSpots) {
    const orig = geoSpots.find(g => g.id === vs.id);
    if (orig && orig.label !== vs.label) {
      flipped.push(`${vs.id} ${orig.label}->${vs.label}(${vs.confidence.toFixed(2)})`);
    }
  }
  if (flipped.length > 0) {
    log(`  Flipped: ${flipped.join(', ')}`);
  } else {
    log(`  Flipped: (none)`);
  }
  const emptyPost = variedSpots.filter(s => s.label === 'empty').length;
  const occPost = variedSpots.filter(s => s.label === 'occupied').length;
  log(`  Post-variation: Empty=${emptyPost}  |  Occupied=${occPost}`);

  // STAGE 3: Traffic (Simulated Users)
  log('');
  log(STAGE_SEP(3, 'TRAFFIC (SIMULATED USERS)'));
  const trafficLabel = demoOverrides?.demoTraffic || 'auto';
  log(`  Traffic Level: ${trafficLabel} (${simulatedUsers.length} driver${simulatedUsers.length !== 1 ? 's' : ''})`);
  for (const u of simulatedUsers) {
    log(`    ${u.id}: [${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}] ${u.speed}`);
  }

  // STAGE 4: Phone / Crowdsource Data
  log('');
  log(STAGE_SEP(4, 'PHONE / CROWDSOURCE DATA'));
  if (crowdsourceSpots && crowdsourceSpots.length > 0) {
    log(`  Crowdsource spots within 500m:`);
    for (const cs of crowdsourceSpots) {
      log(`    ${cs.id}: "${cs.name}" — ${cs.distance}m`);
    }
  } else {
    log(`  No crowdsource spots within 500m`);
  }
  if (allCrowdsourceSpots) {
    const outOfRange = allCrowdsourceSpots.filter(
      cs => !crowdsourceSpots || !crowdsourceSpots.find(c => c.id === cs.id)
    );
    if (outOfRange.length > 0) {
      const oorList = outOfRange.map(cs => {
        const d = cs.distance;
        return `${cs.id} (${d >= 1000 ? (d / 1000).toFixed(1) + 'km' : d + 'm'})`;
      }).join(', ');
      log(`  Out of range: ${oorList}`);
    }
  }

  // STAGE 5: Confidence Scoring
  log('');
  log(STAGE_SEP(5, 'CONFIDENCE SCORING (top 10)'));
  log(`  overallConfidence = mlConfidence × distancePenalty × queuePenalty`);
  log('');
  log(`  Rank | Spot | ML Conf | Dist(m) | DistPen | Queue | QPen  | Overall`);
  log(`  -----+------+---------+---------+---------+-------+-------+--------`);
  const top10 = recommendations.slice(0, 10);
  top10.forEach((r, i) => {
    log(`  ${padLeft(i + 1, 4)}  | ${pad(r.id, 4)} | ${padLeft(r.mlConfidence.toFixed(2), 7)} | ${padLeft(r.distance, 7)} | ${padLeft(r.distancePenalty.toFixed(2), 7)} | ${padLeft(r.queuePosition, 5)} | ${padLeft(r.queuePenalty.toFixed(2), 5)} | ${padLeft(r.overallConfidence.toFixed(2), 7)}`);
  });

  // Note Row C hardcoded values
  const rowCInRecs = recommendations.filter(r => r.row === 'C');
  if (rowCInRecs.length > 0) {
    const cList = rowCInRecs.map(r => `${r.id}=${ROW_C_HARDCODED_CONFIDENCE[r.id]}`).filter(Boolean).join(', ');
    if (cList) {
      log(`  [Row C: hardcoded confidence — ${cList}]`);
    }
  }

  // STAGE 6: Future Confidence Decay
  log('');
  log(STAGE_SEP(6, 'FUTURE CONFIDENCE DECAY'));
  log(`  Decay: confidence × e^(-${DECAY_RATE} × t)`);
  if (recommendations.length > 0) {
    const top = recommendations[0];
    log(`  Top spot ${top.id} (${top.overallConfidence}): +1m=${top.futureConfidence['1min']}  +3m=${top.futureConfidence['3min']}  +5m=${top.futureConfidence['5min']}  +10m=${top.futureConfidence['10min']}`);
  }

  // STAGE 7: Reroute Decision
  log('');
  log(STAGE_SEP(7, 'REROUTE DECISION'));
  const bestConf = recommendations.length > 0 ? recommendations[0].overallConfidence : 0;
  log(`  Best confidence: ${bestConf}  |  Threshold: ${REROUTE_THRESHOLD}`);
  if (rerouteDecision.shouldReroute) {
    log(`  Decision: REROUTE RECOMMENDED`);
    log(`  Reason: ${rerouteDecision.reason}`);
    if (rerouteDecision.alternative) {
      const alt = rerouteDecision.alternative;
      log(`  Alternative: ${alt.name} (conf=${alt.estimatedConfidence}, ${alt.estimatedDriveMinutes}min drive, ${alt.typicalOpenSpots}/${alt.totalSpots} spots)`);
    }
  } else {
    log(`  Decision: NO REROUTE (${bestConf} >= ${REROUTE_THRESHOLD})`);
  }

  // STAGE 8: Final Recommendation
  log('');
  log(STAGE_SEP(8, 'FINAL RECOMMENDATION'));
  if (recommendations.length >= 1) {
    const r1 = recommendations[0];
    log(`  #1 Spot ${r1.id} (confidence ${r1.overallConfidence})`);
    log(`     Closest empty spot (${r1.distance}m). ${r1.queuePosition === 0 ? 'No queue.' : `Queue: ${r1.queuePosition} ahead.`} ML confidence ${r1.mlConfidence.toFixed(2)}.`);
  }
  if (recommendations.length >= 2) {
    const r2 = recommendations[1];
    const r1 = recommendations[0];
    const reason = r2.distance > r1.distance
      ? `Slightly farther (${r2.distance}m). Lower distance penalty.`
      : r2.queuePosition > r1.queuePosition
        ? `Higher queue position (${r2.queuePosition} ahead).`
        : `Lower overall confidence.`;
    log(`  #2 Spot ${r2.id} (confidence ${r2.overallConfidence})`);
    log(`     ${reason}`);
  }
  if (recommendations.length >= 3) {
    const r3 = recommendations[2];
    log(`  #3 Spot ${r3.id} (confidence ${r3.overallConfidence})`);
  }

  const elapsed = startTime ? Date.now() - startTime : null;
  log(SEPARATOR);
  if (elapsed !== null) {
    log(`  PIPELINE COMPLETE  |  ${elapsed}ms`);
    log(SEPARATOR);
  }

  const output = lines.join('\n');
  console.log(output);
  writeToFile(output);
}

/**
 * Logs the full work scenario: 8-stage pipeline + 2 legal stages.
 */
export function logWorkScenario(data) {
  const {
    timestamp,
    userLocation,
    camera,
    cameraDistance,
    geoSpots,
    variedSpots,
    simulatedUsers,
    crowdsourceSpots,
    allCrowdsourceSpots,
    recommendations,
    lotSummary,
    rerouteDecision,
    startTime,
    parkingDuration,
    legalEvaluations,
    workRecommendations,
  } = data;

  // First log the standard 8 stages (without the closing separator)
  logPipeline({
    timestamp,
    userLocation,
    camera,
    cameraDistance,
    geoSpots,
    variedSpots,
    simulatedUsers,
    crowdsourceSpots,
    allCrowdsourceSpots,
    recommendations,
    lotSummary,
    rerouteDecision,
    startTime: null, // suppress pipeline footer
  });

  const lines = [];
  const log = (s = '') => lines.push(s);

  const now = new Date(timestamp);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStr = dayNames[now.getDay()];

  // STAGE 9: Legal Evaluation
  log('');
  log(STAGE_SEP(9, 'LEGAL EVALUATION'));
  log(`  Duration requested: ${parkingDuration} min  |  Current: ${timeStr} ${dayStr}`);

  for (const le of legalEvaluations) {
    log('');
    log(`  ${le.locationId} — ${le.zoneName}${le.distance != null ? ` (${le.distance}m away)` : ''}`);
    log(`    Type: ${le.type}  |  Rate: ${le.rate != null ? '$' + le.rate.toFixed(2) + '/hr' : 'n/a'}${le.timeLimit ? `  |  Time Limit: ${le.timeLimit}min` : '  |  Time Limit: none'}`);

    if (le.enforcementStatus) {
      log(`    Enforcement: ${le.enforcementStatus}`);
    }

    const statusLabel = le.isLegal ? 'LEGAL' : 'ILLEGAL';
    let statusLine = `    Status: ${statusLabel}`;
    if (le.isLegal && le.validUntil) {
      statusLine += ` (within limit)  |  Valid Until: ${le.validUntil}`;
    } else if (!le.isLegal) {
      statusLine += ` (${le.reason})`;
    }

    if (le.estimatedCost != null) {
      statusLine += `  |  Est. Cost: $${le.estimatedCost.toFixed(2)}`;
    }
    log(statusLine);

    if (le.specialRules) {
      log(`    Note: ${le.specialRules}`);
    }
  }

  // STAGE 10: Work Recommendation Classification
  log('');
  log(STAGE_SEP(10, 'WORK RECOMMENDATION CLASSIFICATION'));

  for (const wr of workRecommendations) {
    log(`  Spot ${wr.spotId} -> ${wr.classification}`);
    log(`    ${wr.rationale}`);
  }

  const elapsed = startTime ? Date.now() - startTime : null;
  log(SEPARATOR);
  if (elapsed !== null) {
    log(`  WORK SCENARIO COMPLETE  |  ${elapsed}ms`);
  } else {
    log(`  WORK SCENARIO COMPLETE`);
  }
  log(SEPARATOR);

  const output = lines.join('\n');
  console.log(output);
  writeToFile(output);
}
