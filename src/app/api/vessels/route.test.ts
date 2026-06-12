// Unit tests for GET /api/vessels
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    vessel: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const VESSEL_STUB = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxx01',
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
  owner: { name: 'Offshore Fleet Ltd' },
  _count: { positions: 3 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/vessels', () => {
  it('returns paginated list with no filters', async () => {
    vi.mocked(prisma.vessel.findMany).mockResolvedValue([VESSEL_STUB]);
    vi.mocked(prisma.vessel.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/vessels');
    const res = await GET(req);
    const json = await res.json() as { data: unknown[]; total: number; page: number; limit: number };

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(20);
  });

  it('filters by vesselType=PSV', async () => {
    vi.mocked(prisma.vessel.findMany).mockResolvedValue([VESSEL_STUB]);
    vi.mocked(prisma.vessel.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/vessels?vesselType=PSV');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.vessel.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { vesselType: 'PSV' },
      }),
    );
  });

  it('returns 400 for invalid status value', async () => {
    const req = new NextRequest('http://localhost/api/vessels?status=INVALID');
    const res = await GET(req);
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid query parameters');
    expect(json.details).toBeDefined();
  });

  it('returns 400 when limit=0 (positive int required)', async () => {
    const req = new NextRequest('http://localhost/api/vessels?limit=0');
    const res = await GET(req);
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid query parameters');
    expect(json.details).toBeDefined();
  });
});
