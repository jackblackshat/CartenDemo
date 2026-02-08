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

/**
 * Returns simulated user positions with slight time-based shifts.
 * Positions shift based on current minute to make queue dynamic.
 */
export function getSimulatedUsers() {
  const minute = new Date().getMinutes();
  const second = Math.floor(new Date().getSeconds() / 15); // 0-3

  return BASE_USERS.map((user) => {
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
