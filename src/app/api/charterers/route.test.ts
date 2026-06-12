// Unit tests for GET /api/charterers and POST /api/charterers
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    charterer: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const VALID_CHARTERER = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxx01',
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

describe('GET /api/charterers', () => {
  it('returns paginated list with no filters', async () => {
    vi.mocked(prisma.charterer.findMany).mockResolvedValue([VALID_CHARTERER]);
    vi.mocked(prisma.charterer.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/charterers');
    const res = await GET(req);
    const json = await res.json() as { data: unknown[]; total: number; page: number; limit: number };

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(20);
  });

  it('filters by search param (case-insensitive)', async () => {
    vi.mocked(prisma.charterer.findMany).mockResolvedValue([VALID_CHARTERER]);
    vi.mocked(prisma.charterer.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/charterers?search=Equinor');
    const res = await GET(req);
    const json = await res.json() as { data: unknown[] };

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(vi.mocked(prisma.charterer.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: { contains: 'Equinor', mode: 'insensitive' } },
      }),
    );
  });
});

describe('POST /api/charterers', () => {
  it('creates a charterer and returns 201', async () => {
    vi.mocked(prisma.charterer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.charterer.create).mockResolvedValue({
      ...VALID_CHARTERER,
      name: 'New Co',
      contactName: 'Jane',
      contactEmail: 'jane@example.com',
      contactPhone: '+44 123 456',
    });

    const req = new NextRequest('http://localhost/api/charterers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Co',
        contactName: 'Jane',
        contactEmail: 'jane@example.com',
        contactPhone: '+44 123 456',
      }),
    });
    const res = await POST(req);
    const json = await res.json() as { data: { name: string } };

    expect(res.status).toBe(201);
    expect(json.data.name).toBe('New Co');
  });

  it('returns 400 when name is missing', async () => {
    const req = new NextRequest('http://localhost/api/charterers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sector: 'Oil & Gas' }),
    });
    const res = await POST(req);
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect(json.details).toBeDefined();
  });

  it('returns 409 when charterer name already exists', async () => {
    vi.mocked(prisma.charterer.findFirst).mockResolvedValue(VALID_CHARTERER);

    const req = new NextRequest('http://localhost/api/charterers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Equinor' }),
    });
    const res = await POST(req);
    const json = await res.json() as { error: string };

    expect(res.status).toBe(409);
    expect(json.error).toContain('already exists');
  });
});
