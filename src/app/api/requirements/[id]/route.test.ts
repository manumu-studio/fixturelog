// Unit tests for GET /api/requirements/:id
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    requirement: {
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

import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const VALID_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';
const CHARTERER_ID = 'clxxxxxxxxxxxxxxxxxxxxxx02';
const REGION_ID = 'clxxxxxxxxxxxxxxxxxxxxxx03';
const WORKSCOPE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx04';

const VALID_REQUIREMENT_DETAIL = {
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
  charterer: { id: CHARTERER_ID, name: 'Equinor', sector: null, contactName: null, contactEmail: null, contactPhone: null, notes: null, createdAt: new Date(), updatedAt: new Date() },
  region: { id: REGION_ID, name: 'North Sea', code: 'NS', createdAt: new Date(), updatedAt: new Date() },
  workscope: { id: WORKSCOPE_ID, name: 'Cargo Run', createdAt: new Date(), updatedAt: new Date() },
  fixtures: [
    { id: 'clxxxxxxxxxxxxxxxxxxxxxx05', status: 'ACTIVE', vessel: { name: 'Nordic Eagle' } },
  ],
};

// The test double session is "Test Broker": not a charterer, already broker-linked,
// so the broker guard passes through without provisioning.
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

describe('GET /api/requirements/:id', () => {
  it('returns full requirement detail with relations for a valid ID', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(VALID_REQUIREMENT_DETAIL);

    const req = new NextRequest(`http://localhost/api/requirements/${VALID_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: VALID_ID }) });
    const json = await res.json() as { data: typeof VALID_REQUIREMENT_DETAIL };

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(VALID_ID);
    expect(json.data.charterer).toBeDefined();
    expect(json.data.region).toBeDefined();
    expect(json.data.workscope).toBeDefined();
    expect(json.data.fixtures).toHaveLength(1);
    expect(json.data.fixtures[0]?.vessel.name).toBe('Nordic Eagle');
  });

  it('returns 404 when requirement is not found', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/requirements/${VALID_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: VALID_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Requirement not found');
  });

  it('returns 400 for an invalid ID format', async () => {
    const req = new NextRequest('http://localhost/api/requirements/not-a-cuid');
    const res = await GET(req, { params: Promise.resolve({ id: 'not-a-cuid' }) });
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid requirement ID');
    expect(json.details).toBeDefined();
  });
});
