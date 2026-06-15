// Zod schemas for the charterer portal API boundary (PACKET-009 §T5).
// Input: enquiry creation never accepts a chartererId — ownership is derived from the
// session. Output: every portal response is parsed against a DTO schema before it is
// returned, so the shape crossing the boundary is validated, not merely typed.
import { z } from 'zod';

const VESSEL_TYPE = z.enum(['PSV', 'AHTS', 'MPSV', 'CSV', 'ERRV', 'DSV', 'CTV', 'SOV', 'OTHER']);
const REGION_CODE = z.enum([
  'NORTH_SEA', 'BRAZIL', 'US_GULF', 'WEST_AFRICA', 'MIDDLE_EAST', 'SE_ASIA', 'MEDITERRANEAN',
]);
const WORKSCOPE_CODE = z.enum([
  'SUPPLY', 'ANCHOR_HANDLING', 'RIG_MOVE', 'TOWING', 'CONSTRUCTION', 'IMR', 'ROV_SUPPORT',
  'STANDBY', 'WIND_OM',
]);
const REQUIREMENT_STATUS = z.enum([
  'ENQUIRY', 'SHORTLISTED', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'LOST',
]);
const FIXTURE_STATUS = z.enum(['DRAFT', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'COMPLETED', 'FAILED']);
const SUBJECT_STATUS = z.enum(['PENDING', 'LIFTED', 'WAIVED', 'FAILED']);

// ─── Input ───────────────────────────────────────────────────
// Create Enquiry: region/workscope chosen by code (no cuids in the client); the
// charterer (owner) is the session's own, never a body field.
export const PortalEnquiryCreateSchema = z.object({
  vesselTypeNeeded: VESSEL_TYPE,
  regionCode: REGION_CODE,
  workscopeCode: WORKSCOPE_CODE,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  durationDays: z.number().int().positive().optional(),
  charterType: z.enum(['SPOT', 'TERM']),
  dayRateBudget: z.number().positive().optional(),
  minDeckAreaM2: z.number().positive().optional(),
  minBollardPullT: z.number().positive().optional(),
  minDpClass: z.enum(['NONE', 'DP1', 'DP2', 'DP3']).optional(),
  notes: z.string().max(2000).optional(),
});
export type PortalEnquiryCreateInput = z.infer<typeof PortalEnquiryCreateSchema>;

// ─── Response DTOs ───────────────────────────────────────────
export const EnquirySummarySchema = z.object({
  id: z.string(),
  status: REQUIREMENT_STATUS,
  vesselTypeNeeded: VESSEL_TYPE,
  regionName: z.string(),
  regionCode: REGION_CODE,
  workscopeName: z.string(),
  charterType: z.enum(['SPOT', 'TERM']),
  startDate: z.string(),
  endDate: z.string().nullable(),
  durationDays: z.number().nullable(),
  dayRateBudget: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type EnquirySummary = z.infer<typeof EnquirySummarySchema>;

export const PendingActionSchema = z.object({
  id: z.string(),
  kind: z.enum(['REVIEW_SHORTLIST', 'RESOLVE_SUBJECTS', 'REVIEW_RECAP', 'ADD_DETAILS']),
  label: z.string(),
  enquiryId: z.string().nullable(),
  fixtureId: z.string().nullable(),
  dueAt: z.string().nullable(),
});
export type PendingAction = z.infer<typeof PendingActionSchema>;

export const WeatherVerdictSchema = z.object({
  verdict: z.string(),
  fetchedAt: z.string(),
  source: z.string(),
}).nullable();

export const SubjectSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: SUBJECT_STATUS,
  dueAt: z.string().nullable(),
  owner: z.string().nullable(),
});

export const FixtureSummarySchema = z.object({
  id: z.string(),
  vesselName: z.string(),
  vesselType: VESSEL_TYPE,
  status: FIXTURE_STATUS,
  regionName: z.string(),
  agreedDayRate: z.number(),
  currency: z.enum(['GBP', 'USD', 'NOK']),
  commencement: z.string().nullable(),
  durationDays: z.number().nullable(),
  subjects: z.array(SubjectSchema),
  weather: WeatherVerdictSchema,
});
export type FixtureSummary = z.infer<typeof FixtureSummarySchema>;

export const DashboardSchema = z.object({
  activeEnquiries: z.array(EnquirySummarySchema),
  pendingActions: z.array(PendingActionSchema),
  timeline: z.array(FixtureSummarySchema),
  counts: z.object({
    enquiries: z.number(),
    fixtures: z.number(),
    openSubjects: z.number(),
  }),
});
export type Dashboard = z.infer<typeof DashboardSchema>;

export const ShortlistEntrySchema = z.object({
  vesselId: z.string(),
  vesselName: z.string(),
  vesselType: VESSEL_TYPE,
  dpClass: z.enum(['NONE', 'DP1', 'DP2', 'DP3']),
  deckAreaM2: z.number().nullable(),
  bollardPullT: z.number().nullable(),
  status: z.enum(['OPEN', 'ON_HIRE', 'YARD', 'LAID_UP']),
  imageUrl: z.string().nullable(),
  score: z.number(),
  rank: z.number(),
  factors: z.object({
    distance: z.number(),
    rateFit: z.number(),
    capabilityMargin: z.number(),
  }),
});
export type ShortlistEntry = z.infer<typeof ShortlistEntrySchema>;

export const EnquiryDetailSchema = z.object({
  enquiry: EnquirySummarySchema,
  shortlist: z.array(ShortlistEntrySchema),
});
export type EnquiryDetail = z.infer<typeof EnquiryDetailSchema>;

export const DocumentSchema = z.object({
  id: z.string(),
  fixtureId: z.string(),
  vesselName: z.string(),
  version: z.number(),
  isFinal: z.boolean(),
  createdAt: z.string(),
  generatedMarkdown: z.string(),
  generatedText: z.string(),
});
export type PortalDocument = z.infer<typeof DocumentSchema>;

// ─── Fleet Explorer (whole fleet, read-only) ─────────────────
const DP_CLASS = z.enum(['NONE', 'DP1', 'DP2', 'DP3']);
const VESSEL_STATUS = z.enum(['OPEN', 'ON_HIRE', 'YARD', 'LAID_UP']);
const POSITION_SOURCE = z.enum(['SEEDED', 'MANUAL', 'AIS', 'IMPORTED']);
const CONFIDENCE = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const FleetVesselSchema = z.object({
  id: z.string(),
  name: z.string(),
  vesselType: VESSEL_TYPE,
  status: VESSEL_STATUS,
  dpClass: DP_CLASS,
  deckAreaM2: z.number().nullable(),
  bollardPullT: z.number().nullable(),
  builtYear: z.number().nullable(),
  ownerName: z.string(),
  regionName: z.string().nullable(),
  regionCode: REGION_CODE.nullable(),
  openPort: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  portName: z.string().nullable(),
  positionSource: POSITION_SOURCE,
  positionConfidence: CONFIDENCE,
  imageUrl: z.string().nullable(),
  images: z.array(z.string()),
  imageSource: z.string(),
  imageCredit: z.string().nullable(),
  rate: z.object({ min: z.number(), median: z.number(), max: z.number() }).nullable(),
});
export type FleetVessel = z.infer<typeof FleetVesselSchema>;
