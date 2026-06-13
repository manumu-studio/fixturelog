// Hook: fetches vessel positions for the regional map and tracks load/error state

import { useCallback, useEffect, useState } from 'react';
import { fetchVesselPositions } from '../api';
import type { VesselPositionItem } from '@/lib/validators/vessel-position.validators';

interface UseRegionalMapReturn {
  vessels: VesselPositionItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRegionalMap(): UseRegionalMapReturn {
  const [vessels, setVessels] = useState<VesselPositionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchVesselPositions()
      .then((data) => { setVessels(data); })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load vessel positions');
        setVessels([]);
      })
      .finally(() => { setIsLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  return { vessels, isLoading, error, refetch: load };
}
