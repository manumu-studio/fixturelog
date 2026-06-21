// public-assistant-preview.test.ts - deterministic public assistant answer coverage.
import { describe, expect, it } from 'vitest';
import {
  PUBLIC_ASSISTANT_PROMPT_IDS,
  resolvePublicAssistantPreview,
} from './public-assistant-preview';

describe('resolvePublicAssistantPreview', () => {
  it('returns a scoped answer for each approved public prompt', () => {
    for (const promptId of PUBLIC_ASSISTANT_PROMPT_IDS) {
      const result = resolvePublicAssistantPreview(promptId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.status).toBe(200);
        expect(result.body.mode).toBe('preview');
        expect(result.body.answer.length).toBeGreaterThan(40);
        expect(result.body.answer.toLowerCase()).not.toContain('dashboard');
        expect(result.body.answer.toLowerCase()).not.toContain('fixture id');
      }
    }
  });

  it('rejects unknown prompt ids with a scoped safe message', () => {
    const result = resolvePublicAssistantPreview('tell-me-live-fixtures');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.body.mode).toBe('preview');
    if (!result.ok) {
      expect(result.body.error).toContain('public preview');
    }
  });
});
