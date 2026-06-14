// Zod schemas for fixture, status transition, and subject API routes

import { z } from 'zod';

/** POST /api/fixtures request body. The acting broker is resolved from the session
 *  (see resolveActor), never trusted from the body — so brokerId is intentionally absent. */
export const FixtureCreateSchema = z.object({
  vesselId: z.string().cuid(),
  chartererId: z.string().cuid(),
  regionId: z.string().cuid(),
  workscopeId: z.string().cuid(),
  requirementId: z.string().cuid().optional(),
  charterType: z.enum(['SPOT', 'TERM']),
  agreedDayRate: z.number().positive(),
  currency: z.enum(['GBP', 'USD', 'NOK']),
  mobilizationFee: z.number().nonnegative().optional(),
  demobilizationFee: z.number().nonnegative().optional(),
  durationDays: z.number().int().positive().optional(),
  deliveryPort: z.string().min(1).optional(),
  redeliveryPort: z.string().min(1).optional(),
  commencement: z.coerce.date().optional(),
  charterPartyForm: z.enum(['SUPPLYTIME_2017', 'OTHER']).default('SUPPLYTIME_2017'),
});

export type FixtureCreateInput = z.infer<typeof FixtureCreateSchema>;

/** GET /api/fixtures query params */
export const FixtureListQuerySchema = z.object({
  status: z.enum([
    'DRAFT', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'COMPLETED', 'FAILED',
  ]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type FixtureListQuery = z.infer<typeof FixtureListQuerySchema>;

/** PATCH /api/fixtures/:id/status request body. The actor is resolved from the session
 *  (see resolveActor), never trusted from the body — so actor is intentionally absent. */
export const FixtureStatusTransitionSchema = z.object({
  toStatus: z.enum([
    'DRAFT', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'COMPLETED', 'FAILED',
  ]),
  notes: z.string().optional(),
});

export type FixtureStatusTransition = z.infer<typeof FixtureStatusTransitionSchema>;

/** Mirrors the Prisma SubjectItemStatus enum (added in T1). */
export const SubjectStatusEnum = z.enum(['PENDING', 'LIFTED', 'WAIVED', 'FAILED']);

/** POST /api/fixtures/:id/subjects request body — add a subject line item. */
export const SubjectCreateSchema = z.object({
  label: z.string().min(1).max(200),
  status: SubjectStatusEnum.default('PENDING'),
  dueAt: z.coerce.date().optional(),
  owner: z.string().min(1).max(100).optional(),
});

export type SubjectCreateInput = z.infer<typeof SubjectCreateSchema>;

/** PATCH /api/fixtures/:id/subjects/:subjectId request body — update/lift a subject.
 *  At least one field must be present; `status` is the field used to lift (-> LIFTED/WAIVED). */
export const SubjectUpdateSchema = z
  .object({
    label: z.string().min(1).max(200).optional(),
    status: SubjectStatusEnum.optional(),
    dueAt: z.coerce.date().nullable().optional(),
    owner: z.string().min(1).max(100).nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided',
  });

export type SubjectUpdateInput = z.infer<typeof SubjectUpdateSchema>;
