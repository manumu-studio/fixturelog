// GET /api/portal/fixtures — the session charterer's fixtures with status, subjects,
// and the latest weather verdict. Scoped to the session charterer only.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireChartererApi } from '@/lib/auth/require-charterer';
import { listFixtures } from '@/lib/services/portal/portal-queries';
import { FixtureSummarySchema } from '@/lib/validators/portal.validators';

export async function GET() {
  const guard = await requireChartererApi();
  if (!guard.ok) return guard.response;

  const fixtures = await listFixtures(guard.ctx.chartererId);
  return NextResponse.json({ data: z.array(FixtureSummarySchema).parse(fixtures) });
}
