// Shared Zod schemas used across all API routes (pagination, ID param validation)

import { z } from 'zod';

/** Validates a cuid string parameter */
export const CuidParamSchema = z.object({
  id: z.string().cuid(),
});

/** Pagination query params (optional, with defaults) */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
