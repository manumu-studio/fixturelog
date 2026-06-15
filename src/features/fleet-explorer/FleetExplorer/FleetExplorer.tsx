// FleetExplorer.tsx — orchestrates the reused Leaflet map + vessel gallery + shared modal.
// Client component: the map is dynamically imported (ssr:false) because Leaflet touches
// `window`. A marker click and a card click both open the same VesselModal.
'use client';

import dynamic from 'next/dynamic';
import { VesselGallery } from '@/features/fleet-explorer/VesselGallery';
import { VesselModal } from '@/features/fleet-explorer/VesselModal';
import { useFleetExplorer } from '@/features/fleet-explorer/useFleetExplorer';
import type { FleetExplorerProps } from './FleetExplorer.types';
import styles from './FleetExplorer.module.css';

const RegionalMap = dynamic(
  () => import('@/features/map/RegionalMap').then((mod) => mod.RegionalMap),
  { ssr: false, loading: () => <div className={styles.mapLoading}>Loading map…</div> },
);

export function FleetExplorer({ vessels, canCreateEnquiry }: FleetExplorerProps) {
  const { selected, positions, select, clear } = useFleetExplorer(vessels);

  return (
    <div className={styles.wrap}>
      <div className={styles.mapCard}>
        <RegionalMap vessels={positions} onVesselClick={select} />
      </div>
      <VesselGallery vessels={vessels} onSelect={select} />
      <VesselModal
        vessel={selected}
        onClose={clear}
        canCreateEnquiry={canCreateEnquiry}
      />
    </div>
  );
}
