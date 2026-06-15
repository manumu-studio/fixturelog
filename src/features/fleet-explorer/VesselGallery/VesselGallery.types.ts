import type { FleetVessel } from '@/lib/validators/portal.validators';

export interface VesselGalleryProps {
  vessels: FleetVessel[];
  onSelect: (vesselId: string) => void;
}
