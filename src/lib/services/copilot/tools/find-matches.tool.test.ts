// find-matches.tool.test.ts — unit tests for the findMatches read tool (reuses FixtureMatcher).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    requirement: { findUnique: vi.fn() },
    vessel: { findMany: vi.fn() },
    rateBenchmark: { findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { buildFindMatchesTool, findMatchesForBroker } from './find-matches.tool';

const ctx = { brokerId: 'broker-1' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findMatchesForBroker', () => {
  it('runs the matcher and returns the ranked shortlist (happy path)', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue({
      regionId: 'region-1',
      vesselTypeNeeded: 'PSV',
      minDeckAreaM2: null,
      minBollardPullT: null,
      minDpClass: null,
      startDate: new Date('2026-07-01T00:00:00.000Z'),
      dayRateBudget: 80000,
      region: { centerLat: 60, centerLng: 2 },
    } as never);
    vi.mocked(prisma.vessel.findMany).mockResolvedValue([
      {
        id: 'v1',
        name: 'Island Challenger',
        vesselType: 'PSV',
        status: 'OPEN',
        dpClass: 'DP2',
        deckAreaM2: 900,
        bollardPullT: null,
        openDate: null,
        openRegionId: 'region-1',
        positions: [{ lat: 60.1, lng: 2.1 }],
      },
      {
        id: 'v2',
        name: 'Far Senator',
        vesselType: 'AHTS',
        status: 'OPEN',
        dpClass: 'DP2',
        deckAreaM2: 800,
        bollardPullT: 200,
        openDate: null,
        openRegionId: 'region-1',
        positions: [],
      },
    ] as never);
    vi.mocked(prisma.rateBenchmark.findMany).mockResolvedValue([] as never);

    const outcome = await findMatchesForBroker(ctx, 'req-1');

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error('expected ok');
    expect(outcome.data.requirementId).toBe('req-1');
    expect(outcome.data.totalCandidates).toBe(2);
    // Only the PSV passes the hard filter (vessel type must match).
    expect(outcome.data.passedFilters).toBe(1);
    expect(outcome.data.shortlist[0]).toMatchObject({ vesselId: 'v1', rank: 1 });
  });

  it('rejects when the requirement is not found', async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(null as never);

    const outcome = await findMatchesForBroker(ctx, 'req-x');

    expect(outcome).toEqual({ ok: false, error: 'Requirement not found.' });
  });
});

describe('buildFindMatchesTool', () => {
  it('builds an auto-executing read tool (execute present)', () => {
    const tool = buildFindMatchesTool(ctx);
    expect(typeof tool.execute).toBe('function');
  });
});
