// Unit tests for GET /api/vessels/:id
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    vessel: {
      findUnique: vi.fn(),
    },
  },
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const VALID_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';
const VESSEL_DETAIL = {
  id: VALID_ID,
  name: 'Nordic Hawk',
  imo: null,
  mmsi: null,
  vesselType: 'PSV' as const,
  ownerId: 'clxxxxxxxxxxxxxxxxxxxxxx02',
  deckAreaM2: null,
  bollardPullT: null,
  dpClass: 'DP2' as const,
  builtYear: 2015,
  status: 'OPEN' as const,
  openRegionId: null,
  openPort: null,
  openDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: { id: 'clxxxxxxxxxxxxxxxxxxxxxx02', name: 'Offshore Fleet Ltd', country: null, notes: null, createdAt: new Date(), updatedAt: new Date() },
  openRegion: null,
  positions: [
    {
      id: 'clxxxxxxxxxxxxxxxxxxxxxx03',
      vesselId: VALID_ID,
      capturedAt: new Date(),
      lat: 57.5,
      lng: 2.1,
      portName: 'Aberdeen',
      availabilityFrom: null,
      source: 'SEEDED' as const,
      confidence: 'HIGH' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/vessels/:id', () => {
  it('returns vessel detail with owner and positions', async () => {
    vi.mocked(prisma.vessel.findUnique).mockResolvedValue(VESSEL_DETAIL);

    const req = new NextRequest(`http://localhost/api/vessels/${VALID_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: VALID_ID }) });
    const json = await res.json() as { data: { id: string; positions: unknown[] } };

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(VALID_ID);
    expect(json.data.positions).toHaveLength(1);
  });

  it('returns 404 when vessel does not exist', async () => {
    vi.mocked(prisma.vessel.findUnique).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/vessels/${VALID_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: VALID_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Vessel not found');
  });

  it('returns 400 for invalid ID format', async () => {
    const req = new NextRequest('http://localhost/api/vessels/not-a-cuid');
    const res = await GET(req, { params: Promise.resolve({ id: 'not-a-cuid' }) });
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid vessel ID');
    expect(json.details).toBeDefined();
  });
});
