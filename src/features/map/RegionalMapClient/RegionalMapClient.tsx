// Client wrapper — owns useRegionalMap, lazy-loads RegionalMap (ssr:false), renders states
'use client';

import dynamic from 'next/dynamic';
import { useRegionalMap } from '../hooks/useRegionalMap';
import type { RegionalMapClientProps } from './RegionalMapClient.types';

// Leaflet touches `window` on import → load RegionalMap client-only.
// ssr:false is legal here because this is a Client Component (NOT in the page server component).
const RegionalMap = dynamic(() => import('../RegionalMap').then((mod) => mod.RegionalMap), {
  ssr: false,
  loading: () => <div style={{ height: 500 }}>Loading map…</div>,
});

export function RegionalMapClient({ center, zoom }: RegionalMapClientProps) {
  const { vessels, isLoading, error } = useRegionalMap();

  if (isLoading) {
    return <div style={{ height: 500 }}>Loading map…</div>;
  }
  if (error !== null) {
    return <div style={{ height: 500 }}>Map unavailable: {error}</div>;
  }
  return (
    <RegionalMap
      vessels={vessels}
      {...(center !== undefined ? { center } : {})}
      {...(zoom !== undefined ? { zoom } : {})}
    />
  );
}
