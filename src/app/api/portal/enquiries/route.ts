// GET  /api/portal/enquiries — list the session charterer's own requirements.
// POST /api/portal/enquiries — create one owned by the session charterer (status ENQUIRY).
// A client-supplied chartererId is impossible: the schema has no such field.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireChartererApi } from '@/lib/auth/require-charterer';
import { createEnquiry, listEnquiries } from '@/lib/services/portal/portal-queries';
import {
  EnquirySummarySchema,
  PortalEnquiryCreateSchema,
} from '@/lib/validators/portal.validators';

export async function GET() {
  const guard = await requireChartererApi();
  if (!guard.ok) return guard.response;

  const enquiries = await listEnquiries(guard.ctx.chartererId);
  return NextResponse.json({ data: z.array(EnquirySummarySchema).parse(enquiries) });
}

export async function POST(request: NextRequest) {
  const guard = await requireChartererApi();
  if (!guard.ok) return guard.response;

  const body: unknown = await request.json().catch(() => undefined);
  const parsed = PortalEnquiryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await createEnquiry(guard.ctx.chartererId, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: `Unknown ${result.reason}` }, { status: 400 });
  }
  return NextResponse.json({ data: EnquirySummarySchema.parse(result.enquiry) }, { status: 201 });
}
