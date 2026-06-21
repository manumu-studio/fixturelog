// PublicAssistantPreview.tsx - compact public-safe assistant for the landing card.
// Curated prompt chips (always deterministic) plus a free-text box that, when the demo is on,
// asks the grounded preview LLM. Shows questions-remaining and a calm limit-reached state.
'use client';

import { useState, type FormEvent } from 'react';
import type { PublicAssistantPreviewProps } from './PublicAssistantPreview.types';
import { usePublicAssistantPreview } from './usePublicAssistantPreview';
import styles from './PublicAssistantPreview.module.css';

export function PublicAssistantPreview({ prompts }: PublicAssistantPreviewProps) {
  const { activePromptId, answer, status, remaining, ask, askQuestion } = usePublicAssistantPreview();
  const [question, setQuestion] = useState('');
  const loading = status === 'loading';
  const blocked = status === 'blocked';
  const busy = loading || blocked;

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length === 0 || busy) return;
    askQuestion(trimmed);
    setQuestion('');
  }

  return (
    <section className={styles.root} aria-label="Limited assistant preview">
      <div className={styles.promptList} aria-label="Preview prompts">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className={styles.prompt}
            data-active={activePromptId === prompt.id}
            disabled={busy}
            onClick={() => { ask(prompt.id); }}
          >
            {prompt.label}
          </button>
        ))}
      </div>

      <p className={styles.answer} aria-live="polite">
        {loading ? 'Checking the approved preview context...' : answer}
      </p>

      <form className={styles.askForm} onSubmit={onSubmit}>
        <input
          className={styles.askInput}
          type="text"
          value={question}
          onChange={(event) => { setQuestion(event.target.value); }}
          placeholder="Ask the preview a question…"
          maxLength={300}
          disabled={busy}
          aria-label="Ask the preview a question"
        />
        <button
          type="submit"
          className={styles.askSubmit}
          disabled={busy || question.trim().length === 0}
        >
          Ask
        </button>
      </form>

      {status === 'answered' && remaining !== null && (
        <p className={styles.meta}>
          {remaining} preview {remaining === 1 ? 'question' : 'questions'} left.
        </p>
      )}
      {blocked && <p className={styles.meta}>Preview limit reached — check back later.</p>}
    </section>
  );
}
