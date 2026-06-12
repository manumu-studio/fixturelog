// Zod schemas for charterer API routes — create, list, and query validation

import { z } from 'zod';

/** POST /api/charterers request body.
 *  contactName/contactEmail/contactPhone map to the Charterer contact columns
 *  added by this packet's migration (see T2 — Schema Migration). */
export const ChartererCreateSchema = z.object({
  name: z.string().min(1).max(200),
  sector: z.string().min(1).max(100).optional(),
  contactName: z.string().min(1).max(200).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(1).max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export type ChartererCreateInput = z.infer<typeof ChartererCreateSchema>;

/** GET /api/charterers query params */
export const ChartererListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ChartererListQuery = z.infer<typeof ChartererListQuerySchema>;
