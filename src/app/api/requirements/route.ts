// POST /api/requirements (create) and GET /api/requirements (paginated list)
import { NextRequest, NextResponse } from 'next/server';
import { requireBrokerApi } from '@/lib/auth/require-broker';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  RequirementCreateSchema,
  RequirementListQuerySchema,
} from '@/lib/validators/requirement.validators';
import { persistChartererScreeningForRequirement } from '@/lib/services/sanctions-screening/fixture-screening-gate';

export async function POST(request: NextRequest) {
  const session = await requireBrokerApi(); // 401 anonymous, 403 charterer
  if (!session.ok) return session.response;

  const body: unknown = await request.json();
  const parsed = RequirementCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const [charterer, region, workscope] = await Promise.all([
    prisma.charterer.findUnique({
      where: { id: parsed.data.chartererId },
      select: { id: true, name: true, sector: true },
    }),
    prisma.region.findUnique({ where: { id: parsed.data.regionId }, select: { id: true } }),
    prisma.workscope.findUnique({ where: { id: parsed.data.workscopeId }, select: { id: true } }),
  ]);

  if (!charterer) return NextResponse.json({ error: 'Charterer not found' }, { status: 404 });
  if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });
  if (!workscope) return NextResponse.json({ error: 'Workscope not found' }, { status: 404 });

  const {
    chartererId, regionId, workscopeId, vesselTypeNeeded, startDate, charterType,
    minDeckAreaM2, minBollardPullT, minDpClass, endDate, durationDays,
    dayRateBudget, sourceChannel, notes,
  } = parsed.data;

  const requirement = await prisma.$transaction(async (tx) => {
    const created = await tx.requirement.create({
      data: {
        chartererId,
        regionId,
        workscopeId,
        vesselTypeNeeded,
        startDate,
        charterType,
        status: 'ENQUIRY',
        ...(minDeckAreaM2 !== undefined && { minDeckAreaM2 }),
        ...(minBollardPullT !== undefined && { minBollardPullT }),
        ...(minDpClass !== undefined && { minDpClass }),
        ...(endDate !== undefined && { endDate }),
        ...(durationDays !== undefined && { durationDays }),
        ...(dayRateBudget !== undefined && { dayRateBudget }),
        ...(sourceChannel !== undefined && { sourceChannel }),
        ...(notes !== undefined && { notes }),
      },
    });
    await persistChartererScreeningForRequirement(tx, {
      requirementId: created.id,
      chartererId: charterer.id,
      name: charterer.name,
      sector: charterer.sector,
    });
    return created;
  });

  return NextResponse.json({ data: requirement }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await requireBrokerApi(); // 401 anonymous, 403 charterer
  if (!session.ok) return session.response;

  const raw = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = RequirementListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { page, limit, status, regionId, vesselTypeNeeded } = parsed.data;

  const where: Prisma.RequirementWhereInput = {};
  if (status !== undefined) where.status = status;
  if (regionId !== undefined) where.regionId = regionId;
  if (vesselTypeNeeded !== undefined) where.vesselTypeNeeded = vesselTypeNeeded;

  const [requirements, total] = await Promise.all([
    prisma.requirement.findMany({
      where,
      include: {
        charterer: {
          select: {
            name: true,
            latestScreeningStatus: true,
            latestScreenedAt: true,
            latestScreeningTtlExpiresAt: true,
            latestScreeningSourceName: true,
          },
        },
        region: { select: { name: true, code: true } },
        workscope: { select: { name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.requirement.count({ where }),
  ]);

  return NextResponse.json({ data: requirements, total, page, limit });
}
