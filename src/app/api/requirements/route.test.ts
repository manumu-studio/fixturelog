// Unit tests for POST /api/requirements and GET /api/requirements
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    requirement: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    charterer: {
      findUnique: vi.fn(),
    },
    region: {
      findUnique: vi.fn(),
    },
    workscope: {
      findUnique: vi.fn(),
    },
    // Used by the broker guard (requireBrokerApi): isCharterer reads appUser,
    // resolveActor upserts it. The test double session is already a broker.
    appUser: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    broker: {
      findFirst: vi.fn(),
    },
  },
}));

import { POST, GET } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const VALID_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';
const CHARTERER_ID = 'clxxxxxxxxxxxxxxxxxxxxxx02';
const REGION_ID = 'clxxxxxxxxxxxxxxxxxxxxxx03';
const WORKSCOPE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx04';

const VALID_BODY = {
  chartererId: CHARTERER_ID,
  regionId: REGION_ID,
  workscopeId: WORKSCOPE_ID,
  vesselTypeNeeded: 'PSV',
  startDate: '2026-07-01T00:00:00.000Z',
  charterType: 'SPOT',
};

const VALID_REQUIREMENT = {
  id: VALID_ID,
  chartererId: CHARTERER_ID,
  regionId: REGION_ID,
  workscopeId: WORKSCOPE_ID,
  vesselTypeNeeded: 'PSV',
  minDeckAreaM2: null,
  minBollardPullT: null,
  minDpClass: null,
  startDate: new Date('2026-07-01'),
  endDate: null,
  durationDays: null,
  charterType: 'SPOT',
  dayRateBudget: null,
  status: 'ENQUIRY',
  sourceChannel: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// The test double session is "Test Broker". Make the broker guard resolve it:
// not a charterer (isCharterer → null), already broker-linked (resolveActor short-
// circuits at its "already linked" branch, no provisioning).
const BROKER_APP_USER = {
  id: 'au-test',
  externalId: 'test-external-id',
  email: 'test@fixturelog.local',
  name: 'Test Broker',
  brokerId: 'br-test',
  chartererId: null,
  role: 'BROKER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // `as never` matches the existing prisma-mock convention in these route tests.
  vi.mocked(prisma.appUser.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.appUser.upsert).mockResolvedValue(BROKER_APP_USER as never);
  vi.mocked(prisma.broker.findFirst).mockResolvedValue(null);
});

describe('POST /api/requirements', () => {
  it('creates a requirement and returns 201 with status ENQUIRY', async () => {
    vi.mocked(prisma.charterer.findUnique).mockResolvedValue({ id: CHARTERER_ID });
    vi.mocked(prisma.region.findUnique).mockResolvedValue({ id: REGION_ID });
    vi.mocked(prisma.workscope.findUnique).mockResolvedValue({ id: WORKSCOPE_ID });
    vi.mocked(prisma.requirement.create).mockResolvedValue(VALID_REQUIREMENT);

    const req = new NextRequest('http://localhost/api/requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    const json = await res.json() as { data: { status: string } };

    expect(res.status).toBe(201);
    expect(json.data.status).toBe('ENQUIRY');
  });

  it('returns 400 when required field vesselTypeNeeded is missing', async () => {
    const req = new NextRequest('http://localhost/api/requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chartererId: CHARTERER_ID, regionId: REGION_ID, workscopeId: WORKSCOPE_ID, charterType: 'SPOT', startDate: '2026-07-01' }),
    });
    const res = await POST(req);
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect(json.details).toBeDefined();
  });

  it('returns 404 when chartererId does not exist', async () => {
    vi.mocked(prisma.charterer.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.region.findUnique).mockResolvedValue({ id: REGION_ID });
    vi.mocked(prisma.workscope.findUnique).mockResolvedValue({ id: WORKSCOPE_ID });

    const req = new NextRequest('http://localhost/api/requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Charterer not found');
  });

  it('returns 400 when dayRateBudget is negative', async () => {
    const req = new NextRequest('http://localhost/api/requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_BODY, dayRateBudget: -500 }),
    });
    const res = await POST(req);
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect(json.details).toBeDefined();
  });
});

describe('GET /api/requirements', () => {
  it('returns paginated list with no filters', async () => {
    vi.mocked(prisma.requirement.findMany).mockResolvedValue([VALID_REQUIREMENT]);
    vi.mocked(prisma.requirement.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/requirements');
    const res = await GET(req);
    const json = await res.json() as { data: unknown[]; total: number; page: number; limit: number };

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(20);
  });

  it('returns filtered list when status filter is applied', async () => {
    vi.mocked(prisma.requirement.findMany).mockResolvedValue([VALID_REQUIREMENT]);
    vi.mocked(prisma.requirement.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/requirements?status=ENQUIRY');
    const res = await GET(req);
    const json = await res.json() as { data: unknown[] };

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.requirement.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'ENQUIRY' }) }),
    );
    expect(json.data).toHaveLength(1);
  });

  it('returns 400 when status filter value is invalid', async () => {
    const req = new NextRequest('http://localhost/api/requirements?status=INVALID_STATUS');
    const res = await GET(req);
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid query parameters');
    expect(json.details).toBeDefined();
  });
});
