import { useState, useEffect, useCallback } from 'react';
import { fetchRouting } from '../services/api';
import type { Route } from '../types';

interface UseRoutingResult {
  route: Route | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRouting(
  origin: { lat: number; lng: number } | null,
  destination: { lat: number; lng: number } | null
): UseRoutingResult {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!origin || !destination) {
      setRoute(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchRouting(origin, destination);

      if (response.routes && response.routes.length > 0) {
        setRoute(response.routes[0]);
      } else {
        setRoute(null);
        setError('No route found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch route');
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { route, loading, error, refetch: fetchData };
}
