// PATCH /api/fixtures/:id/status — status transition through FixtureStatusPolicy
import { NextRequest, NextResponse } from 'next/server';
import { requireBrokerApi } from '@/lib/auth/require-broker';
import { prisma } from '@/lib/prisma';
import { CuidParamSchema } from '@/lib/validators/common.validators';
import { FixtureStatusTransitionSchema } from '@/lib/validators/fixture.validators';
import { evaluateTransition } from '@/lib/services/fixture-status-policy';
import { screenFixtureForFixedGate } from '@/lib/services/sanctions-screening/fixture-screening-gate';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Broker-only mutation: anonymous -> 401, charterer -> 403. The audit actor's brokerId
  // comes from the provisioned session, never the body — prevents spoofing.
  const guard = await requireBrokerApi();
  if (!guard.ok) return guard.response;

  const resolved = await params;
  const idParsed = CuidParamSchema.safeParse(resolved);
  if (!idParsed.success) {
    return NextResponse.json(
      { error: 'Invalid fixture ID', details: idParsed.error.issues },
      { status: 400 },
    );
  }

  const body: unknown = await request.json();
  const bodyParsed = FixtureStatusTransitionSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: bodyParsed.error.issues },
      { status: 400 },
    );
  }

  const { id } = idParsed.data;
  const { toStatus, notes } = bodyParsed.data;

  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: { subjects: { select: { status: true } } },
  });

  if (!fixture) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  }

  const result = evaluateTransition(
    fixture.status,
    toStatus,
    { subjectStatuses: fixture.subjects.map((s) => s.status) },
  );

  if (!result.allowed) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  if (fixture.status === 'ON_SUBS' && toStatus === 'FIXED') {
    const screeningGate = await screenFixtureForFixedGate(id);
    if (!screeningGate.allowed) {
      return NextResponse.json({ error: screeningGate.reason }, { status: 400 });
    }
  }

  const [updatedFixture, statusChange] = await prisma.$transaction(async (tx) => {
    const updated = await tx.fixture.update({
      where: { id },
      data: {
        status: toStatus,
        ...(result.fixtureFixedAt !== null ? { fixedAt: result.fixtureFixedAt } : {}),
      },
    });

    const change = await tx.fixtureStatusChange.create({
      data: {
        fixtureId: id,
        fromStatus: fixture.status,
        toStatus,
        actor: guard.ctx.brokerId,
        notes: notes ?? null,
      },
    });

    if (result.requirementUpdate !== null && fixture.requirementId !== null) {
      await tx.requirement.update({
        where: { id: fixture.requirementId },
        data: { status: result.requirementUpdate.status },
      });
    }

    return [updated, change] as const;
  });

  return NextResponse.json({ data: updatedFixture, transition: statusChange });
}
