// route.test.ts — charterer portal enquiry API tests. Ownership is always derived
// from the session guard; client payloads cannot choose another charterer.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { EnquirySummary } from '@/lib/validators/portal.validators';

vi.mock('@/lib/auth/require-charterer', () => ({ requireChartererApi: vi.fn() }));
vi.mock('@/lib/services/portal/portal-queries', () => ({
  createEnquiry: vi.fn(),
  listEnquiries: vi.fn(),
}));

import { GET, POST } from './route';
import { requireChartererApi } from '@/lib/auth/require-charterer';
import { createEnquiry, listEnquiries } from '@/lib/services/portal/portal-queries';

const CHARTERER_CTX = {
  chartererId: 'charterer-session-1',
  appUserId: 'app-user-1',
  email: 'client@example.com',
  name: 'Client User',
};

const ENQUIRY = {
  id: 'req-1',
  status: 'ENQUIRY',
  vesselTypeNeeded: 'PSV',
  regionName: 'North Sea',
  regionCode: 'NORTH_SEA',
  workscopeName: 'Platform Supply',
  charterType: 'SPOT',
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: null,
  durationDays: 14,
  dayRateBudget: 82000,
  notes: null,
  createdAt: '2026-06-14T00:00:00.000Z',
} satisfies EnquirySummary;

const VALID_PAYLOAD = {
  vesselTypeNeeded: 'PSV',
  regionCode: 'NORTH_SEA',
  workscopeCode: 'SUPPLY',
  charterType: 'SPOT',
  startDate: '2026-07-01',
  durationDays: 14,
  dayRateBudget: 82000,
};

function jsonRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/portal/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/portal/enquiries', () => {
  it('lists only the session charterer enquiries', async () => {
    vi.mocked(requireChartererApi).mockResolvedValue({ ok: true, ctx: CHARTERER_CTX });
    vi.mocked(listEnquiries).mockResolvedValue([ENQUIRY]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(listEnquiries).toHaveBeenCalledWith('charterer-session-1');
    const body = await res.json();
    expect(body).toEqual({ data: [ENQUIRY] });
  });

  it('returns the guard response for anonymous callers', async () => {
    vi.mocked(requireChartererApi).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(listEnquiries).not.toHaveBeenCalled();
  });
});

describe('POST /api/portal/enquiries', () => {
  it('creates an ENQUIRY owned by the session charterer, ignoring client chartererId', async () => {
    vi.mocked(requireChartererApi).mockResolvedValue({ ok: true, ctx: CHARTERER_CTX });
    vi.mocked(createEnquiry).mockResolvedValue({ ok: true, enquiry: ENQUIRY });

    const res = await POST(jsonRequest({ ...VALID_PAYLOAD, chartererId: 'attacker-id' }));

    expect(res.status).toBe(201);
    const call = vi.mocked(createEnquiry).mock.calls[0];
    if (call === undefined) throw new Error('createEnquiry was not called');
    const [chartererId, input] = call;
    expect(chartererId).toBe('charterer-session-1');
    expect(Object.keys(input)).not.toContain('chartererId');
    const body = await res.json();
    expect(body).toEqual({ data: ENQUIRY });
  });

  it('returns validation errors without creating an enquiry', async () => {
    vi.mocked(requireChartererApi).mockResolvedValue({ ok: true, ctx: CHARTERER_CTX });

    const res = await POST(jsonRequest({ ...VALID_PAYLOAD, vesselTypeNeeded: 'NOT_A_TYPE' }));

    expect(res.status).toBe(400);
    expect(createEnquiry).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('returns the guard response for brokers or anonymous callers', async () => {
    vi.mocked(requireChartererApi).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    });

    const res = await POST(jsonRequest(VALID_PAYLOAD));

    expect(res.status).toBe(403);
    expect(createEnquiry).not.toHaveBeenCalled();
  });
});
