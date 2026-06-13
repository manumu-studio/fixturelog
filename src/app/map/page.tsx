// /map — regional vessel map page (server shell; Leaflet loads client-only via RegionalMapClient)

import type { Metadata } from 'next';
import { RegionalMapClient } from '@/features/map/RegionalMapClient';

export const metadata: Metadata = {
  title: 'Regional Map — FixtureLog',
  description: 'Seeded North Sea vessel positions, color-coded by type.',
};

export default function MapPage() {
  return (
    <main style={{ padding: '1rem' }}>
      <h1>Regional Map</h1>
      <p style={{ color: '#666' }}>Seeded vessel positions — North Sea. Markers are color-coded by vessel type.</p>
      <RegionalMapClient />
    </main>
  );
}
