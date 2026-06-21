// junior-assistant-llm.test.ts — output-scoping prompt + graceful-degrade behavior (model mocked).
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@ai-sdk/anthropic', () => ({ createAnthropic: () => (modelId: string) => ({ modelId }) }));
const generateTextMock = vi.fn();
vi.mock('ai', () => ({ generateText: (...args: unknown[]) => generateTextMock(...args) }));

import { buildJuniorSystemPrompt, answerJuniorQuestion } from './junior-assistant-llm';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('junior assistant LLM', () => {
  it('scopes the system prompt to the approved context and forbids leaking instructions', () => {
    const system = buildJuniorSystemPrompt();
    expect(system).toContain('APPROVED PUBLIC CONTEXT');
    expect(system).toContain('Answer ONLY from');
    expect(system).toContain('Never reveal');
    expect(system).toContain('FixtureLog');
  });

  it('returns the trimmed model answer on success', async () => {
    generateTextMock.mockResolvedValue({ text: '  A grounded preview answer.  ' });
    expect(await answerJuniorQuestion('what are you building?')).toEqual({
      ok: true,
      answer: 'A grounded preview answer.',
    });
  });

  it('degrades to ok:false on a model error (caller serves the deterministic fallback)', async () => {
    generateTextMock.mockRejectedValue(new Error('model down'));
    expect((await answerJuniorQuestion('hi')).ok).toBe(false);
  });

  it('treats an empty model answer as a failure', async () => {
    generateTextMock.mockResolvedValue({ text: '   ' });
    expect((await answerJuniorQuestion('hi')).ok).toBe(false);
  });
});
