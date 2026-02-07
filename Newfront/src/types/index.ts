// Parking spot types
export interface ParkingSpot {
  id: string;
  street: string;
  distance: string;
  confidence: number;
  type: 'street' | 'garage';
  status: 'available' | 'prediction' | 'paid' | 'unavailable';
  timeValid: string;
  timeLimit?: string;
  price?: string;
  sources: ('camera' | 'crowd' | 'prediction' | 'api')[];
  lat: number;
  lng: number;
}

// API response types
export interface ParkingApiResponse {
  blockId: string;
  name: string;
  probability: number;
  distance: number;
  totalOpenSpaces: number;
  data: ParkingBlock;
  segment: ParkingSegment;
  geoSegment: string;
  exp: number;
}

export interface ParkingBlock {
  id: string;
  name: string;
  probability: number;
  distance: number;
  segments: ParkingSegment[];
}

export interface ParkingSegment {
  id: string;
  isOpen: boolean;
  spacesTotal: number;
  polyline6: string;
}

// Geocoding types
export interface GeocodingResult {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  relevance: number;
  context?: GeocodingContext[];
}

export interface GeocodingContext {
  id: string;
  text: string;
}

export interface GeocodingResponse {
  type: string;
  features: GeocodingResult[];
}

// Routing types
export interface RoutingResponse {
  routes: Route[];
  waypoints: Waypoint[];
}

export interface Route {
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  duration: number;
  distance: number;
  legs: RouteLeg[];
}

export interface RouteLeg {
  duration: number;
  distance: number;
  steps: RouteStep[];
}

export interface RouteStep {
  maneuver: {
    instruction: string;
    type: string;
  };
  distance: number;
  duration: number;
}

export interface Waypoint {
  name: string;
  location: [number, number];
}

// Crowdsource types
export interface CrowdsourceSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  street: string;
  lastUpdated?: string;
  isOpen?: boolean;
}

export interface CrowdsourceResponse {
  spotId: string;
  isOpen: boolean;
  timestamp: string;
  userLocation?: {
    lat: number;
    lng: number;
  };
}

// User location types
export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

// Activity types
export interface ActivityItem {
  id: string;
  type: 'found' | 'shared' | 'parked' | 'left';
  location: string;
  time: string;
  credits?: number;
}

// User profile types
export interface UserProfile {
  name: string;
  email: string;
  trustScore: number;
  tier: 'Free' | 'Premium' | 'Pro';
  creditsBalance: number;
  spotsShared: number;
  spotsFound: number;
  accuracy: number;
}
