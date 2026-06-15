import type { FleetVessel } from '@/lib/validators/portal.validators';

export interface VesselModalProps {
  vessel: FleetVessel | null;
  onClose: () => void;
  canCreateEnquiry: boolean;
}
