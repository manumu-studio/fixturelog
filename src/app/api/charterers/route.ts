// GET /api/charterers (list with search + pagination) and POST /api/charterers (create)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ChartererCreateSchema,
  ChartererListQuerySchema,
} from '@/lib/validators/charterer.validators';

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = ChartererListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { search, page, limit } = parsed.data;
  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};
  const [charterers, total] = await Promise.all([
    prisma.charterer.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { requirements: true, fixtures: true } } },
    }),
    prisma.charterer.count({ where }),
  ]);
  return NextResponse.json({ data: charterers, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = ChartererCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const existing = await prisma.charterer.findFirst({
    where: { name: { equals: parsed.data.name, mode: 'insensitive' as const } },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Charterer with this name already exists' },
      { status: 409 },
    );
  }
  const { name, sector, contactName, contactEmail, contactPhone, notes } = parsed.data;
  const charterer = await prisma.charterer.create({
    data: {
      name,
      ...(sector !== undefined && { sector }),
      ...(contactName !== undefined && { contactName }),
      ...(contactEmail !== undefined && { contactEmail }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(notes !== undefined && { notes }),
    },
  });
  return NextResponse.json({ data: charterer }, { status: 201 });
}
