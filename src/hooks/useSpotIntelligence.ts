import { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../config/api';
import type { Coords, IntelligenceResponse } from '../types';

const REFRESH_INTERVAL = 15000; // 15 seconds

export type DemoParams = {
  occupancy?: number | null;
  traffic?: 'light' | 'moderate' | 'heavy' | null;
  forceReroute?: boolean;
  cameraSpotAvailable?: boolean | null;
  phoneSpotFree?: boolean | null;
  workScenario?: boolean;
  parkingDuration?: number | null;
};

export default function useSpotIntelligence(
  destination: Coords | null,
  enabled: boolean,
  demo?: DemoParams,
) {
  const [data, setData] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchIntelligence = useCallback(async () => {
    if (!destination) return;

    try {
      setLoading(true);
      setError(null);

      const url = API.spotIntelligence(destination.lat, destination.lng, demo);
      const response = await fetch(url);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const result: IntelligenceResponse = await response.json();
      setData(result);
      failedRef.current = false;
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch spot intelligence';
      setError(msg);

      // Stop auto-refresh on network errors to avoid console spam
      if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
        failedRef.current = true;
        clearTimer();
      }
    } finally {
      setLoading(false);
    }
  }, [destination, demo?.occupancy, demo?.traffic, demo?.forceReroute, demo?.cameraSpotAvailable, demo?.phoneSpotFree, demo?.workScenario, demo?.parkingDuration, clearTimer]);

  // Fetch on mount/change + auto-refresh every 15s
  useEffect(() => {
    if (!enabled || !destination) {
      setData(null);
      failedRef.current = false;
      return;
    }

    fetchIntelligence();

    // Only start interval if not in a failed state
    if (!failedRef.current) {
      intervalRef.current = setInterval(() => {
        if (!failedRef.current) {
          fetchIntelligence();
        }
      }, REFRESH_INTERVAL);
    }

    return clearTimer;
  }, [enabled, destination, fetchIntelligence, clearTimer]);

  return { data, loading, error, refresh: fetchIntelligence };
}
