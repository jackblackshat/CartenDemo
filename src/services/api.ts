import { API, MAPBOX_TOKEN } from '../config/api';
import type {
  ParkingApiResponse,
  GeocodingResponse,
  RoutingResponse,
  CrowdsourceResponse,
  CrowdsourceSpot,
} from '../types';

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
  radius: number = 100,
): Promise<ParkingApiResponse> {
  const url = API.parking(point, radius);
  return fetchWithError<ParkingApiResponse>(url);
}

// Fetch parking with progressive radius search
export async function fetchParkingWithFallback(
  point: { lat: number; lng: number },
): Promise<ParkingApiResponse | null> {
  const radii = [50, 100, 150, 200, 300];

  for (const radius of radii) {
    try {
      const result = await fetchParking(point, radius);
      return result;
    } catch {
      // Continue to next radius
    }
  }

  return null;
}

// Routing API - tries local server first, falls back to Mapbox Directions API
export async function fetchRouting(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RoutingResponse> {
  try {
    const url = API.routing(origin.lng, origin.lat, destination.lng, destination.lat);
    return await fetchWithError<RoutingResponse>(url);
  } catch {
    // Fallback: call Mapbox Directions API directly
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    return fetchWithError<RoutingResponse>(url);
  }
}

// Geocoding API (direct to Mapbox)
export async function geocodeSearch(query: string): Promise<GeocodingResponse> {
  const url = API.geocode(query);
  return fetchWithError<GeocodingResponse>(url);
}

// Reverse geocoding
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodingResponse> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
  return fetchWithError<GeocodingResponse>(url);
}

// Submit crowdsource response
export async function submitCrowdsourceResponse(
  response: CrowdsourceResponse,
): Promise<{ success: boolean; message: string }> {
  return fetchWithError<{ success: boolean; message: string }>(API.crowdsourceResponse, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  });
}

// Fetch crowdsource spots
export async function fetchCrowdsourceSpots(
  lat: number,
  lng: number,
  radius: number = 50,
): Promise<{ spots: CrowdsourceSpot[] }> {
  // Use the base from API config - extract base URL from crowdsource endpoint
  const baseUrl = API.crowdsourceResponse.replace('/crowdsource-response', '');
  const url = `${baseUrl}/crowdsource-spots?lat=${lat}&lng=${lng}&radius=${radius}`;
  return fetchWithError<{ spots: CrowdsourceSpot[] }>(url);
}
