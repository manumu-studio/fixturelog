// GET /api/fixtures/:id — full fixture detail with all relations
import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/require-session';
import { prisma } from '@/lib/prisma';
import { CuidParamSchema } from '@/lib/validators/common.validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const resolved = await params;
  const parsed = CuidParamSchema.safeParse(resolved);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid fixture ID', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const fixture = await prisma.fixture.findUnique({
    where: { id: parsed.data.id },
    include: {
      vessel: { include: { owner: true } },
      charterer: true,
      broker: true,
      region: true,
      workscope: true,
      subjects: true,
      recaps: { orderBy: { version: 'desc' } },
      statusChanges: { orderBy: { createdAt: 'asc' } },
      requirement: true,
      weatherSnapshots: { orderBy: { fetchedAt: 'desc' } },
    },
  });

  if (!fixture) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  }

  return NextResponse.json({ data: fixture });
}
