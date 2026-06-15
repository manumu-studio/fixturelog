// GET /api/requirements/:id — requirement detail with charterer, region, workscope, fixtures
import { NextRequest, NextResponse } from 'next/server';
import { requireBrokerApi } from '@/lib/auth/require-broker';
import { prisma } from '@/lib/prisma';
import { CuidParamSchema } from '@/lib/validators/common.validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireBrokerApi(); // 401 anonymous, 403 charterer
  if (!session.ok) return session.response;

  const resolved = await params; // Next.js 15: params is a Promise
  const parsed = CuidParamSchema.safeParse(resolved);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid requirement ID', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const requirement = await prisma.requirement.findUnique({
    where: { id: parsed.data.id },
    include: {
      charterer: true,
      region: true,
      workscope: true,
      fixtures: {
        select: {
          id: true,
          status: true,
          vessel: { select: { name: true } },
        },
      },
    },
  });

  if (!requirement) {
    return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
  }

  return NextResponse.json({ data: requirement });
}
