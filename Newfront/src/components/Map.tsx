import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDarkMode } from '../context/DarkModeContext';
import type { ParkingSpot } from '../types';

// Get token from environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Set the access token
mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  spots?: ParkingSpot[];
  userLocation?: { lat: number; lng: number } | null;
  onSpotClick?: (spotId: string) => void;
  showHeatmap?: boolean;
}

export default function Map({
  center = [-122.4194, 37.7749], // San Francisco default
  zoom = 14,
  spots = [],
  userLocation,
  onSpotClick,
  showHeatmap = false,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const { isDark } = useDarkMode();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: isDark
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11',
      center: center,
      zoom: zoom,
      attributionControl: false,
      // Prevent telemetry requests to events.mapbox.com; when blocked by ad blockers
      // they cause "Failed to fetch" and can break the map. Redirect to a no-op URL.
      transformRequest: (url: string) =>
        url.includes('events.mapbox.com') ? { url: 'data:application/json,{}' } : { url },
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'bottom-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map style when dark mode changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    map.current.setStyle(
      isDark
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11'
    );
  }, [isDark, mapLoaded]);

  // Update center when it changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    map.current.flyTo({
      center: center,
      zoom: zoom,
      duration: 1000,
    });
  }, [center[0], center[1], zoom, mapLoaded]);

  // Add/update user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      // Create custom user location marker
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background: #4285f4;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          background: #4285f4;
          border-radius: 50%;
          animation: pulse 2s infinite;
          opacity: 0.4;
        "></div>
      `;

      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);

      // Center on user location
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [userLocation?.lat, userLocation?.lng, mapLoaded]);

  // Add/update parking spot markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers for each spot
    spots.forEach((spot) => {
      if (!spot.lat || !spot.lng) return;

      // Determine marker color based on status
      const color =
        spot.status === 'available'
          ? '#7FA98E'
          : spot.status === 'prediction'
          ? '#C9A96E'
          : spot.status === 'paid'
          ? '#8B9D83'
          : '#B87C7C';

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'parking-marker';
      el.innerHTML = `
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.164 0 0 7.164 0 16c0 10 16 24 16 24s16-14 16-24c0-8.836-7.164-16-16-16z" fill="${color}"/>
          <circle cx="16" cy="14" r="6" fill="white"/>
          <text x="16" y="17" text-anchor="middle" fill="${color}" font-size="8" font-weight="bold">${spot.confidence}%</text>
        </svg>
      `;
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        if (onSpotClick) {
          onSpotClick(spot.id);
        }
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([spot.lng, spot.lat])
        .addTo(map.current!);

      // Add popup
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px; font-family: system-ui;">
            <strong style="font-size: 14px;">${spot.street}</strong>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              ${spot.distance} • ${spot.confidence}% confident
            </div>
            ${spot.price ? `<div style="font-size: 12px; color: #7FA98E; margin-top: 4px;">${spot.price}</div>` : ''}
          </div>
        `);

      marker.setPopup(popup);
      markersRef.current.push(marker);
    });
  }, [spots, mapLoaded, onSpotClick]);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .mapboxgl-popup-content {
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .mapboxgl-ctrl-bottom-right {
          bottom: 100px !important;
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0" />
    </>
  );
}
