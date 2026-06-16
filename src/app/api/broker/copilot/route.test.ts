// route.test.ts — gating tests for POST /api/broker/copilot. The copilot is broker-only: an
// anonymous caller gets 401 and a charterer gets 403, both via requireBrokerApi — neither ever
// reaches the model. A malformed body is rejected at the Zod boundary with 400. These reject
// paths return before any model call, so the Anthropic client + dashboard load are stubbed only
// to keep module init free of network/secret dependencies.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth/require-broker', () => ({ requireBrokerApi: vi.fn() }));
vi.mock('@/lib/services/portal/broker-queries', () => ({ getBrokerDashboard: vi.fn() }));
// Stub the model provider so importing the route never needs a real key or network.
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: () => () => ({ modelId: 'mock' }),
}));

import { POST } from './route';
import { requireBrokerApi } from '@/lib/auth/require-broker';

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/broker/copilot', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/broker/copilot — broker-only gating', () => {
  it('returns 401 for anonymous callers (never reaches the model)', async () => {
    vi.mocked(requireBrokerApi).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    });

    const res = await POST(postRequest(VALID_BODY));

    expect(res.status).toBe(401);
  });

  it('returns 403 for a charterer (never reaches the model)', async () => {
    vi.mocked(requireBrokerApi).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'forbidden: charterer account' }, { status: 403 }),
    });

    const res = await POST(postRequest(VALID_BODY));

    expect(res.status).toBe(403);
  });

  it('rejects a malformed body at the Zod boundary with 400, after passing the broker gate', async () => {
    vi.mocked(requireBrokerApi).mockResolvedValue({
      ok: true,
      ctx: { brokerId: 'br-1', appUserId: 'au-1', email: null, name: null },
    });

    const res = await POST(postRequest({ messages: [] }));

    expect(res.status).toBe(400);
  });

  it('rejects invalid JSON with 400', async () => {
    vi.mocked(requireBrokerApi).mockResolvedValue({
      ok: true,
      ctx: { brokerId: 'br-1', appUserId: 'au-1', email: null, name: null },
    });
    const badRequest = new Request('http://localhost/api/broker/copilot', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });

    const res = await POST(badRequest);

    expect(res.status).toBe(400);
  });
});
