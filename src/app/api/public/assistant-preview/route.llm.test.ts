// route.llm.test.ts — the free-text question path: validation, flag gating, rate guard, graceful
// fallback. The model is mocked (the LLM's own behavior is covered in junior-assistant-llm.test.ts).
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockEnv, answerMock } = vi.hoisted(() => ({
  mockEnv: { JUNIOR_LLM_DEMO: false },
  answerMock: vi.fn(),
}));
vi.mock('@/lib/env.server', () => ({ serverEnv: mockEnv }));
vi.mock('@/lib/public-assistant/junior-assistant-llm', () => ({
  answerJuniorQuestion: (...args: unknown[]) => answerMock(...args),
}));

import { POST } from './route';
import { __resetJuniorRateStore } from '@/lib/public-assistant/junior-rate-guard';

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/public/assistant-preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  __resetJuniorRateStore();
  mockEnv.JUNIOR_LLM_DEMO = false;
});

describe('POST /api/public/assistant-preview — free-text question path', () => {
  it('rejects an oversize question with 400', async () => {
    expect((await POST(post({ question: 'x'.repeat(301) }))).status).toBe(400);
  });

  it('rejects an empty question with 400', async () => {
    expect((await POST(post({ question: '   ' }))).status).toBe(400);
  });

  it('returns a deterministic fallback when the demo flag is off (no LLM call)', async () => {
    const res = await POST(post({ question: 'what are you building?' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.answer).toContain('FixtureLog');
    expect(answerMock).not.toHaveBeenCalled();
  });

  it('answers via the LLM when the flag is on, returns remaining, and sets a visitor cookie', async () => {
    mockEnv.JUNIOR_LLM_DEMO = true;
    answerMock.mockResolvedValue({ ok: true, answer: 'A grounded preview answer.' });
    const res = await POST(post({ question: 'what are you building?' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.answer).toBe('A grounded preview answer.');
    expect(body.remaining).toBe(2);
    expect(res.headers.get('set-cookie')).toContain('ja_demo_id=');
  });

  it('blocks the 4th question from the same visitor with 429', async () => {
    mockEnv.JUNIOR_LLM_DEMO = true;
    answerMock.mockResolvedValue({ ok: true, answer: 'ok' });
    const cookie = 'ja_demo_id=visitor-1';
    for (let i = 0; i < 3; i += 1) {
      expect((await POST(post({ question: `q${i}` }, { cookie }))).status).toBe(200);
    }
    const blocked = await POST(post({ question: 'q4' }, { cookie }));
    const body = await blocked.json();
    expect(blocked.status).toBe(429);
    expect(body.error).toBe('preview_limit_reached');
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it('falls back to the deterministic message on LLM failure (never 500)', async () => {
    mockEnv.JUNIOR_LLM_DEMO = true;
    answerMock.mockResolvedValue({ ok: false, answer: '' });
    const res = await POST(post({ question: 'hi' }, { cookie: 'ja_demo_id=v9' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.answer).toContain('FixtureLog');
  });
});
