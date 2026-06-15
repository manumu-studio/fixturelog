// Shared types for the RegionalMap feature

import type { VesselPositionItem } from '@/lib/validators/vessel-position.validators';

/** Marker shape — re-alias of the canonical validator type (single source of truth). */
export type MapVesselPosition = VesselPositionItem;

/** Props for the presentational RegionalMap (TASK-045). */
export interface RegionalMapProps {
  vessels: MapVesselPosition[];
  center?: [number, number]; // default [57.5, 1.5] — North Sea
  zoom?: number;             // default 5
  /**
   * Optional marker-click handler (Fleet Explorer). When provided, a marker click calls
   * this instead of opening the default Leaflet popup, so a marker and a gallery card open
   * the same modal. Omitted in the broker workspace, which keeps the popup behavior.
   */
  onVesselClick?: (vesselId: string) => void;
}
