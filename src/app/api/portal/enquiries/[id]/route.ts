// GET /api/portal/enquiries/[id] — the session charterer's enquiry detail + recommended
// shortlist. A requirement the charterer does not own returns 404 (no cross-charterer leak).
import { NextResponse } from 'next/server';
import { requireChartererApi } from '@/lib/auth/require-charterer';
import { getEnquiryDetail } from '@/lib/services/portal/portal-queries';
import { CuidParamSchema } from '@/lib/validators/common.validators';
import { EnquiryDetailSchema } from '@/lib/validators/portal.validators';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireChartererApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = CuidParamSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid enquiry ID' }, { status: 400 });
  }

  const detail = await getEnquiryDetail(guard.ctx.chartererId, parsed.data.id);
  if (detail === null) {
    return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
  }
  return NextResponse.json({ data: EnquiryDetailSchema.parse(detail) });
}
