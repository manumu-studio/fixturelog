// Client-side fetch helper for vessel positions — Zod-validates the API response

import {
  VesselPositionsResponseSchema,
  type VesselPositionItem,
} from '@/lib/validators/vessel-position.validators';

const POSITIONS_ENDPOINT = '/api/vessels/positions';

/** Fetches and Zod-validates vessel positions for the regional map. */
export async function fetchVesselPositions(): Promise<VesselPositionItem[]> {
  const res = await fetch(POSITIONS_ENDPOINT);
  if (!res.ok) {
    throw new Error(`Failed to fetch vessel positions: ${res.status}`);
  }
  const raw: unknown = await res.json();
  const parsed = VesselPositionsResponseSchema.parse(raw); // throws ZodError on shape drift
  return parsed.data;
}
