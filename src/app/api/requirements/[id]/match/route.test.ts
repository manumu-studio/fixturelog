// Unit tests for POST /api/requirements/:id/match
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    requirement: { findUnique: vi.fn(), update: vi.fn() },
    vessel: { findMany: vi.fn() },
    rateBenchmark: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/services/fixture-matcher', () => ({
  match: vi.fn(),
  DEFAULT_WEIGHTS: { distance: 0.40, rateFit: 0.35, capabilityMargin: 0.25 },
}));

import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { match } from '@/lib/services/fixture-matcher';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REQ_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';
const REGION_ID = 'clxxxxxxxxxxxxxxxxxxxxxx10';

const MOCK_REGION = {
  id: REGION_ID,
  code: 'NORTH_SEA',
  name: 'North Sea',
  centerLat: 56.0,
  centerLng: 3.0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequirement(status: string) {
  return {
    id: REQ_ID,
    chartererId: 'clxxxxxxxxxxxxxxxxxxxxxx02',
    regionId: REGION_ID,
    workscopeId: 'clxxxxxxxxxxxxxxxxxxxxxx03',
    vesselTypeNeeded: 'PSV',
    minDeckAreaM2: null,
    minBollardPullT: null,
    minDpClass: null,
    startDate: new Date('2026-08-01'),
    endDate: null,
    durationDays: null,
    charterType: 'SPOT',
    dayRateBudget: 20000,
    status,
    sourceChannel: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    region: MOCK_REGION,
  };
}

const MOCK_RESULTS = [
  { vesselId: 'clxxxxxxxxxxxxxxxxxxxxxx99', vesselName: 'MV Test', score: 80, factors: { distance: 85, rateFit: 75, capabilityMargin: 80 }, rank: 1 },
];

function makePostRequest(body: unknown = undefined, id = REQ_ID) {
  const url = `http://localhost/api/requirements/${id}/match`;
  return new NextRequest(
    new Request(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.vessel.findMany).mockResolvedValue([]);
  vi.mocked(prisma.rateBenchmark.findMany).mockResolvedValue([]);
  vi.mocked(match).mockReturnValue(MOCK_RESULTS);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/requirements/:id/match', () => {
  it('ENQUIRY requirement → promotes to SHORTLISTED in DB; response status equals SHORTLISTED', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(makeRequirement('ENQUIRY') as never);
    vi.mocked(prisma.requirement.update).mockResolvedValue(makeRequirement('SHORTLISTED') as never);

    const res = await POST(makePostRequest(), { params: Promise.resolve({ id: REQ_ID }) });
    const json = await res.json() as { data: { status: string; requirementId: string } };

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('SHORTLISTED');
    expect(json.data.requirementId).toBe(REQ_ID);
    expect(prisma.requirement.update).toHaveBeenCalledWith({
      where: { id: REQ_ID },
      data: { status: 'SHORTLISTED' },
    });
  });

  it('SHORTLISTED requirement → no DB update; response status stays SHORTLISTED (existing status)', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(makeRequirement('SHORTLISTED') as never);

    const res = await POST(makePostRequest(), { params: Promise.resolve({ id: REQ_ID }) });
    const json = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('SHORTLISTED');
    expect(prisma.requirement.update).not.toHaveBeenCalled();
  });

  it('NEGOTIATING requirement → response status is NEGOTIATING, NOT hard-coded SHORTLISTED', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(makeRequirement('NEGOTIATING') as never);

    const res = await POST(makePostRequest(), { params: Promise.resolve({ id: REQ_ID }) });
    const json = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('NEGOTIATING');
    expect(prisma.requirement.update).not.toHaveBeenCalled();
  });

  it('custom weights → weightsUsed in response reflects the custom values', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(makeRequirement('ENQUIRY') as never);
    vi.mocked(prisma.requirement.update).mockResolvedValue(makeRequirement('SHORTLISTED') as never);

    const customWeights = { distance: 0.50, rateFit: 0.30, capabilityMargin: 0.20 };
    const res = await POST(
      makePostRequest({ weights: customWeights }),
      { params: Promise.resolve({ id: REQ_ID }) },
    );
    const json = await res.json() as { data: { weightsUsed: typeof customWeights } };

    expect(res.status).toBe(200);
    expect(json.data.weightsUsed).toEqual(customWeights);
  });

  it('invalid weights (sum ≠ 1.0) → 400 with Zod issues', async () => {
    const badWeights = { distance: 0.50, rateFit: 0.50, capabilityMargin: 0.50 };
    const res = await POST(
      makePostRequest({ weights: badWeights }),
      { params: Promise.resolve({ id: REQ_ID }) },
    );
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.details).toBeDefined();
    expect(Array.isArray(json.details)).toBe(true);
  });

  it('non-existent requirement ID → 404', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(null);

    const res = await POST(makePostRequest(), { params: Promise.resolve({ id: REQ_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Requirement not found');
  });

  it('invalid (non-cuid) ID param → 400', async () => {
    const res = await POST(
      makePostRequest(undefined, 'not-a-cuid'),
      { params: Promise.resolve({ id: 'not-a-cuid' }) },
    );
    const json = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid requirement ID');
  });

  it('response carries results from matcher output', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(makeRequirement('ENQUIRY') as never);
    vi.mocked(prisma.requirement.update).mockResolvedValue(makeRequirement('SHORTLISTED') as never);

    const res = await POST(makePostRequest(), { params: Promise.resolve({ id: REQ_ID }) });
    const json = await res.json() as { data: { results: typeof MOCK_RESULTS; passedFilters: number; totalCandidates: number } };

    expect(res.status).toBe(200);
    expect(json.data.results).toEqual(MOCK_RESULTS);
    expect(json.data.passedFilters).toBe(1);
    expect(json.data.totalCandidates).toBe(0);
  });

  it('ON_SUBS requirement → response status is ON_SUBS, no DB update', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(makeRequirement('ON_SUBS') as never);

    const res = await POST(makePostRequest(), { params: Promise.resolve({ id: REQ_ID }) });
    const json = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('ON_SUBS');
    expect(prisma.requirement.update).not.toHaveBeenCalled();
  });
});
