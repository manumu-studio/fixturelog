// route.test.ts - gating + identity tests for POST /api/broker/voice/token. The route is
// broker-only: anonymous -> 401, charterer -> 403, both before any token is minted (via the mocked
// requireBrokerApi). For an authenticated broker it mints a real LiveKit token and we decode it with
// the SDK's TokenVerifier to prove the broker id in `attributes.broker_id` comes from the SESSION,
// not the body - even when the body sends a different broker_id. A missing-credentials request
// returns a clean 503. Dummy LiveKit env keeps the test offline and key-free.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { TokenVerifier } from 'livekit-server-sdk';
import { z } from 'zod';

vi.mock('@/lib/auth/require-broker', () => ({ requireBrokerApi: vi.fn() }));

import { POST } from './route';
import { requireBrokerApi } from '@/lib/auth/require-broker';

const ENV = {
  LIVEKIT_URL: 'wss://test.livekit.cloud',
  LIVEKIT_API_KEY: 'test',
  LIVEKIT_API_SECRET: 'test-secret',
};

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/broker/voice/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function asBroker(brokerId: string): void {
  vi.mocked(requireBrokerApi).mockResolvedValue({
    ok: true,
    ctx: { brokerId, appUserId: 'au-1', email: null, name: null },
  });
}

// Validate the success body at the test boundary, in keeping with Zod-at-boundaries.
const TokenResponseSchema = z.object({ serverUrl: z.string(), token: z.string() });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.LIVEKIT_URL = ENV.LIVEKIT_URL;
  process.env.LIVEKIT_API_KEY = ENV.LIVEKIT_API_KEY;
  process.env.LIVEKIT_API_SECRET = ENV.LIVEKIT_API_SECRET;
});

describe('POST /api/broker/voice/token - broker-only gating', () => {
  it('returns 401 for anonymous callers (never mints a token)', async () => {
    vi.mocked(requireBrokerApi).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    });

    const res = await POST(postRequest({}));

    expect(res.status).toBe(401);
  });

  it('returns 403 for a charterer (never mints a token)', async () => {
    vi.mocked(requireBrokerApi).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'forbidden: charterer account' }, { status: 403 }),
    });

    const res = await POST(postRequest({}));

    expect(res.status).toBe(403);
  });
});

describe('POST /api/broker/voice/token - token identity', () => {
  it('mints a token whose attributes.broker_id is the SESSION broker id, ignoring the body', async () => {
    asBroker('br-session');

    // The body tries to spoof a different broker id; the route must ignore it.
    const res = await POST(postRequest({ broker_id: 'br-attacker', roomName: 'r' }));
    expect(res.status).toBe(200);

    const data = TokenResponseSchema.parse(await res.json());
    expect(data.serverUrl).toBe(ENV.LIVEKIT_URL);

    const verifier = new TokenVerifier(ENV.LIVEKIT_API_KEY, ENV.LIVEKIT_API_SECRET);
    const claims = await verifier.verify(data.token);
    expect(claims.sub).toBe('br-session');
    expect(claims.attributes).toEqual({ broker_id: 'br-session' });
  });
});

describe('POST /api/broker/voice/token - configuration', () => {
  it('returns 503 when LiveKit credentials are absent', async () => {
    asBroker('br-1');
    delete process.env.LIVEKIT_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;

    const res = await POST(postRequest({}));

    expect(res.status).toBe(503);
  });
});
