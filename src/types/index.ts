// Legacy types (kept for phoneData compatibility)
export type Coords = { lng: number; lat: number };
export type RouteGeometry = GeoJSON.LineString;

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

// Crowdsource response
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

// ML / Intelligence types
export type CameraInfo = {
  id: string;
  name: string;
  lotName: string;
  lat: number;
  lng: number;
};

export type DetectedSpot = {
  id: string;
  row: string;
  label: 'empty' | 'occupied';
  confidence: number;
  lat: number;
  lng: number;
  distanceFromCamera: number;
};

export type SpotRecommendation = {
  id: string;
  row: string;
  label: string;
  lat: number;
  lng: number;
  mlConfidence: number;
  distance: number;
  walkingTimeMinutes: number;
  queuePosition: number;
  distancePenalty: number;
  queuePenalty: number;
  overallConfidence: number;
  futureConfidence: {
    '1min': number;
    '3min': number;
    '5min': number;
    '10min': number;
  };
};

export type RerouteDecision = {
  shouldReroute: boolean;
  reason: string | null;
  currentConfidence: number;
  alternative: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    estimatedConfidence: number;
    estimatedDriveMinutes: number;
    totalSpots: number;
    typicalOpenSpots: number;
  } | null;
};

export type LotSummary = {
  totalSpots: number;
  openSpots: number;
  occupiedSpots: number;
  occupancyRate: number;
};

export type IntelligenceResponse = {
  camera: CameraInfo;
  cameraDistance: number;
  lotSummary: LotSummary;
  recommendations: SpotRecommendation[];
  allSpots: DetectedSpot[];
  rerouteDecision: RerouteDecision;
  simulatedUsers: number;
  timestamp: string;
};
