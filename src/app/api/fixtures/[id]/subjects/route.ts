// POST /api/fixtures/:id/subjects — add a subject line item to a fixture (default status PENDING)
import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/require-session';
import { prisma } from '@/lib/prisma';
import { CuidParamSchema } from '@/lib/validators/common.validators';
import { SubjectCreateSchema } from '@/lib/validators/fixture.validators';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const resolved = await params;
  const idParsed = CuidParamSchema.safeParse(resolved);
  if (!idParsed.success) {
    return NextResponse.json(
      { error: 'Invalid fixture ID', details: idParsed.error.issues },
      { status: 400 },
    );
  }
  const { id } = idParsed.data;

  const body: unknown = await request.json();
  const bodyParsed = SubjectCreateSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: bodyParsed.error.issues },
      { status: 400 },
    );
  }

  const fixture = await prisma.fixture.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!fixture) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  }

  const { label, status, dueAt, owner } = bodyParsed.data;
  const subject = await prisma.subjectItem.create({
    data: {
      fixtureId: id,
      label,
      status,
      ...(dueAt !== undefined && { dueAt }),
      ...(owner !== undefined && { owner }),
    },
  });

  return NextResponse.json({ data: subject }, { status: 201 });
}
