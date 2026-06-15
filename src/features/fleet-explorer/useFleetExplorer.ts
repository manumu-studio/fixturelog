// useFleetExplorer.ts — Fleet Explorer state: the selected vessel (for the modal) and the
// map marker positions derived from the fleet. Marker and card both call select(id), so they
// open the same modal.
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { FleetVessel } from '@/lib/validators/portal.validators';
import type { MapVesselPosition } from '@/features/map/RegionalMap/RegionalMap.types';

export interface UseFleetExplorer {
  selected: FleetVessel | null;
  positions: MapVesselPosition[];
  select: (vesselId: string) => void;
  clear: () => void;
}

export function useFleetExplorer(vessels: FleetVessel[]): UseFleetExplorer {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const select = useCallback((vesselId: string) => setSelectedId(vesselId), []);
  const clear = useCallback(() => setSelectedId(null), []);

  const selected = useMemo(
    () => vessels.find((v) => v.id === selectedId) ?? null,
    [vessels, selectedId],
  );

  const positions = useMemo<MapVesselPosition[]>(
    () =>
      vessels
        .map((v): MapVesselPosition | null =>
          v.lat === null || v.lng === null
            ? null
            : {
                id: v.id,
                name: v.name,
                vesselType: v.vesselType,
                status: v.status,
                ownerName: v.ownerName,
                lat: v.lat,
                lng: v.lng,
                portName: v.portName,
                source: v.positionSource,
                confidence: v.positionConfidence,
              },
        )
        .filter((p): p is MapVesselPosition => p !== null),
    [vessels],
  );

  return { selected, positions, select, clear };
}
