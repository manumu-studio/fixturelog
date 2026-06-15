// Props for a single vessel marker

import type { MapVesselPosition } from '../RegionalMap/RegionalMap.types';

export interface VesselMarkerProps {
  vessel: MapVesselPosition;
  /** When provided, the marker calls this on click instead of opening the popup. */
  onVesselClick?: (vesselId: string) => void;
}
