// GET /api/fixtures (paginated list) + POST /api/fixtures (create in DRAFT)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  FixtureCreateSchema,
  FixtureListQuerySchema,
} from '@/lib/validators/fixture.validators';

export async function GET(request: NextRequest) {
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
  const body: unknown = await request.json();
  const parsed = FixtureCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const {
    vesselId,
    chartererId,
    brokerId,
    regionId,
    workscopeId,
    requirementId,
    mobilizationFee,
    demobilizationFee,
    durationDays,
    deliveryPort,
    redeliveryPort,
    commencement,
    charterType,
    agreedDayRate,
    currency,
    charterPartyForm,
  } = parsed.data;

  const [vessel, charterer, broker, region, workscope] = await Promise.all([
    prisma.vessel.findUnique({ where: { id: vesselId } }),
    prisma.charterer.findUnique({ where: { id: chartererId } }),
    prisma.broker.findUnique({ where: { id: brokerId } }),
    prisma.region.findUnique({ where: { id: regionId } }),
    prisma.workscope.findUnique({ where: { id: workscopeId } }),
  ]);

  if (!vessel) return NextResponse.json({ error: 'Vessel not found' }, { status: 404 });
  if (!charterer) return NextResponse.json({ error: 'Charterer not found' }, { status: 404 });
  if (!broker) return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
  if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });
  if (!workscope) return NextResponse.json({ error: 'Workscope not found' }, { status: 404 });

  if (requirementId !== undefined) {
    const requirement = await prisma.requirement.findUnique({ where: { id: requirementId } });
    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }
  }

  const fixture = await prisma.$transaction(async (tx) => {
    const created = await tx.fixture.create({
      data: {
        vesselId,
        chartererId,
        brokerId,
        regionId,
        workscopeId,
        requirementId: requirementId ?? null,
        status: 'DRAFT',
        charterType,
        agreedDayRate,
        currency,
        charterPartyForm,
        mobilizationFee: mobilizationFee ?? null,
        demobilizationFee: demobilizationFee ?? null,
        durationDays: durationDays ?? null,
        deliveryPort: deliveryPort ?? null,
        redeliveryPort: redeliveryPort ?? null,
        commencement: commencement ?? null,
      },
    });
    await tx.fixtureStatusChange.create({
      data: {
        fixtureId: created.id,
        fromStatus: 'DRAFT',
        toStatus: 'DRAFT',
        actor: brokerId,
        notes: 'Fixture created',
      },
    });
    return created;
  });

  return NextResponse.json({ data: fixture }, { status: 201 });
}
