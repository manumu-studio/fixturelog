// usePublicAssistantPreview.ts - request state for the deterministic public assistant preview.
'use client';

import { useState } from 'react';
import { z } from 'zod';
import type { UsePublicAssistantPreviewResult } from './PublicAssistantPreview.types';

// Zod boundary: never trust the response shape, even from our own public route.
const PublicAssistantResponseSchema = z.object({
  answer: z.string().min(1),
  mode: z.literal('preview'),
});

const IDLE_ANSWER = 'Choose a preview prompt to see how the assistant will answer.';

const FALLBACK_ANSWER =
  'I can only preview what FixtureLog is building right now. The full broker workspace stays private.';

export function usePublicAssistantPreview(): UsePublicAssistantPreviewResult {
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [answer, setAnswer] = useState(IDLE_ANSWER);
  const [status, setStatus] = useState<UsePublicAssistantPreviewResult['status']>('idle');

  function ask(promptId: string): void {
    setActivePromptId(promptId);
    setStatus('loading');

    void fetch('/api/public/assistant-preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ promptId }),
    })
      .then(async (response) => {
        const jsonBody: unknown = await response.json();
        if (!response.ok) {
          throw new Error('Preview prompt was rejected.');
        }
        return PublicAssistantResponseSchema.parse(jsonBody);
      })
      .then((parsed) => {
        setAnswer(parsed.answer);
        setStatus('answered');
      })
      .catch(() => {
        setAnswer(FALLBACK_ANSWER);
        setStatus('error');
      });
  }

  return { activePromptId, answer, status, ask };
}
