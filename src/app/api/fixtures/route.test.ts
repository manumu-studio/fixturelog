// Unit tests for GET /api/fixtures and POST /api/fixtures
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fixture: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    vessel: { findUnique: vi.fn() },
    charterer: { findUnique: vi.fn() },
    broker: { findUnique: vi.fn() },
    region: { findUnique: vi.fn() },
    workscope: { findUnique: vi.fn() },
    requirement: { findUnique: vi.fn() },
    fixtureStatusChange: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';

const VESSEL_ID = 'clxxxxxxxxxxxxxxxxxxxxxx02';
const CHARTERER_ID = 'clxxxxxxxxxxxxxxxxxxxxxx03';
const BROKER_ID = 'clxxxxxxxxxxxxxxxxxxxxxx04';
const REGION_ID = 'clxxxxxxxxxxxxxxxxxxxxxx05';
const WORKSCOPE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx06';
const FIXTURE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';

const VALID_BODY = {
  vesselId: VESSEL_ID,
  chartererId: CHARTERER_ID,
  brokerId: BROKER_ID,
  regionId: REGION_ID,
  workscopeId: WORKSCOPE_ID,
  charterType: 'SPOT',
  agreedDayRate: 10000,
  currency: 'USD',
} as const;

const FIXTURE_STUB = {
  id: FIXTURE_ID,
  vesselId: VESSEL_ID,
  chartererId: CHARTERER_ID,
  brokerId: BROKER_ID,
  regionId: REGION_ID,
  workscopeId: WORKSCOPE_ID,
  requirementId: null,
  charterType: 'SPOT' as const,
  status: 'DRAFT' as const,
  agreedDayRate: 10000,
  currency: 'USD' as const,
  mobilizationFee: null,
  demobilizationFee: null,
  durationDays: null,
  deliveryPort: null,
  redeliveryPort: null,
  commencement: null,
  charterPartyForm: 'SUPPLYTIME_2017' as const,
  subjectsSummary: null,
  fixedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/fixtures', () => {
  it('creates a fixture with DRAFT status and writes audit record', async () => {
    vi.mocked(prisma.vessel.findUnique).mockResolvedValue({ id: VESSEL_ID } as never);
    vi.mocked(prisma.charterer.findUnique).mockResolvedValue({ id: CHARTERER_ID } as never);
    vi.mocked(prisma.broker.findUnique).mockResolvedValue({ id: BROKER_ID } as never);
    vi.mocked(prisma.region.findUnique).mockResolvedValue({ id: REGION_ID } as never);
    vi.mocked(prisma.workscope.findUnique).mockResolvedValue({ id: WORKSCOPE_ID } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => cb(prisma as never));
    vi.mocked(prisma.fixture.create).mockResolvedValue(FIXTURE_STUB);
    vi.mocked(prisma.fixtureStatusChange.create).mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxxxxxxx99',
      fixtureId: FIXTURE_ID,
      fromStatus: 'DRAFT',
      toStatus: 'DRAFT',
      actor: BROKER_ID,
      notes: 'Fixture created',
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/fixtures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    const json = await res.json() as { data: { status: string } };

    expect(res.status).toBe(201);
    expect(json.data.status).toBe('DRAFT');
    expect(prisma.fixtureStatusChange.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromStatus: 'DRAFT',
        toStatus: 'DRAFT',
        actor: BROKER_ID,
        notes: 'Fixture created',
      }),
    });
  });

  it('returns 400 when required field is missing (no vesselId)', async () => {
    const req = new NextRequest('http://localhost/api/fixtures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_BODY, vesselId: undefined }),
    });
    const res = await POST(req);
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect(json.details).toBeDefined();
  });

  it('returns 404 when vessel FK does not exist', async () => {
    vi.mocked(prisma.vessel.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.charterer.findUnique).mockResolvedValue({ id: CHARTERER_ID } as never);
    vi.mocked(prisma.broker.findUnique).mockResolvedValue({ id: BROKER_ID } as never);
    vi.mocked(prisma.region.findUnique).mockResolvedValue({ id: REGION_ID } as never);
    vi.mocked(prisma.workscope.findUnique).mockResolvedValue({ id: WORKSCOPE_ID } as never);

    const req = new NextRequest('http://localhost/api/fixtures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Vessel not found');
  });

  it('returns 400 when agreedDayRate is negative', async () => {
    const req = new NextRequest('http://localhost/api/fixtures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_BODY, agreedDayRate: -500 }),
    });
    const res = await POST(req);
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Validation failed');
  });
});

describe('GET /api/fixtures', () => {
  it('returns paginated list with no filters', async () => {
    vi.mocked(prisma.fixture.findMany).mockResolvedValue([FIXTURE_STUB] as never);
    vi.mocked(prisma.fixture.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/fixtures');
    const res = await GET(req);
    const json = await res.json() as { data: unknown[]; total: number; page: number; limit: number };

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(20);
  });

  it('filters by status=NEGOTIATING', async () => {
    vi.mocked(prisma.fixture.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.fixture.count).mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/fixtures?status=NEGOTIATING');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(prisma.fixture.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'NEGOTIATING' } }),
    );
  });

  it('returns 400 for invalid status value', async () => {
    const req = new NextRequest('http://localhost/api/fixtures?status=INVALID_VALUE');
    const res = await GET(req);
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid query parameters');
    expect(json.details).toBeDefined();
  });
});
