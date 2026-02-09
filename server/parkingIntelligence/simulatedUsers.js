// Simulated other drivers near camera locations for queue computation

const BASE_USERS = [
  {
    id: 'sim_driver_1',
    baseLat: 32.7109,
    baseLng: -117.1601,
    speed: 'walking', // approaching on foot
  },
  {
    id: 'sim_driver_2',
    baseLat: 32.7104,
    baseLng: -117.1608,
    speed: 'driving', // still in car, circling
  },
  {
    id: 'sim_driver_3',
    baseLat: 32.7111,
    baseLng: -117.1597,
    speed: 'walking',
  },
];

const EXTRA_USERS = [
  {
    id: 'sim_driver_4',
    baseLat: 32.7106,
    baseLng: -117.1605,
    speed: 'driving',
  },
  {
    id: 'sim_driver_5',
    baseLat: 32.7113,
    baseLng: -117.1594,
    speed: 'walking',
  },
  {
    id: 'sim_driver_6',
    baseLat: 32.7101,
    baseLng: -117.1610,
    speed: 'driving',
  },
];

/**
 * Returns simulated user positions with slight time-based shifts.
 * Positions shift based on current minute to make queue dynamic.
 * @param {string|null} trafficLevel - 'light' (1 user), 'moderate' (3), 'heavy' (6), null (default 3)
 */
export function getSimulatedUsers(trafficLevel = null) {
  let pool;
  if (trafficLevel === 'light') {
    pool = BASE_USERS.slice(0, 1);
  } else if (trafficLevel === 'heavy') {
    pool = [...BASE_USERS, ...EXTRA_USERS];
  } else {
    pool = BASE_USERS;
  }

  const minute = new Date().getMinutes();
  const second = Math.floor(new Date().getSeconds() / 15); // 0-3

  return pool.map((user) => {
    // Shift lat/lng slightly based on time
    const latShift = Math.sin((minute + parseInt(user.id.slice(-1))) * 0.5) * 0.0001;
    const lngShift = Math.cos((minute + second) * 0.3) * 0.0001;

    return {
      id: user.id,
      lat: user.baseLat + latShift,
      lng: user.baseLng + lngShift,
      speed: user.speed,
    };
  });
}
