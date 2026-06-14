// GET /api/charterers/:id — charterer detail
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
      { error: 'Invalid charterer ID', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const charterer = await prisma.charterer.findUnique({
    where: { id: parsed.data.id },
  });
  if (!charterer) {
    return NextResponse.json({ error: 'Charterer not found' }, { status: 404 });
  }
  return NextResponse.json({ data: charterer });
}
