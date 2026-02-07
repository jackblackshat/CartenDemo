import { useState, useCallback } from 'react';
import { geocodeSearch } from '../services/api';
import type { GeocodingResult } from '../types';

interface UseGeocodingResult {
  results: GeocodingResult[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export function useGeocoding(): UseGeocodingResult {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await geocodeSearch(query);
      setResults(response.features || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
