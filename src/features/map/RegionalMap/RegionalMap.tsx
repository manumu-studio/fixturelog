// Presentational Leaflet map — OSM tiles + one CircleMarker per vessel
'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import { VesselMarker } from '../VesselMarker';
import type { RegionalMapProps } from './RegionalMap.types';

const NORTH_SEA_CENTER: [number, number] = [57.5, 1.5];
const DEFAULT_ZOOM = 5;

export function RegionalMap({ vessels, center = NORTH_SEA_CENTER, zoom = DEFAULT_ZOOM }: RegionalMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: 500, width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {vessels.map((vessel) => (
        <VesselMarker key={vessel.id} vessel={vessel} />
      ))}
    </MapContainer>
  );
}
