import { useState, useEffect, useCallback } from 'react';
import { fetchParkingWithFallback } from '../services/api';
import type { ParkingApiResponse, ParkingSpot } from '../types';

interface UseParkingResult {
  spots: ParkingSpot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Convert API response to ParkingSpot format
function apiResponseToSpot(response: ParkingApiResponse): ParkingSpot {
  return {
    id: response.blockId,
    street: response.name,
    distance: `${(response.distance / 1609.34).toFixed(1)} mi`, // meters to miles
    confidence: Math.round(response.probability * 100),
    type: 'street',
    status: response.probability > 0.7 ? 'available' : 'prediction',
    timeValid: `~${Math.round(response.exp / 60)} mins`,
    timeLimit: '2hr max',
    sources: ['api'],
    lat: 0, // Would need to decode polyline for exact coords
    lng: 0,
  };
}

export function useParking(destination: { lat: number; lng: number } | null): UseParkingResult {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!destination) {
      setSpots([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchParkingWithFallback(destination);

      if (result) {
        const spot = apiResponseToSpot(result);
        setSpots([spot]);
      } else {
        setSpots([]);
        setError('No parking found nearby');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch parking');
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, [destination?.lat, destination?.lng]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { spots, loading, error, refetch: fetchData };
}
