// Unit tests for GET /api/fixtures/:id
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: { fixture: { findUnique: vi.fn() } },
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';

const FIXTURE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';

const FULL_FIXTURE_STUB = {
  id: FIXTURE_ID,
  vesselId: 'clxxxxxxxxxxxxxxxxxxxxxx02',
  chartererId: 'clxxxxxxxxxxxxxxxxxxxxxx03',
  brokerId: 'clxxxxxxxxxxxxxxxxxxxxxx04',
  regionId: 'clxxxxxxxxxxxxxxxxxxxxxx05',
  workscopeId: 'clxxxxxxxxxxxxxxxxxxxxxx06',
  requirementId: null,
  charterType: 'SPOT' as const,
  status: 'FIXED' as const,
  agreedDayRate: 12000,
  currency: 'GBP' as const,
  mobilizationFee: null,
  demobilizationFee: null,
  durationDays: 30,
  deliveryPort: 'Aberdeen',
  redeliveryPort: 'Aberdeen',
  commencement: new Date('2026-07-01'),
  charterPartyForm: 'SUPPLYTIME_2017' as const,
  subjectsSummary: null,
  fixedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  vessel: { id: 'v1', name: 'North Star', vesselType: 'PSV', owner: { id: 'o1', name: 'Owners Ltd' } },
  charterer: { id: FIXTURE_ID, name: 'Charterer Co' },
  broker: { id: 'b1', name: 'John Doe' },
  region: { id: 'r1', name: 'North Sea' },
  workscope: { id: 'ws1', name: 'Drilling Support' },
  subjects: [],
  recaps: [{ id: 'rc1', version: 1, generatedMarkdown: '# Recap', generatedText: 'Recap', mainTerms: {}, createdAt: new Date() }],
  statusChanges: [{ id: 'sc1', fromStatus: 'DRAFT', toStatus: 'DRAFT', actor: 'b1', notes: 'Created', createdAt: new Date() }],
  requirement: null,
  weatherSnapshots: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/fixtures/:id', () => {
  it('returns full fixture detail with all relations when fixture exists', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(FULL_FIXTURE_STUB as never);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { data: { subjects: unknown[]; recaps: unknown[]; statusChanges: unknown[] } };

    expect(res.status).toBe(200);
    expect(json.data.subjects).toBeDefined();
    expect(json.data.recaps).toBeDefined();
    expect(json.data.statusChanges).toBeDefined();
  });

  it('returns 404 when fixture does not exist', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Fixture not found');
  });

  it('returns 400 for invalid fixture ID format', async () => {
    const req = new NextRequest('http://localhost/api/fixtures/not-a-cuid');
    const res = await GET(req, { params: Promise.resolve({ id: 'not-a-cuid' }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid fixture ID');
  });

  it('returns weatherSnapshots array with correct fields when snapshots exist', async () => {
    const fixtureWithSnapshots = {
      ...FULL_FIXTURE_STUB,
      weatherSnapshots: [
        {
          id: 'ws1',
          fixtureId: FIXTURE_ID,
          lat: 57.12,
          lng: -2.05,
          waveHeightM: 1.2,
          swellHeightM: 1.8,
          windWaveHeightM: 0.6,
          workabilityVerdict: 'WORKABLE' as const,
          laycanFrom: new Date('2026-07-01'),
          laycanTo: new Date('2026-12-28'),
          fetchedAt: new Date('2026-06-10T09:00:00Z'),
          createdAt: new Date(),
        },
      ],
    };
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(fixtureWithSnapshots as never);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { data: { weatherSnapshots: Array<{ workabilityVerdict: string; waveHeightM: number }> } };

    expect(res.status).toBe(200);
    expect(Array.isArray(json.data.weatherSnapshots)).toBe(true);
    expect(json.data.weatherSnapshots.length).toBeGreaterThan(0);
    expect(json.data.weatherSnapshots[0]?.workabilityVerdict).toBe('WORKABLE');
    expect(json.data.weatherSnapshots[0]?.waveHeightM).toBe(1.2);
  });

  it('returns empty weatherSnapshots array (not undefined) when no snapshots exist', async () => {
    const fixtureNoSnapshots = { ...FULL_FIXTURE_STUB, weatherSnapshots: [] };
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(fixtureNoSnapshots as never);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { data: { weatherSnapshots: unknown } };

    expect(res.status).toBe(200);
    expect(json.data.weatherSnapshots).toEqual([]);
    expect(json.data.weatherSnapshots).not.toBeUndefined();
  });
});
