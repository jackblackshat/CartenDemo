import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};

const DEV_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

const API_BASE_URL: string = extra.apiBaseUrl ?? DEV_BASE_URL;

export const MAPBOX_TOKEN: string =
  extra.mapboxToken ??
  'pk.eyJ1IjoiYWRpdGVzdDEiLCJhIjoiY21rZHBlaGtuMDh1bDNnc2Z5bWU1aWlxcSJ9.CL3A8ooo77Y5TMkzRsYBDA';

export const API = {
  parking(point: { lat: number; lng: number }, radius: number): string {
    return `${API_BASE_URL}/parking?point=${point.lat}%7C${point.lng}&radius=${radius}`;
  },

  routing(
    originLng: number,
    originLat: number,
    destinationLng: number,
    destinationLat: number,
  ): string {
    return `${API_BASE_URL}/routing?originlng=${originLng}&originlat=${originLat}&destinationlng=${destinationLng}&destinationlat=${destinationLat}`;
  },

  crowdsourceResponse: `${API_BASE_URL}/crowdsource-response`,

  geocode(query: string): string {
    return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`;
  },

  spotDetection(lat: number, lng: number, radius: number = 500): string {
    return `${API_BASE_URL}/spot-detection?lat=${lat}&lng=${lng}&radius=${radius}`;
  },

  spotIntelligence(
    lat: number,
    lng: number,
    demo?: {
      occupancy?: number | null;
      traffic?: 'light' | 'moderate' | 'heavy' | null;
      forceReroute?: boolean;
      cameraSpotAvailable?: boolean | null;
      phoneSpotFree?: boolean | null;
      workScenario?: boolean;
      parkingDuration?: number | null;
    },
  ): string {
    let url = `${API_BASE_URL}/spot-intelligence?lat=${lat}&lng=${lng}`;
    if (demo?.occupancy != null) url += `&demoOccupancy=${demo.occupancy}`;
    if (demo?.traffic) url += `&demoTraffic=${demo.traffic}`;
    if (demo?.forceReroute) url += `&demoForceReroute=true`;
    if (demo?.cameraSpotAvailable === true) url += `&demoCameraSpotAvailable=true`;
    if (demo?.cameraSpotAvailable === false) url += `&demoCameraSpotAvailable=false`;
    if (demo?.phoneSpotFree === true) url += `&demoPhoneSpotFree=true`;
    if (demo?.phoneSpotFree === false) url += `&demoPhoneSpotFree=false`;
    if (demo?.workScenario) url += `&workScenario=true`;
    if (demo?.parkingDuration != null) url += `&parkingDuration=${demo.parkingDuration}`;
    return url;
  },

  rerouteCheck(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
    currentConfidence: number,
  ): string {
    return `${API_BASE_URL}/reroute-check?originlat=${originLat}&originlng=${originLng}&destinationlat=${destinationLat}&destinationlng=${destinationLng}&currentConfidence=${currentConfidence}`;
  },
};
