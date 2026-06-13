// Unit tests for GET /api/vessels/positions
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { vessel: { findMany: vi.fn() } },
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { VesselPositionsResponseSchema } from '@/lib/validators/vessel-position.validators';

const VESSEL_WITH_POSITION = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxx01',
  name: 'Nordic Hawk',
  vesselType: 'PSV' as const,
  status: 'OPEN' as const,
  owner: { name: 'Offshore Fleet Ltd' },
  positions: [{ lat: 57.1, lng: 1.8, portName: 'Aberdeen', source: 'SEEDED' as const, confidence: 'HIGH' as const }],
};

beforeEach(() => { vi.clearAllMocks(); });

describe('GET /api/vessels/positions', () => {
  it('flattens the latest position for a vessel that has one', async () => {
    vi.mocked(prisma.vessel.findMany).mockResolvedValue([VESSEL_WITH_POSITION] as never);
    const res = await GET();
    const json = await res.json() as { data: Array<Record<string, unknown>> };
    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0]).toMatchObject({ ownerName: 'Offshore Fleet Ltd', lat: 57.1, lng: 1.8, source: 'SEEDED' });
  });

  it('skips vessels whose positions array is empty', async () => {
    vi.mocked(prisma.vessel.findMany).mockResolvedValue([{ ...VESSEL_WITH_POSITION, positions: [] }] as never);
    const res = await GET();
    const json = await res.json() as { data: unknown[] };
    expect(json.data).toHaveLength(0);
  });

  it('returns a body that validates against VesselPositionsResponseSchema', async () => {
    vi.mocked(prisma.vessel.findMany).mockResolvedValue([VESSEL_WITH_POSITION] as never);
    const res = await GET();
    const json = await res.json();
    expect(() => VesselPositionsResponseSchema.parse(json)).not.toThrow();
  });
});
