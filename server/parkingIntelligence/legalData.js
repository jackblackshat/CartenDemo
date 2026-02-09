// Parking regulations for San Diego locations
// Used by /spot-intelligence endpoint (workScenario mode) for legal/regulatory reasoning

const PARKING_REGULATIONS = {
  // Camera lot locations
  cam_gaslamp_01: {
    zoneName: 'Gaslamp District Lot A',
    type: 'lot',
    restrictions: {
      timeLimit: null, // no time limit
      enforcedHours: null,
      enforcedDays: null,
      permitRequired: false,
      rate: 3.00,
    },
    specialRules: 'Flat rate $15 after 5pm. Max $25/day.',
  },
  cam_eastvillage_01: {
    zoneName: 'East Village Parking Garage B',
    type: 'garage',
    restrictions: {
      timeLimit: null,
      enforcedHours: null,
      enforcedDays: null,
      permitRequired: false,
      rate: 2.00,
    },
    specialRules: 'Monthly passes available. EV charging on level 2.',
  },
  cam_littleitaly_01: {
    zoneName: 'Little Italy Parking Lot C',
    type: 'lot',
    restrictions: {
      timeLimit: 180, // 3 hours
      enforcedHours: { start: 8, end: 20 },
      enforcedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      permitRequired: false,
      rate: 2.50,
    },
    specialRules: 'Free on Sundays. Farmers market Sat 8am-2pm reduces capacity.',
  },

  // Crowdsource spot locations
  sd_gaslamp_001: {
    zoneName: 'Gaslamp Quarter Metered Zone',
    type: 'metered',
    restrictions: {
      timeLimit: 120, // 2 hours
      enforcedHours: { start: 8, end: 18 },
      enforcedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      permitRequired: false,
      rate: 2.50,
    },
    specialRules: 'No parking during street cleaning Tue 6-8am.',
  },
  sd_eastvillage_001: {
    zoneName: 'East Village Permit Zone B',
    type: 'permit',
    restrictions: {
      timeLimit: null,
      enforcedHours: { start: 0, end: 24 },
      enforcedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      permitRequired: true,
      rate: null,
    },
    specialRules: 'Zone B Resident permit required. Visitors max 2hrs with dashboard pass.',
  },
  sd_littleitaly_001: {
    zoneName: 'Little Italy Metered Street',
    type: 'metered',
    restrictions: {
      timeLimit: 90,
      enforcedHours: { start: 9, end: 18 },
      enforcedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      permitRequired: false,
      rate: 1.75,
    },
    specialRules: 'Free parking after 6pm and Sundays.',
  },
  sd_hillcrest_001: {
    zoneName: 'Hillcrest 2-Hour Zone',
    type: 'free',
    restrictions: {
      timeLimit: 120,
      enforcedHours: { start: 8, end: 18 },
      enforcedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      permitRequired: false,
      rate: null,
    },
    specialRules: 'Free but 2hr limit enforced. Residential permit exemption available.',
  },
  sd_northpark_001: {
    zoneName: 'North Park Metered Zone',
    type: 'metered',
    restrictions: {
      timeLimit: 120,
      enforcedHours: { start: 8, end: 20 },
      enforcedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      permitRequired: false,
      rate: 1.50,
    },
    specialRules: 'Free on Sundays. Meter accepts coins and ParkMobile app.',
  },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Evaluates whether parking is currently legal at the given location.
 * Checks current day/time against enforcement windows.
 *
 * @param {string} locationId - camera or crowdsource spot ID
 * @param {number} parkingDuration - intended parking duration in minutes (default 120)
 * @returns {{ isLegal, reason, description, validUntil, timeRemaining, rate, type }}
 */
export function evaluateLegalStatus(locationId, parkingDuration = 120) {
  const reg = PARKING_REGULATIONS[locationId];
  if (!reg) {
    return {
      isLegal: true,
      reason: 'No regulations on file',
      description: 'Unknown zone — no data available',
      validUntil: null,
      timeRemaining: null,
      rate: null,
      type: 'unknown',
    };
  }

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentDay = DAY_NAMES[now.getDay()];
  const { restrictions } = reg;

  // Check permit requirement first
  if (restrictions.permitRequired) {
    return {
      isLegal: false,
      reason: 'Permit required',
      description: reg.specialRules || `${reg.zoneName} requires a permit`,
      validUntil: null,
      timeRemaining: null,
      rate: restrictions.rate,
      type: reg.type,
    };
  }

  // Check if enforcement is active
  const isEnforcedDay = restrictions.enforcedDays
    ? restrictions.enforcedDays.includes(currentDay)
    : false;

  const isEnforcedHour = restrictions.enforcedHours
    ? currentHour >= restrictions.enforcedHours.start && currentHour < restrictions.enforcedHours.end
    : false;

  const isEnforced = isEnforcedDay && isEnforcedHour;

  // If not currently enforced, parking is legal
  if (!isEnforced && restrictions.enforcedHours) {
    return {
      isLegal: true,
      reason: 'Outside enforcement hours',
      description: `Enforcement: ${restrictions.enforcedDays?.join(', ')} ${restrictions.enforcedHours.start}:00-${restrictions.enforcedHours.end}:00`,
      validUntil: null,
      timeRemaining: null,
      rate: null,
      type: reg.type,
    };
  }

  // Check time limit
  if (restrictions.timeLimit && isEnforced) {
    if (parkingDuration > restrictions.timeLimit) {
      return {
        isLegal: false,
        reason: `Exceeds ${restrictions.timeLimit}min limit`,
        description: `${reg.zoneName}: max ${restrictions.timeLimit} min, you need ${parkingDuration} min`,
        validUntil: null,
        timeRemaining: restrictions.timeLimit,
        rate: restrictions.rate,
        type: reg.type,
      };
    }

    const validUntilDate = new Date(now.getTime() + restrictions.timeLimit * 60000);
    const validUntilStr = `${String(validUntilDate.getHours()).padStart(2, '0')}:${String(validUntilDate.getMinutes()).padStart(2, '0')}`;

    return {
      isLegal: true,
      reason: 'Within time limit',
      description: `${restrictions.timeLimit}min limit — valid until ${validUntilStr}`,
      validUntil: validUntilStr,
      timeRemaining: restrictions.timeLimit,
      rate: restrictions.rate,
      type: reg.type,
    };
  }

  // No time limit or not enforced — legal
  return {
    isLegal: true,
    reason: restrictions.timeLimit ? 'Within time limit' : 'No time limit',
    description: reg.type === 'lot' || reg.type === 'garage' ? 'No time restriction' : reg.zoneName,
    validUntil: null,
    timeRemaining: null,
    rate: restrictions.rate,
    type: reg.type,
  };
}

/**
 * Classifies a parking recommendation based on legal status and confidence.
 *
 * @param {{ isLegal, timeRemaining, rate, type }} legalStatus
 * @param {number} overallConfidence
 * @returns {{ classification, rationale }}
 */
export function classifyRecommendation(legalStatus, overallConfidence) {
  // Not recommended: illegal or very low confidence
  if (!legalStatus.isLegal) {
    return {
      classification: 'NOT_RECOMMENDED',
      rationale: `Illegal (${legalStatus.reason})`,
    };
  }
  if (overallConfidence < 0.25) {
    return {
      classification: 'NOT_RECOMMENDED',
      rationale: `Very low confidence (${overallConfidence})`,
    };
  }

  // Risky: tight time or low confidence
  if (legalStatus.timeRemaining && legalStatus.timeRemaining <= 60) {
    return {
      classification: 'RISKY',
      rationale: `Short time limit (${legalStatus.timeRemaining}min remaining)`,
    };
  }
  if (overallConfidence < 0.45) {
    return {
      classification: 'RISKY',
      rationale: `Low confidence (${overallConfidence})`,
    };
  }

  // Good option: moderate confidence or higher rate
  if (overallConfidence < 0.75 || (legalStatus.rate && legalStatus.rate > 2.00)) {
    return {
      classification: 'GOOD_OPTION',
      rationale: overallConfidence < 0.75
        ? `Moderate confidence (${overallConfidence})`
        : `Legal but higher rate ($${legalStatus.rate}/hr)`,
    };
  }

  // Highly recommended: everything else
  return {
    classification: 'HIGHLY_RECOMMENDED',
    rationale: `Legal (${legalStatus.type}, ${legalStatus.timeRemaining ? legalStatus.timeRemaining + 'min limit' : 'no limit'}) + Confidence ${overallConfidence}`,
  };
}

export { PARKING_REGULATIONS };
