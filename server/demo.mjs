#!/usr/bin/env node
// Interactive demo CLI — choose overrides, see the full pipeline in console

import readline from 'readline';

const BASE = 'http://localhost:4000/spot-intelligence?lat=32.7108&lng=-117.1603';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

function pick(label, options) {
  return new Promise((resolve) => {
    console.log(`\n  ${label}`);
    options.forEach((o, i) => console.log(`    ${i + 1}) ${o.label}`));
    rl.question('  > ', (ans) => {
      const idx = parseInt(ans) - 1;
      resolve(options[idx >= 0 && idx < options.length ? idx : 0].value);
    });
  });
}

async function run() {
  console.log('\n========================================');
  console.log('  CARTEN DEMO CONTROLS');
  console.log('========================================');

  const occupancy = await pick('Lot Occupancy:', [
    { label: 'Auto (no override)', value: null },
    { label: '25% (mostly empty)', value: 25 },
    { label: '50% (half full)', value: 50 },
    { label: '75% (busy)', value: 75 },
    { label: '90% (nearly full)', value: 90 },
    { label: '100% (full)', value: 100 },
  ]);

  const camera = await pick('Camera Spot Available:', [
    { label: 'Auto', value: null },
    { label: 'Available (high confidence)', value: 'true' },
    { label: 'Unavailable (low confidence)', value: 'false' },
  ]);

  const phone = await pick('Phone/Crowd — no one in spot:', [
    { label: 'Auto', value: null },
    { label: 'Yes (no simulated users)', value: 'true' },
    { label: 'No (users present)', value: 'false' },
  ]);

  const traffic = await pick('Traffic Level:', [
    { label: 'Auto (3 drivers)', value: null },
    { label: 'Light (1 driver)', value: 'light' },
    { label: 'Moderate (3 drivers)', value: 'moderate' },
    { label: 'Heavy (6 drivers)', value: 'heavy' },
  ]);

  const reroute = await pick('Force Reroute:', [
    { label: 'No', value: false },
    { label: 'Yes', value: true },
  ]);

  const work = await pick('Work Scenario (legal stages):', [
    { label: 'Off', value: false },
    { label: 'On', value: true },
  ]);

  let duration = 120;
  if (work) {
    const d = await ask('\n  Parking duration (minutes, default 120): ');
    duration = parseInt(d) || 120;
  }

  // Build URL
  let url = BASE;
  if (occupancy !== null) url += `&demoOccupancy=${occupancy}`;
  if (camera !== null) url += `&demoCameraSpotAvailable=${camera}`;
  if (phone !== null) url += `&demoPhoneSpotFree=${phone}`;
  if (traffic !== null) url += `&demoTraffic=${traffic}`;
  if (reroute) url += `&demoForceReroute=true`;
  if (work) url += `&workScenario=true&parkingDuration=${duration}`;

  console.log('\n  Sending request...\n');

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('  Error:', err.error || `HTTP ${res.status}`);
      console.log('\n  Make sure the server is running: cd server && npm start\n');
    } else {
      // Response received — the pipeline output is already printed
      // by the server to its console. Print a summary here too.
      const d = await res.json();
      console.log('  ──────────────────────────────────────');
      console.log('  RESPONSE SUMMARY');
      console.log('  ──────────────────────────────────────');
      console.log(`  Occupancy:    ${d.lotSummary.occupancyRate}% (${d.lotSummary.openSpots}/${d.lotSummary.totalSpots} open)`);
      console.log(`  Top Spot:     ${d.recommendations[0]?.id || 'none'} (confidence: ${d.recommendations[0]?.overallConfidence || 0})`);
      console.log(`  Sim Users:    ${d.simulatedUsers}`);
      console.log(`  Reroute:      ${d.rerouteDecision.shouldReroute}${d.rerouteDecision.reason ? ' — ' + d.rerouteDecision.reason : ''}`);
      if (d.rerouteDecision.alternative) {
        console.log(`  Alternative:  ${d.rerouteDecision.alternative.name} (${d.rerouteDecision.alternative.estimatedDriveMinutes}min drive)`);
      }
      if (d.legalContext) {
        console.log(`  Legal Zones:  ${d.legalContext.length}`);
        for (const le of d.legalContext) {
          const cost = le.estimatedCost != null ? `$${le.estimatedCost.toFixed(2)}` : 'n/a';
          console.log(`    ${le.zoneName}: ${le.isLegal ? 'LEGAL' : 'ILLEGAL'} (${le.reason}) cost=${cost}`);
        }
      }
      if (d.workRecommendations) {
        console.log(`  Classifications:`);
        for (const wr of d.workRecommendations.slice(0, 5)) {
          console.log(`    ${wr.spotId}: ${wr.classification}`);
        }
      }
      console.log('  ──────────────────────────────────────\n');
    }
  } catch (e) {
    console.error('  Connection failed:', e.message);
    console.log('\n  Make sure the server is running: cd server && npm start\n');
  }

  const again = await ask('  Run again? (y/n): ');
  if (again.toLowerCase() === 'y') {
    return run();
  }

  rl.close();
}

run();
