// Unit tests for GET /api/charterers/:id/requirements
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    charterer: {
      findUnique: vi.fn(),
    },
    requirement: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const VALID_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';

const VALID_REQUIREMENT = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxx02',
  chartererId: VALID_ID,
  regionId: null,
  workscopeId: null,
  laycanStart: null,
  laycanEnd: null,
  durationDays: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  region: null,
  workscope: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/charterers/:id/requirements', () => {
  it('returns requirements for a valid charterer ID', async () => {
    vi.mocked(prisma.charterer.findUnique).mockResolvedValue({
      id: VALID_ID,
      name: 'Equinor',
      sector: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.requirement.findMany).mockResolvedValue([VALID_REQUIREMENT]);

    const req = new NextRequest(`http://localhost/api/charterers/${VALID_ID}/requirements`);
    const res = await GET(req, { params: Promise.resolve({ id: VALID_ID }) });
    const json = await res.json() as { data: unknown[] };

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(vi.mocked(prisma.requirement.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { chartererId: VALID_ID } }),
    );
  });

  it('returns 404 when charterer does not exist', async () => {
    vi.mocked(prisma.charterer.findUnique).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/charterers/${VALID_ID}/requirements`);
    const res = await GET(req, { params: Promise.resolve({ id: VALID_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Charterer not found');
  });

  it('returns 400 for an invalid charterer ID format', async () => {
    const req = new NextRequest('http://localhost/api/charterers/bad-id/requirements');
    const res = await GET(req, { params: Promise.resolve({ id: 'bad-id' }) });
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid charterer ID');
    expect(json.details).toBeDefined();
  });
});
