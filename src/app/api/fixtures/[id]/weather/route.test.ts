// Unit tests for POST /api/fixtures/:id/weather
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fixture: { findUnique: vi.fn() },
    weatherSnapshot: { create: vi.fn() },
  },
}));

vi.mock('@/lib/services/weather-enricher', () => ({
  fetchMarineWeather: vi.fn(),
}));

import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { fetchMarineWeather } from '@/lib/services/weather-enricher';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_ID = 'clm0a1b2c3d4e5f6g7h8i9j0k';

const MOCK_FIXTURE = {
  id: VALID_ID,
  requirementId: null,
  vesselId: 'clxxxxxxxxxxxxxxxxxxxxxx01',
  chartererId: 'clxxxxxxxxxxxxxxxxxxxxxx02',
  brokerId: 'clxxxxxxxxxxxxxxxxxxxxxx03',
  regionId: 'clxxxxxxxxxxxxxxxxxxxxxx04',
  workscopeId: 'clxxxxxxxxxxxxxxxxxxxxxx05',
  charterType: 'SPOT',
  status: 'FIXED',
  agreedDayRate: 18000,
  currency: 'USD',
  mobilizationFee: null,
  demobilizationFee: null,
  durationDays: 180,
  deliveryPort: null,
  redeliveryPort: null,
  commencement: new Date('2026-07-01'),
  charterPartyForm: 'SUPPLYTIME_2017',
  subjectsSummary: null,
  fixedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_ENRICHMENT = {
  lat: 57.12,
  lng: -2.05,
  waveHeightM: 1.5,
  swellHeightM: 2.0,
  windWaveHeightM: 0.8,
  workabilityVerdict: 'WORKABLE' as const,
  fetchedAt: new Date('2026-06-12T10:00:00Z'),
  fromCache: false,
};

const MOCK_SNAPSHOT = {
  id: 'clsnap000000000000000001',
  fixtureId: VALID_ID,
  lat: 57.12,
  lng: -2.05,
  waveHeightM: 1.5,
  swellHeightM: 2.0,
  windWaveHeightM: 0.8,
  workabilityVerdict: 'WORKABLE',
  laycanFrom: null,
  laycanTo: null,
  fetchedAt: new Date('2026-06-12T10:00:00Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown, id = VALID_ID): NextRequest {
  const isString = typeof body === 'string';
  return new NextRequest(
    new Request(`http://localhost/api/fixtures/${id}/weather`, {
      method: 'POST',
      body: isString ? body : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/fixtures/:id/weather', () => {
  it('valid request → 201, snapshot persisted with fixtureId set', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(MOCK_FIXTURE as never);
    vi.mocked(fetchMarineWeather).mockResolvedValue(MOCK_ENRICHMENT);
    vi.mocked(prisma.weatherSnapshot.create).mockResolvedValue(MOCK_SNAPSHOT as never);

    const res = await POST(
      makeRequest({ lat: 57.12, lng: -2.05 }),
      { params: Promise.resolve({ id: VALID_ID }) },
    );
    const json = await res.json() as { data: Record<string, unknown> };

    expect(res.status).toBe(201);
    expect(vi.mocked(prisma.weatherSnapshot.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fixtureId: VALID_ID }) }),
    );
    expect(json.data['fixtureId']).toBe(VALID_ID);
  });

  it('non-existent fixture → 404, weatherSnapshot.create not called', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(null);

    const res = await POST(
      makeRequest({ lat: 57.12, lng: -2.05 }),
      { params: Promise.resolve({ id: VALID_ID }) },
    );

    expect(res.status).toBe(404);
    expect(vi.mocked(prisma.weatherSnapshot.create)).not.toHaveBeenCalled();
  });

  it('invalid body (missing lat/lng) → 400, findUnique not called', async () => {
    const res = await POST(
      makeRequest({}),
      { params: Promise.resolve({ id: VALID_ID }) },
    );

    expect(res.status).toBe(400);
    expect(vi.mocked(prisma.fixture.findUnique)).not.toHaveBeenCalled();
  });

  it('enricher failure → 502, weatherSnapshot.create not called', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(MOCK_FIXTURE as never);
    vi.mocked(fetchMarineWeather).mockRejectedValue(new Error('upstream down'));

    const res = await POST(
      makeRequest({ lat: 57.12, lng: -2.05 }),
      { params: Promise.resolve({ id: VALID_ID }) },
    );
    const json = await res.json() as { error: string };

    expect(res.status).toBe(502);
    expect(json.error).toBe('Weather service unavailable');
    expect(vi.mocked(prisma.weatherSnapshot.create)).not.toHaveBeenCalled();
  });

  it('malformed JSON body → 400, findUnique and fetchMarineWeather not called', async () => {
    const res = await POST(
      makeRequest('not json'),
      { params: Promise.resolve({ id: VALID_ID }) },
    );
    const json = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid JSON body');
    expect(vi.mocked(prisma.fixture.findUnique)).not.toHaveBeenCalled();
    expect(vi.mocked(fetchMarineWeather)).not.toHaveBeenCalled();
  });
});
