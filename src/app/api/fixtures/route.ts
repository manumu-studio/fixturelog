// GET /api/fixtures (paginated list) + POST /api/fixtures (create in DRAFT)
import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/require-session';
import { resolveActor } from '@/lib/auth/provision-actor';
import { prisma } from '@/lib/prisma';
import {
  FixtureCreateSchema,
  FixtureListQuerySchema,
} from '@/lib/validators/fixture.validators';

export async function GET(request: NextRequest) {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const parsed = FixtureListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { status, page, limit } = parsed.data;
  const where = status !== undefined ? { status } : {};
  const skip = (page - 1) * limit;

  const [fixtures, total] = await Promise.all([
    prisma.fixture.findMany({
      where,
      include: {
        vessel: { select: { name: true, vesselType: true } },
        charterer: { select: { name: true } },
        _count: { select: { subjects: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.fixture.count({ where }),
  ]);

  return NextResponse.json({ data: fixtures, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  // Acting broker comes from the session, never the body — prevents impersonation.
  const actor = await resolveActor(session.user);
  if (!actor.ok) return actor.response;

  const body: unknown = await request.json();
  const parsed = FixtureCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const [vessel, charterer, region, workscope] = await Promise.all([
    prisma.vessel.findUnique({ where: { id: data.vesselId } }),
    prisma.charterer.findUnique({ where: { id: data.chartererId } }),
    prisma.region.findUnique({ where: { id: data.regionId } }),
    prisma.workscope.findUnique({ where: { id: data.workscopeId } }),
  ]);

  if (!vessel) return NextResponse.json({ error: 'Vessel not found' }, { status: 404 });
  if (!charterer) return NextResponse.json({ error: 'Charterer not found' }, { status: 404 });
  if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });
  if (!workscope) return NextResponse.json({ error: 'Workscope not found' }, { status: 404 });

  if (data.requirementId !== undefined) {
    const requirement = await prisma.requirement.findUnique({ where: { id: data.requirementId } });
    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }
  }

  const fixture = await prisma.$transaction(async (tx) => {
    const created = await tx.fixture.create({
      data: {
        vesselId: data.vesselId,
        chartererId: data.chartererId,
        brokerId: actor.brokerId,
        regionId: data.regionId,
        workscopeId: data.workscopeId,
        requirementId: data.requirementId ?? null,
        status: 'DRAFT',
        charterType: data.charterType,
        agreedDayRate: data.agreedDayRate,
        currency: data.currency,
        charterPartyForm: data.charterPartyForm,
        mobilizationFee: data.mobilizationFee ?? null,
        demobilizationFee: data.demobilizationFee ?? null,
        durationDays: data.durationDays ?? null,
        deliveryPort: data.deliveryPort ?? null,
        redeliveryPort: data.redeliveryPort ?? null,
        commencement: data.commencement ?? null,
      },
    });
    await tx.fixtureStatusChange.create({
      data: {
        fixtureId: created.id,
        fromStatus: 'DRAFT',
        toStatus: 'DRAFT',
        actor: actor.brokerId,
        notes: 'Fixture created',
      },
    });
    return created;
  });

  return NextResponse.json({ data: fixture }, { status: 201 });
}
