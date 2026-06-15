// GET /api/portal/documents — the session charterer's recaps/documents (draft + final).
// Recaps are reached only through fixtures owned by the session charterer.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireChartererApi } from '@/lib/auth/require-charterer';
import { listDocuments } from '@/lib/services/portal/portal-queries';
import { DocumentSchema } from '@/lib/validators/portal.validators';

export async function GET() {
  const guard = await requireChartererApi();
  if (!guard.ok) return guard.response;

  const documents = await listDocuments(guard.ctx.chartererId);
  return NextResponse.json({ data: z.array(DocumentSchema).parse(documents) });
}
