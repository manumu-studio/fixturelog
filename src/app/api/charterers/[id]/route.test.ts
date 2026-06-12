// Unit tests for GET /api/charterers/:id
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    charterer: {
      findUnique: vi.fn(),
    },
  },
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const VALID_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';
const VALID_CHARTERER = {
  id: VALID_ID,
  name: 'Equinor',
  sector: null,
  contactName: null,
  contactEmail: null,
  contactPhone: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/charterers/:id', () => {
  it('returns charterer detail for a valid ID', async () => {
    vi.mocked(prisma.charterer.findUnique).mockResolvedValue(VALID_CHARTERER);

    const req = new NextRequest(`http://localhost/api/charterers/${VALID_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: VALID_ID }) });
    const json = await res.json() as { data: { id: string } };

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(VALID_ID);
  });

  it('returns 404 when charterer is not found', async () => {
    vi.mocked(prisma.charterer.findUnique).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/charterers/${VALID_ID}`);
    const res = await GET(req, { params: Promise.resolve({ id: VALID_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Charterer not found');
  });

  it('returns 400 for an invalid ID format', async () => {
    const req = new NextRequest('http://localhost/api/charterers/not-a-cuid');
    const res = await GET(req, { params: Promise.resolve({ id: 'not-a-cuid' }) });
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid charterer ID');
    expect(json.details).toBeDefined();
  });
});
