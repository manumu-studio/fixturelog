// copilot-tools.types.ts — shared types + Zod input/output schemas for the copilot's tools.
// The agent builds its toolset from a single BrokerToolContext so brokerId is always
// session-derived and closed over by each tool's execute/executor — never accepted as a tool
// argument. Each tool returns a small, Zod-validated, typed result.
import 'server-only';
import { z } from 'zod';
import type { BrokerContext } from '@/lib/auth/require-broker';

// The session-derived context every tool closes over. Tools take this from the route guard
// (requireBrokerApi), so the model can never spoof which broker it is acting as.
export type BrokerToolContext = Pick<BrokerContext, 'brokerId'>;

// ---------------------------------------------------------------------------
// getFixture — read tool
// ---------------------------------------------------------------------------

export const GetFixtureInputSchema = z.object({
  fixtureId: z.string().cuid().describe('The cuid of the fixture to fetch.'),
});
export type GetFixtureInput = z.infer<typeof GetFixtureInputSchema>;

const FixtureSubjectSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(['PENDING', 'LIFTED', 'WAIVED', 'FAILED']),
});

export const GetFixtureResultSchema = z.object({
  id: z.string(),
  status: z.enum(['DRAFT', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'COMPLETED', 'FAILED']),
  vesselName: z.string(),
  chartererName: z.string(),
  regionName: z.string(),
  agreedDayRate: z.number(),
  currency: z.enum(['GBP', 'USD', 'NOK']),
  subjects: z.array(FixtureSubjectSchema),
  openSubjects: z.number().int().nonnegative(),
});
export type GetFixtureResult = z.infer<typeof GetFixtureResultSchema>;

// ---------------------------------------------------------------------------
// findMatches — read tool
// ---------------------------------------------------------------------------

export const FindMatchesInputSchema = z.object({
  requirementId: z.string().cuid().describe('The cuid of the requirement to match vessels for.'),
});
export type FindMatchesInput = z.infer<typeof FindMatchesInputSchema>;

const ShortlistEntrySchema = z.object({
  vesselId: z.string(),
  vesselName: z.string(),
  score: z.number(),
  rank: z.number().int().positive(),
});

export const FindMatchesResultSchema = z.object({
  requirementId: z.string(),
  totalCandidates: z.number().int().nonnegative(),
  passedFilters: z.number().int().nonnegative(),
  shortlist: z.array(ShortlistEntrySchema),
});
export type FindMatchesResult = z.infer<typeof FindMatchesResultSchema>;

// ---------------------------------------------------------------------------
// advanceFixtureStatus — write tool (proposed only; executor lives in its file)
// ---------------------------------------------------------------------------

export const AdvanceFixtureStatusInputSchema = z.object({
  fixtureId: z.string().cuid().describe('The cuid of the fixture to transition.'),
  toStatus: z
    .enum(['DRAFT', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'COMPLETED', 'FAILED'])
    .describe('The target status. Must be a legal next status for the fixture.'),
});
export type AdvanceFixtureStatusInput = z.infer<typeof AdvanceFixtureStatusInputSchema>;

export const AdvanceFixtureStatusResultSchema = z.object({
  fixtureId: z.string(),
  fromStatus: z.enum(['DRAFT', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'COMPLETED', 'FAILED']),
  toStatus: z.enum(['DRAFT', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'COMPLETED', 'FAILED']),
});
export type AdvanceFixtureStatusResult = z.infer<typeof AdvanceFixtureStatusResultSchema>;

// ---------------------------------------------------------------------------
// generateRecap — write tool (proposed only; executor lives in its file)
// ---------------------------------------------------------------------------

export const GenerateRecapInputSchema = z.object({
  fixtureId: z.string().cuid().describe('The cuid of the FIXED or COMPLETED fixture to recap.'),
});
export type GenerateRecapInput = z.infer<typeof GenerateRecapInputSchema>;

export const GenerateRecapResultSchema = z.object({
  fixtureId: z.string(),
  recapId: z.string(),
  version: z.number().int().positive(),
  markdown: z.string(),
});
export type GenerateRecapResult = z.infer<typeof GenerateRecapResultSchema>;

// ---------------------------------------------------------------------------
// Shared executor outcome — broker-scoped executors return this discriminated union so the
// agent can turn a rejection into a user-facing message without throwing.
// ---------------------------------------------------------------------------

export type ToolOutcome<T> = { ok: true; data: T } | { ok: false; error: string };
