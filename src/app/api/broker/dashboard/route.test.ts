// Scoping tests for GET /api/broker/dashboard: 200 broker, 403 charterer, 401 anonymous.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth/require-broker', () => ({ requireBrokerApi: vi.fn() }));
vi.mock('@/lib/services/portal/broker-queries', () => ({ getBrokerDashboard: vi.fn() }));

import { GET } from './route';
import { requireBrokerApi } from '@/lib/auth/require-broker';
import { getBrokerDashboard } from '@/lib/services/portal/broker-queries';

const EMPTY_DASHBOARD = {
  activeEnquiries: [],
  pendingActions: [],
  timeline: [],
  counts: { enquiries: 0, fixtures: 0, openSubjects: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/broker/dashboard', () => {
  it('returns 200 with dashboard data for a broker', async () => {
    vi.mocked(requireBrokerApi).mockResolvedValue({
      ok: true,
      ctx: { brokerId: 'br-1', appUserId: 'au-1', email: null, name: null },
    });
    vi.mocked(getBrokerDashboard).mockResolvedValue(EMPTY_DASHBOARD);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown };
    expect(body.data).toBeDefined();
  });

  it('returns 403 for a charterer', async () => {
    vi.mocked(requireBrokerApi).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    });

    const res = await GET();

    expect(res.status).toBe(403);
  });

  it('returns 401 for anonymous callers', async () => {
    vi.mocked(requireBrokerApi).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    });

    const res = await GET();

    expect(res.status).toBe(401);
  });
});
