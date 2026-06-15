// GET /api/portal/dashboard — charterer-scoped dashboard aggregate (active enquiries,
// pending actions, fixture/weather timeline). chartererId comes from the session only.
import { NextResponse } from 'next/server';
import { requireChartererApi } from '@/lib/auth/require-charterer';
import { getDashboard } from '@/lib/services/portal/portal-queries';
import { DashboardSchema } from '@/lib/validators/portal.validators';

export async function GET() {
  const guard = await requireChartererApi();
  if (!guard.ok) return guard.response;

  const dashboard = await getDashboard(guard.ctx.chartererId);
  return NextResponse.json({ data: DashboardSchema.parse(dashboard) });
}
