// enquiry-options.ts — select options for the Create Enquiry form. Values match the
// Prisma enums (VesselType / RegionCode / WorkscopeCode / CharterType); the API resolves
// region/workscope codes to ids server-side.

export interface EnquiryOption {
  value: string;
  label: string;
}

export const VESSEL_TYPE_OPTIONS: EnquiryOption[] = [
  { value: 'PSV', label: 'PSV — Platform Supply' },
  { value: 'AHTS', label: 'AHTS — Anchor Handling' },
  { value: 'MPSV', label: 'MPSV — Multi-Purpose' },
  { value: 'CSV', label: 'CSV — Construction Support' },
  { value: 'ERRV', label: 'ERRV — Emergency Response' },
  { value: 'DSV', label: 'DSV — Dive Support' },
  { value: 'CTV', label: 'CTV — Crew Transfer' },
  { value: 'SOV', label: 'SOV — Service Operation' },
  { value: 'OTHER', label: 'Other' },
];

export const REGION_OPTIONS: EnquiryOption[] = [
  { value: 'NORTH_SEA', label: 'North Sea' },
  { value: 'BRAZIL', label: 'Brazil' },
  { value: 'US_GULF', label: 'US Gulf of Mexico' },
  { value: 'WEST_AFRICA', label: 'West Africa' },
  { value: 'MIDDLE_EAST', label: 'Middle East' },
  { value: 'SE_ASIA', label: 'Southeast Asia' },
  { value: 'MEDITERRANEAN', label: 'Mediterranean' },
];

export const WORKSCOPE_OPTIONS: EnquiryOption[] = [
  { value: 'SUPPLY', label: 'Platform Supply' },
  { value: 'ANCHOR_HANDLING', label: 'Anchor Handling' },
  { value: 'RIG_MOVE', label: 'Rig Move' },
  { value: 'TOWING', label: 'Towing' },
  { value: 'CONSTRUCTION', label: 'Construction Support' },
  { value: 'IMR', label: 'Inspection, Maintenance & Repair' },
  { value: 'ROV_SUPPORT', label: 'ROV Support' },
  { value: 'STANDBY', label: 'Emergency Standby' },
  { value: 'WIND_OM', label: 'Wind Farm O&M' },
];

export const CHARTER_TYPE_OPTIONS: EnquiryOption[] = [
  { value: 'SPOT', label: 'Spot' },
  { value: 'TERM', label: 'Term' },
];
