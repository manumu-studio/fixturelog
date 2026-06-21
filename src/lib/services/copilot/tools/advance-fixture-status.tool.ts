// advance-fixture-status.tool.ts — write tool: transition a fixture's status. PROPOSED ONLY in
// the agent loop — the tool() definition deliberately omits `execute`, so the agent surfaces the
// call for the human confirm gate instead of auto-running it. The real, broker-scoped
// mutation lives in `executeAdvanceFixtureStatus`, which still routes through the
// fixture-status-policy (evaluateTransition) and its subject-lift gate, mirroring the
// PATCH /api/fixtures/:id/status route's transaction. brokerId is session-derived (never an arg).
import 'server-only';
import { tool, type Tool } from 'ai';
import type { FixtureStatus, RequirementStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { evaluateTransition } from '@/lib/services/fixture-status-policy';
import { screenFixtureForFixedGate } from '@/lib/services/sanctions-screening/fixture-screening-gate';
import {
  AdvanceFixtureStatusInputSchema,
  AdvanceFixtureStatusResultSchema,
  type AdvanceFixtureStatusResult,
  type BrokerToolContext,
  type ToolOutcome,
} from './copilot-tools.types';

// Inputs for one persisted transition. Grouped into one object to keep the param count low and
// to make the side effects explicit at the call site.
interface PersistTransitionArgs {
  fixtureId: string;
  fromStatus: FixtureStatus;
  toStatus: FixtureStatus;
  actor: string;
  fixedAt: Date | null;
  requirementId: string | null;
  requirementStatus: RequirementStatus | null;
}

// Persists a legal transition + audit row in one transaction, propagating the requirement status
// from the policy and stamping fixedAt — identical side effects to the PATCH route.
async function persistTransition(args: PersistTransitionArgs): Promise<void> {
  const { fixtureId, fromStatus, toStatus, actor, fixedAt, requirementId, requirementStatus } = args;
  await prisma.$transaction(async (tx) => {
    await tx.fixture.update({
      where: { id: fixtureId },
      data: { status: toStatus, ...(fixedAt !== null ? { fixedAt } : {}) },
    });
    await tx.fixtureStatusChange.create({
      data: { fixtureId, fromStatus, toStatus, actor },
    });
    if (requirementStatus !== null && requirementId !== null) {
      await tx.requirement.update({
        where: { id: requirementId },
        data: { status: requirementStatus },
      });
    }
  });
}

export async function executeAdvanceFixtureStatus(
  ctx: BrokerToolContext,
  fixtureId: string,
  toStatus: FixtureStatus,
): Promise<ToolOutcome<AdvanceFixtureStatusResult>> {
  const fixture = await prisma.fixture.findFirst({
    where: { id: fixtureId, brokerId: ctx.brokerId },
    select: { status: true, requirementId: true, subjects: { select: { status: true } } },
  });

  if (fixture === null) {
    return { ok: false, error: 'Fixture not found on your desk.' };
  }

  const outcome = evaluateTransition(fixture.status, toStatus, {
    subjectStatuses: fixture.subjects.map((s) => s.status),
  });
  if (!outcome.allowed) {
    return { ok: false, error: outcome.reason };
  }

  if (fixture.status === 'ON_SUBS' && toStatus === 'FIXED') {
    const screeningGate = await screenFixtureForFixedGate(fixtureId);
    if (!screeningGate.allowed) {
      return { ok: false, error: screeningGate.reason };
    }
  }

  await persistTransition({
    fixtureId,
    fromStatus: fixture.status,
    toStatus,
    actor: ctx.brokerId,
    fixedAt: outcome.fixtureFixedAt,
    requirementId: fixture.requirementId,
    requirementStatus: outcome.requirementUpdate?.status ?? null,
  });

  const data = AdvanceFixtureStatusResultSchema.parse({
    fixtureId,
    fromStatus: fixture.status,
    toStatus,
  });
  return { ok: true, data };
}

// Proposed-only tool: no `execute`, so the agent emits the call for the confirm gate.
export function buildAdvanceFixtureStatusTool(): Tool {
  return tool({
    description:
      'Propose advancing a fixture to a new status (e.g. ON_SUBS, FIXED). Requires confirmation; subject-lift gate applies for FIXED.',
    inputSchema: AdvanceFixtureStatusInputSchema,
  });
}
