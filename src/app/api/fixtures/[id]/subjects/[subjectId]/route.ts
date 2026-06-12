// PATCH /api/fixtures/:id/subjects/:subjectId — update/lift a subject (status -> LIFTED/WAIVED)
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { SubjectUpdateSchema } from '@/lib/validators/fixture.validators';

const SubjectParamsSchema = z.object({
  id: z.string().cuid(),
  subjectId: z.string().cuid(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subjectId: string }> },
) {
  const resolved = await params;
  const paramsParsed = SubjectParamsSchema.safeParse(resolved);
  if (!paramsParsed.success) {
    return NextResponse.json(
      { error: 'Invalid path parameters', details: paramsParsed.error.issues },
      { status: 400 },
    );
  }
  const { id, subjectId } = paramsParsed.data;

  const body: unknown = await request.json();
  const bodyParsed = SubjectUpdateSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: bodyParsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await prisma.subjectItem.findUnique({
    where: { id: subjectId },
  });
  if (!existing || existing.fixtureId !== id) {
    return NextResponse.json(
      { error: 'Subject not found for this fixture' },
      { status: 404 },
    );
  }

  const { label, status, dueAt, owner } = bodyParsed.data;
  const subject = await prisma.subjectItem.update({
    where: { id: subjectId },
    data: {
      ...(label !== undefined && { label }),
      ...(status !== undefined && { status }),
      ...(dueAt !== undefined && { dueAt }),
      ...(owner !== undefined && { owner }),
    },
  });

  return NextResponse.json({ data: subject });
}
