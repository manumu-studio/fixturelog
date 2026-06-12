// POST /api/fixtures/:id/recap — generate and persist SUPPLYTIME 2017 recap
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CuidParamSchema } from '@/lib/validators/common.validators';
import { formatRecap } from '@/lib/services/recap-formatter';
import { buildMainTerms } from './recap.helpers';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolved = await params;
  const parsed = CuidParamSchema.safeParse(resolved);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid fixture ID', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id } = parsed.data;

  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: {
      vessel: { include: { owner: true } },
      charterer: true,
      region: true,
      workscope: true,
      broker: true,
      recaps: { select: { version: true }, orderBy: { version: 'desc' }, take: 1 },
    },
  });

  if (!fixture) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  }

  if (fixture.status !== 'FIXED' && fixture.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: 'Recap can only be generated for FIXED or COMPLETED fixtures' },
      { status: 409 },
    );
  }

  const mainTerms = buildMainTerms(fixture);
  const { markdown, text } = formatRecap(mainTerms);
  const maxVersion = fixture.recaps[0]?.version ?? 0;
  const version = maxVersion + 1;

  const recap = await prisma.recap.create({
    data: {
      fixtureId: id,
      version,
      generatedMarkdown: markdown,
      generatedText: text,
      mainTerms: (mainTerms as unknown) as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ data: recap }, { status: 201 });
}
