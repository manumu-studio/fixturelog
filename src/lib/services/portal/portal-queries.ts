// portal-queries.ts — charterer-scoped data access for the portal API.
// Every function takes a session-derived `chartererId` and filters on it; nothing here
// trusts a client-supplied id. Handlers stay thin by delegating to these.
import 'server-only';
import type { Prisma, RequirementStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  toEnquirySummary, toFixtureSummary, toDocument,
} from './portal-mappers';
import { computeShortlist } from './portal-shortlist';
import type {
  Dashboard, EnquiryDetail, EnquirySummary, FixtureSummary, PendingAction, PortalDocument,
  PortalEnquiryCreateInput,
} from '@/lib/validators/portal.validators';

// Shared selects, reused by the broker-wide dashboard (broker-queries.ts).
export const ENQUIRY_INCLUDE = {
  region: { select: { name: true, code: true } },
  workscope: { select: { name: true } },
} satisfies Prisma.RequirementInclude;

export const FIXTURE_INCLUDE = {
  vessel: { select: { name: true, vesselType: true } },
  region: { select: { name: true } },
  subjects: { orderBy: { createdAt: 'asc' } },
  weatherSnapshots: { orderBy: { fetchedAt: 'desc' }, take: 1 },
} satisfies Prisma.FixtureInclude;

const ACTIVE_STATUSES: RequirementStatus[] = ['ENQUIRY', 'SHORTLISTED', 'NEGOTIATING', 'ON_SUBS'];

export async function listEnquiries(chartererId: string): Promise<EnquirySummary[]> {
  const rows = await prisma.requirement.findMany({
    where: { chartererId },
    include: ENQUIRY_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toEnquirySummary);
}

export async function listFixtures(chartererId: string): Promise<FixtureSummary[]> {
  const rows = await prisma.fixture.findMany({
    where: { chartererId },
    include: FIXTURE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toFixtureSummary);
}

export async function listDocuments(chartererId: string): Promise<PortalDocument[]> {
  const rows = await prisma.recap.findMany({
    where: { fixture: { chartererId } },
    include: { fixture: { include: { vessel: { select: { name: true } } } } },
    orderBy: [{ createdAt: 'desc' }, { version: 'desc' }],
  });
  return rows.map(toDocument);
}

export async function getEnquiryDetail(
  chartererId: string,
  id: string,
): Promise<EnquiryDetail | null> {
  // Scoped find: a requirement the charterer does not own resolves to null (-> 404).
  const req = await prisma.requirement.findFirst({
    where: { id, chartererId },
    include: {
      region: { select: { name: true, code: true, centerLat: true, centerLng: true } },
      workscope: { select: { name: true } },
    },
  });
  if (req === null) {
    return null;
  }
  const shortlist = await computeShortlist(req);
  return { enquiry: toEnquirySummary(req), shortlist };
}

export type CreateEnquiryResult =
  | { ok: true; enquiry: EnquirySummary }
  | { ok: false; reason: 'region' | 'workscope' };

export async function createEnquiry(
  chartererId: string,
  input: PortalEnquiryCreateInput,
): Promise<CreateEnquiryResult> {
  const [region, workscope] = await Promise.all([
    prisma.region.findUnique({ where: { code: input.regionCode }, select: { id: true } }),
    prisma.workscope.findUnique({ where: { code: input.workscopeCode }, select: { id: true } }),
  ]);
  if (region === null) return { ok: false, reason: 'region' };
  if (workscope === null) return { ok: false, reason: 'workscope' };

  const created = await prisma.requirement.create({
    data: {
      chartererId, // owner is the session's charterer, never a body field
      regionId: region.id,
      workscopeId: workscope.id,
      vesselTypeNeeded: input.vesselTypeNeeded,
      startDate: input.startDate,
      charterType: input.charterType,
      status: 'ENQUIRY',
      sourceChannel: 'Portal',
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.durationDays !== undefined && { durationDays: input.durationDays }),
      ...(input.dayRateBudget !== undefined && { dayRateBudget: input.dayRateBudget }),
      ...(input.minDeckAreaM2 !== undefined && { minDeckAreaM2: input.minDeckAreaM2 }),
      ...(input.minBollardPullT !== undefined && { minBollardPullT: input.minBollardPullT }),
      ...(input.minDpClass !== undefined && { minDpClass: input.minDpClass }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    include: ENQUIRY_INCLUDE,
  });
  return { ok: true, enquiry: toEnquirySummary(created) };
}

// Derive the "needs your decision" list from already-fetched summaries (no extra I/O).
function derivePendingActions(
  enquiries: EnquirySummary[],
  fixtures: FixtureSummary[],
): PendingAction[] {
  const actions: PendingAction[] = [];
  for (const e of enquiries) {
    if (e.status === 'ENQUIRY' || e.status === 'SHORTLISTED') {
      actions.push({
        id: `enq-${e.id}`,
        kind: 'REVIEW_SHORTLIST',
        label: `Review recommended vessels for your ${e.vesselTypeNeeded} enquiry in ${e.regionName}`,
        enquiryId: e.id,
        fixtureId: null,
        dueAt: null,
      });
    }
  }
  for (const f of fixtures) {
    const pending = f.subjects.filter((s) => s.status === 'PENDING');
    if (pending.length > 0) {
      const due = pending
        .map((s) => s.dueAt)
        .filter((d): d is string => d !== null)
        .sort();
      actions.push({
        id: `subj-${f.id}`,
        kind: 'RESOLVE_SUBJECTS',
        label: `Resolve ${pending.length} open subject${pending.length > 1 ? 's' : ''} on ${f.vesselName}`,
        enquiryId: null,
        fixtureId: f.id,
        dueAt: due[0] ?? null,
      });
    }
    if (f.status === 'FIXED') {
      actions.push({
        id: `recap-${f.id}`,
        kind: 'REVIEW_RECAP',
        label: `Review the final recap for ${f.vesselName}`,
        enquiryId: null,
        fixtureId: f.id,
        dueAt: null,
      });
    }
  }
  return actions;
}

export async function getDashboard(chartererId: string): Promise<Dashboard> {
  const [allEnquiries, fixtures, enquiryCount] = await Promise.all([
    listEnquiries(chartererId),
    listFixtures(chartererId),
    prisma.requirement.count({ where: { chartererId } }),
  ]);
  const activeEnquiries = allEnquiries.filter((e) => ACTIVE_STATUSES.includes(e.status));
  const openSubjects = fixtures.reduce(
    (n, f) => n + f.subjects.filter((s) => s.status === 'PENDING').length,
    0,
  );
  return {
    activeEnquiries,
    pendingActions: derivePendingActions(activeEnquiries, fixtures),
    timeline: fixtures,
    counts: { enquiries: enquiryCount, fixtures: fixtures.length, openSubjects },
  };
}
