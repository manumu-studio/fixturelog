// Single vessel marker (Leaflet CircleMarker + popup), colored by vessel type
'use client';

import { CircleMarker, Popup } from 'react-leaflet';
import type { MapVesselPosition } from '../RegionalMap/RegionalMap.types';
import type { VesselMarkerProps } from './VesselMarker.types';

// Exhaustive color map keyed by the 9 vessel-type literals (no string-index fallback needed).
const VESSEL_TYPE_COLORS: Record<MapVesselPosition['vesselType'], string> = {
  PSV: '#2563eb',
  AHTS: '#dc2626',
  MPSV: '#16a34a',
  CSV: '#9333ea',
  ERRV: '#ea580c',
  DSV: '#0891b2',
  CTV: '#ca8a04',
  SOV: '#db2777',
  OTHER: '#6b7280',
};

export function VesselMarker({ vessel }: VesselMarkerProps) {
  const color = VESSEL_TYPE_COLORS[vessel.vesselType];
  const isSeeded = vessel.source === 'SEEDED';

  return (
    <CircleMarker
      center={[vessel.lat, vessel.lng]}
      radius={7}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
    >
      <Popup>
        <strong>{vessel.name}</strong>
        <br />
        Type: {vessel.vesselType}
        <br />
        Owner: {vessel.ownerName}
        <br />
        Status: {vessel.status}
        <br />
        {vessel.portName !== null ? (
          <>
            Port: {vessel.portName}
            <br />
          </>
        ) : null}
        <span style={{ fontStyle: isSeeded ? 'italic' : 'normal', color: isSeeded ? '#888' : 'inherit' }}>
          Source: {vessel.source}
          {isSeeded ? ' (demo data — not live AIS)' : ''}
        </span>
        <br />
        Confidence: {vessel.confidence}
      </Popup>
    </CircleMarker>
  );
}
