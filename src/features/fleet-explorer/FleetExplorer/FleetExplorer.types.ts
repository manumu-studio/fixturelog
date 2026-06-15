import type { FleetVessel } from '@/lib/validators/portal.validators';

export interface FleetExplorerProps {
  vessels: FleetVessel[];
  canCreateEnquiry: boolean;
}
