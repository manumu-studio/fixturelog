// generate-recap.tool.test.ts — unit tests for the proposed-only generateRecap write tool: its
// broker-scoped executor (happy path + wrong-status rejection) and the tool definition
// (no execute — surfaced to the confirm gate).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fixture: { findFirst: vi.fn() },
    recap: { create: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { buildGenerateRecapTool, executeGenerateRecap } from './generate-recap.tool';

const ctx = { brokerId: 'broker-1' };

function fixedFixture() {
  return {
    status: 'FIXED',
    agreedDayRate: 7500,
    currency: 'GBP',
    mobilizationFee: null,
    demobilizationFee: null,
    durationDays: 30,
    deliveryPort: null,
    redeliveryPort: null,
    commencement: null,
    charterPartyForm: 'SUPPLYTIME_2017',
    vessel: { name: 'Island Challenger', vesselType: 'PSV', owner: { name: 'Island Offshore' } },
    charterer: { name: 'Equinor' },
    region: { name: 'North Sea' },
    workscope: { name: 'Platform supply' },
    broker: { name: 'Desk' },
    recaps: [{ version: 1 }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('executeGenerateRecap', () => {
  it('generates and persists the next recap version (happy path)', async () => {
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue(fixedFixture() as never);
    vi.mocked(prisma.recap.create).mockResolvedValue({ id: 'recap-2', version: 2 } as never);

    const outcome = await executeGenerateRecap(ctx, 'fixture-1');

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error('expected ok');
    expect(outcome.data).toMatchObject({ fixtureId: 'fixture-1', recapId: 'recap-2', version: 2 });
    expect(outcome.data.markdown).toContain('Island Challenger');
    // Versioning bumps from the latest existing recap.
    expect(vi.mocked(prisma.recap.create).mock.calls[0]?.[0]).toMatchObject({
      data: { fixtureId: 'fixture-1', version: 2 },
    });
    // Broker scoping is enforced in the where clause.
    expect(vi.mocked(prisma.fixture.findFirst).mock.calls[0]?.[0]).toMatchObject({
      where: { id: 'fixture-1', brokerId: 'broker-1' },
    });
  });

  it('rejects when the fixture is not FIXED or COMPLETED', async () => {
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue({
      ...fixedFixture(),
      status: 'NEGOTIATING',
    } as never);

    const outcome = await executeGenerateRecap(ctx, 'fixture-1');

    expect(outcome).toEqual({
      ok: false,
      error: 'Recap can only be generated for FIXED or COMPLETED fixtures.',
    });
    expect(prisma.recap.create).not.toHaveBeenCalled();
  });

  it('rejects when the fixture is not on the broker desk', async () => {
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue(null as never);

    const outcome = await executeGenerateRecap(ctx, 'fixture-x');

    expect(outcome).toEqual({ ok: false, error: 'Fixture not found on your desk.' });
  });
});

describe('buildGenerateRecapTool', () => {
  it('is proposed-only — the tool has no execute, so the agent surfaces it for confirmation', () => {
    const tool = buildGenerateRecapTool();
    expect(tool.execute).toBeUndefined();
    expect(tool.inputSchema).toBeDefined();
  });
});
