import type {
  ParkingApiResponse,
  GeocodingResponse,
  RoutingResponse,
  CrowdsourceSpot,
  CrowdsourceResponse,
} from '../types';

// Get environment variables with fallbacks
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// API client with error handling
async function fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

// Parking API
export async function fetchParking(
  point: { lat: number; lng: number },
  radius: number = 100
): Promise<ParkingApiResponse> {
  const url = `${API_BASE_URL}/parking?point=${point.lat}|${point.lng}&radius=${radius}`;
  return fetchWithError<ParkingApiResponse>(url);
}

// Fetch parking with progressive radius search (like mobile app)
export async function fetchParkingWithFallback(
  point: { lat: number; lng: number }
): Promise<ParkingApiResponse | null> {
  const radii = [50, 100, 150, 200, 300];

  for (const radius of radii) {
    try {
      const result = await fetchParking(point, radius);
      return result;
    } catch (error) {
      // Continue to next radius
      console.log(`No parking found at ${radius}m, trying larger radius...`);
    }
  }

  return null;
}

// Routing API
export async function fetchRouting(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RoutingResponse> {
  const url = `${API_BASE_URL}/routing?originlng=${origin.lng}&originlat=${origin.lat}&destinationlng=${destination.lng}&destinationlat=${destination.lat}`;
  return fetchWithError<RoutingResponse>(url);
}

// Geocoding API (direct to Mapbox)
export async function geocodeSearch(query: string): Promise<GeocodingResponse> {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured');
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&country=US`;
  return fetchWithError<GeocodingResponse>(url);
}

// Reverse geocoding
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResponse> {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured');
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
  return fetchWithError<GeocodingResponse>(url);
}

// Crowdsource spots API
export async function fetchCrowdsourceSpots(
  lat: number,
  lng: number,
  radius: number = 50
): Promise<{ spots: CrowdsourceSpot[] }> {
  const url = `${API_BASE_URL}/crowdsource-spots?lat=${lat}&lng=${lng}&radius=${radius}`;
  return fetchWithError<{ spots: CrowdsourceSpot[] }>(url);
}

// Submit crowdsource response
export async function submitCrowdsourceResponse(
  response: CrowdsourceResponse
): Promise<{ success: boolean; message: string }> {
  const url = `${API_BASE_URL}/crowdsource-response`;
  return fetchWithError<{ success: boolean; message: string }>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  });
}

// Check server config
export async function checkServerConfig(): Promise<{ exists: boolean }> {
  const url = `${API_BASE_URL}/checkConfig`;
  return fetchWithError<{ exists: boolean }>(url);
}

// Get auth token (for INRIX)
export async function getAuthToken(): Promise<{ token: string; exp: number }> {
  const url = `${API_BASE_URL}/getToken`;
  return fetchWithError<{ token: string; exp: number }>(url);
}

// Export config for use elsewhere
export const config = {
  API_BASE_URL,
  MAPBOX_TOKEN,
};
