// GET /api/broker/dashboard — broker-wide dashboard aggregate (same DashboardData shape as
// the charterer dashboard). Guarded for broker sessions; brokerId derives from the session.
import { NextResponse } from 'next/server';
import { requireBrokerApi } from '@/lib/auth/require-broker';
import { getBrokerDashboard } from '@/lib/services/portal/broker-queries';
import { DashboardSchema } from '@/lib/validators/portal.validators';

export async function GET() {
  const guard = await requireBrokerApi();
  if (!guard.ok) return guard.response;

  const dashboard = await getBrokerDashboard();
  return NextResponse.json({ data: DashboardSchema.parse(dashboard) });
}
