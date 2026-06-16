// advance-fixture-status.tool.test.ts — unit tests for the proposed-only advanceFixtureStatus
// write tool: its broker-scoped executor (happy path + illegal-transition rejection) and the
// tool definition (no execute — surfaced to the confirm gate).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const txStub = {
  fixture: { update: vi.fn() },
  fixtureStatusChange: { create: vi.fn() },
  requirement: { update: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fixture: { findFirst: vi.fn() },
    $transaction: vi.fn((cb: (tx: typeof txStub) => Promise<unknown>) => cb(txStub)),
  },
}));

import { prisma } from '@/lib/prisma';
import {
  buildAdvanceFixtureStatusTool,
  executeAdvanceFixtureStatus,
} from './advance-fixture-status.tool';

const ctx = { brokerId: 'broker-1' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('executeAdvanceFixtureStatus', () => {
  it('persists a legal transition and writes the audit row (happy path)', async () => {
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue({
      status: 'NEGOTIATING',
      requirementId: null,
      subjects: [],
    } as never);

    const outcome = await executeAdvanceFixtureStatus(ctx, 'fixture-1', 'ON_SUBS');

    expect(outcome).toEqual({
      ok: true,
      data: { fixtureId: 'fixture-1', fromStatus: 'NEGOTIATING', toStatus: 'ON_SUBS' },
    });
    expect(txStub.fixture.update).toHaveBeenCalledWith({
      where: { id: 'fixture-1' },
      data: { status: 'ON_SUBS' },
    });
    // The audit actor is the session brokerId, never a tool argument.
    expect(txStub.fixtureStatusChange.create).toHaveBeenCalledWith({
      data: { fixtureId: 'fixture-1', fromStatus: 'NEGOTIATING', toStatus: 'ON_SUBS', actor: 'broker-1' },
    });
  });

  it('rejects an illegal transition via the status policy (no DB write)', async () => {
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue({
      status: 'DRAFT',
      requirementId: null,
      subjects: [],
    } as never);

    const outcome = await executeAdvanceFixtureStatus(ctx, 'fixture-1', 'FIXED');

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error('expected rejection');
    expect(outcome.error).toContain('not allowed');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects when the fixture is not on the broker desk', async () => {
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue(null as never);

    const outcome = await executeAdvanceFixtureStatus(ctx, 'fixture-x', 'ON_SUBS');

    expect(outcome).toEqual({ ok: false, error: 'Fixture not found on your desk.' });
  });
});

describe('buildAdvanceFixtureStatusTool', () => {
  it('is proposed-only — the tool has no execute, so the agent surfaces it for confirmation', () => {
    const tool = buildAdvanceFixtureStatusTool();
    expect(tool.execute).toBeUndefined();
    expect(tool.inputSchema).toBeDefined();
  });
});
