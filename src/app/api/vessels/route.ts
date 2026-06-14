// GET /api/vessels — vessel list with optional filters (vesselType, regionId, status) + pagination
import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/require-session';
import { prisma } from '@/lib/prisma';
import { VesselListQuerySchema } from '@/lib/validators/vessel.validators';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const raw = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = VesselListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { vesselType, regionId, status, page, limit } = parsed.data;

  const where: Prisma.VesselWhereInput = {};
  if (vesselType !== undefined) where.vesselType = vesselType;
  if (regionId !== undefined) where.openRegionId = regionId;
  if (status !== undefined) where.status = status;

  const [vessels, total] = await Promise.all([
    prisma.vessel.findMany({
      where,
      include: {
        owner: { select: { name: true } },
        _count: { select: { positions: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vessel.count({ where }),
  ]);

  return NextResponse.json({ data: vessels, total, page, limit });
}
