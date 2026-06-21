// usePublicAssistantPreview.ts - request state for the public assistant preview.
// Two paths share one fetch: curated prompts ({promptId}, always deterministic) and free-text
// questions ({question}, LLM-backed when the demo flag is on). A 429 surfaces a calm "limit
// reached" state; any other failure degrades to a safe preview message — the card never errors hard.
'use client';

import { useState } from 'react';
import { z } from 'zod';
import type {
  PublicAssistantPreviewStatus,
  UsePublicAssistantPreviewResult,
} from './PublicAssistantPreview.types';

// Zod boundary: never trust the response shape, even from our own public route.
const PublicAssistantResponseSchema = z.object({
  answer: z.string().min(1),
  mode: z.literal('preview'),
  remaining: z.number().int().nonnegative().optional(),
});

const IDLE_ANSWER = 'Choose a prompt — or ask your own question — to see how the assistant will answer.';

const FALLBACK_ANSWER =
  'I can only preview what FixtureLog is building right now. The full broker workspace stays private.';

const BLOCKED_ANSWER =
  "You've reached the preview limit for now. Please check back later — the full workspace stays " +
  'private while the service is prepared.';

export function usePublicAssistantPreview(): UsePublicAssistantPreviewResult {
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [answer, setAnswer] = useState(IDLE_ANSWER);
  const [status, setStatus] = useState<PublicAssistantPreviewStatus>('idle');
  const [remaining, setRemaining] = useState<number | null>(null);

  function send(body: { promptId: string } | { question: string }, promptId: string | null): void {
    setActivePromptId(promptId);
    setStatus('loading');

    void fetch('/api/public/assistant-preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        if (response.status === 429) {
          setAnswer(BLOCKED_ANSWER);
          setRemaining(0);
          setStatus('blocked');
          return;
        }
        const jsonBody: unknown = await response.json();
        if (!response.ok) throw new Error('Preview request was rejected.');
        const parsed = PublicAssistantResponseSchema.parse(jsonBody);
        setAnswer(parsed.answer);
        setRemaining(parsed.remaining ?? null);
        setStatus('answered');
      })
      .catch(() => {
        setAnswer(FALLBACK_ANSWER);
        setStatus('error');
      });
  }

  return {
    activePromptId,
    answer,
    status,
    remaining,
    ask: (promptId: string) => { send({ promptId }, promptId); },
    askQuestion: (question: string) => { send({ question }, null); },
  };
}
