import type { FleetVessel } from '@/lib/validators/portal.validators';

export interface VesselCardProps {
  vessel: FleetVessel;
  onSelect: (vesselId: string) => void;
}
