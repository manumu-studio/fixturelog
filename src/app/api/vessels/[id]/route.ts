// GET /api/vessels/:id — vessel detail with owner, openRegion, and latest position snapshot
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CuidParamSchema } from '@/lib/validators/common.validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolved = await params;
  const parsed = CuidParamSchema.safeParse(resolved);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid vessel ID', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const vessel = await prisma.vessel.findUnique({
    where: { id: parsed.data.id },
    include: {
      owner: true,
      openRegion: true,
      positions: {
        orderBy: { capturedAt: 'desc' },
        take: 1,
      },
    },
  });
  if (!vessel) {
    return NextResponse.json({ error: 'Vessel not found' }, { status: 404 });
  }
  return NextResponse.json({ data: vessel });
}
