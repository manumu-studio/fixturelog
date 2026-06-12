// Zod validation schemas for Requirement API boundaries

import { z } from 'zod';

/** POST /api/requirements request body */
export const RequirementCreateSchema = z.object({
  chartererId: z.string().cuid(),
  regionId: z.string().cuid(),
  workscopeId: z.string().cuid(),
  vesselTypeNeeded: z.enum([
    'PSV', 'AHTS', 'MPSV', 'CSV', 'ERRV', 'DSV', 'CTV', 'SOV', 'OTHER',
  ]),
  minDeckAreaM2: z.number().positive().optional(),
  minBollardPullT: z.number().positive().optional(),
  minDpClass: z.enum(['NONE', 'DP1', 'DP2', 'DP3']).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  durationDays: z.number().int().positive().optional(),
  charterType: z.enum(['SPOT', 'TERM']),
  dayRateBudget: z.number().positive().optional(),
  sourceChannel: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export type RequirementCreateInput = z.infer<typeof RequirementCreateSchema>;

/** GET /api/requirements query params */
export const RequirementListQuerySchema = z.object({
  status: z.enum([
    'ENQUIRY', 'SHORTLISTED', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'LOST',
  ]).optional(),
  regionId: z.string().cuid().optional(),
  vesselTypeNeeded: z.enum([
    'PSV', 'AHTS', 'MPSV', 'CSV', 'ERRV', 'DSV', 'CTV', 'SOV', 'OTHER',
  ]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type RequirementListQuery = z.infer<typeof RequirementListQuerySchema>;

/** POST /api/requirements/:id/match request body (optional weight overrides) */
export const MatchRequestSchema = z.object({
  weights: z.object({
    distance: z.number().min(0).max(1),
    rateFit: z.number().min(0).max(1),
    capabilityMargin: z.number().min(0).max(1),
  }).refine(
    (w) => Math.abs(w.distance + w.rateFit + w.capabilityMargin - 1.0) < 0.01,
    { message: 'Weights must sum to 1.0' },
  ).optional(),
}).optional();

export type MatchRequestInput = z.infer<typeof MatchRequestSchema>;
