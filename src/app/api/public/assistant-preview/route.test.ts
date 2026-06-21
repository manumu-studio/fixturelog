// route.test.ts - public assistant preview route stays deterministic and public-safe.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POST } from './route';

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/public/assistant-preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/public/assistant-preview', () => {
  it('returns a deterministic answer for an approved prompt id', async () => {
    const res = await POST(postRequest({ promptId: 'what-building' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.mode).toBe('preview');
    expect(body.answer).toContain('FixtureLog');
  });

  it('returns 400 for unknown prompt ids', async () => {
    const res = await POST(postRequest({ promptId: 'live-fixtures' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.mode).toBe('preview');
    expect(body.error).toContain('approved public preview prompts');
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/public/assistant-preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not json',
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when promptId is missing or not a string', async () => {
    const missing = await POST(postRequest({ notPromptId: 'what-building' }));
    expect(missing.status).toBe(400);

    const wrongType = await POST(postRequest({ promptId: 42 }));
    expect(wrongType.status).toBe(400);
  });

  it('does not import broker-only copilot, auth, voice, or dashboard modules', () => {
    const source = readFileSync('src/app/api/public/assistant-preview/route.ts', 'utf8');
    const lower = source.toLowerCase();

    expect(source).not.toContain('@/lib/auth/require-broker');
    expect(source).not.toContain('@/lib/services/copilot/tools');
    expect(source).not.toContain('src/app/api/broker/copilot');
    expect(source).not.toContain('/api/broker/copilot');
    expect(source).not.toContain('/api/broker/voice/token');
    expect(source).not.toContain('VoiceAgent');
    expect(lower).not.toContain('livekit');
    expect(lower).not.toContain('dashboard');
  });
});
