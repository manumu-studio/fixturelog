// Zod schemas + inferred type for the vessel-positions map endpoint

import { z } from 'zod';

// Literal arrays mirror prisma/schema.prisma enums (verified in TASK-040).
// z.enum (not z.nativeEnum) keeps @prisma/client out of the client bundle that imports this file.
const VesselTypeSchema = z.enum(['PSV', 'AHTS', 'MPSV', 'CSV', 'ERRV', 'DSV', 'CTV', 'SOV', 'OTHER']);
const VesselStatusSchema = z.enum(['OPEN', 'ON_HIRE', 'YARD', 'LAID_UP']);
const PositionSourceSchema = z.enum(['SEEDED', 'MANUAL', 'AIS', 'IMPORTED']);
const ConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

/** A single vessel's latest position, flattened for a map marker. */
export const VesselPositionItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  vesselType: VesselTypeSchema,
  status: VesselStatusSchema,
  ownerName: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  portName: z.string().nullable(),
  source: PositionSourceSchema,
  confidence: ConfidenceLevelSchema,
});

export type VesselPositionItem = z.infer<typeof VesselPositionItemSchema>;

/** Full response shape for GET /api/vessels/positions. */
export const VesselPositionsResponseSchema = z.object({
  data: z.array(VesselPositionItemSchema),
});

export type VesselPositionsResponse = z.infer<typeof VesselPositionsResponseSchema>;
