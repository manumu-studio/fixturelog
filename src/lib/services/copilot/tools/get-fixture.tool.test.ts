// get-fixture.tool.test.ts — unit tests for the broker-scoped getFixture read tool.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { fixture: { findFirst: vi.fn() } },
}));

import { prisma } from '@/lib/prisma';
import { buildGetFixtureTool, getFixtureForBroker } from './get-fixture.tool';

const ctx = { brokerId: 'broker-1' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getFixtureForBroker', () => {
  it('returns the fixture with status, subjects, and open-subject count (happy path)', async () => {
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue({
      id: 'fixture-1',
      status: 'ON_SUBS',
      agreedDayRate: 56798,
      currency: 'GBP',
      vessel: { name: 'Island Challenger' },
      charterer: { name: 'Equinor' },
      region: { name: 'North Sea' },
      subjects: [
        { id: 's1', label: 'Client approval', status: 'PENDING' },
        { id: 's2', label: 'Stem agreed', status: 'LIFTED' },
      ],
    } as never);

    const outcome = await getFixtureForBroker(ctx, 'fixture-1');

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error('expected ok');
    expect(outcome.data.id).toBe('fixture-1');
    expect(outcome.data.vesselName).toBe('Island Challenger');
    expect(outcome.data.openSubjects).toBe(1);
    // Broker scoping is enforced in the where clause, not the args.
    expect(vi.mocked(prisma.fixture.findFirst).mock.calls[0]?.[0]).toMatchObject({
      where: { id: 'fixture-1', brokerId: 'broker-1' },
    });
  });

  it('rejects when the fixture is missing or owned by another broker', async () => {
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue(null as never);

    const outcome = await getFixtureForBroker(ctx, 'fixture-x');

    expect(outcome).toEqual({ ok: false, error: 'Fixture not found on your desk.' });
  });
});

describe('buildGetFixtureTool', () => {
  it('builds an auto-executing read tool (execute present)', () => {
    const tool = buildGetFixtureTool(ctx);
    expect(typeof tool.execute).toBe('function');
    expect(tool.inputSchema).toBeDefined();
  });
});
