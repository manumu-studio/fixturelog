// Zod schemas for vessel API routes — list query validation with type/region/status filters

import { z } from 'zod';

/** GET /api/vessels query params */
export const VesselListQuerySchema = z.object({
  vesselType: z.enum([
    'PSV', 'AHTS', 'MPSV', 'CSV', 'ERRV', 'DSV', 'CTV', 'SOV', 'OTHER',
  ]).optional(),
  regionId: z.string().cuid().optional(),
  status: z.enum(['OPEN', 'ON_HIRE', 'YARD', 'LAID_UP']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/** Inferred type for validated vessel list query */
export type VesselListQuery = z.infer<typeof VesselListQuerySchema>;
