// VesselGallery.tsx — responsive grid of VesselCard. Rendered inside FleetExplorer (client).
import { VesselCard } from '@/features/fleet-explorer/VesselCard';
import type { VesselGalleryProps } from './VesselGallery.types';
import styles from './VesselGallery.module.css';

export function VesselGallery({ vessels, onSelect }: VesselGalleryProps) {
  return (
    <div className={styles.grid}>
      {vessels.map((vessel) => (
        <VesselCard key={vessel.id} vessel={vessel} onSelect={onSelect} />
      ))}
    </div>
  );
}
