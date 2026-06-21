// PublicAssistantPreview.tsx - compact public-safe copilot behavior for the landing card.
'use client';

import type { PublicAssistantPreviewProps } from './PublicAssistantPreview.types';
import { usePublicAssistantPreview } from './usePublicAssistantPreview';
import styles from './PublicAssistantPreview.module.css';

export function PublicAssistantPreview({ prompts }: PublicAssistantPreviewProps) {
  const { activePromptId, answer, status, ask } = usePublicAssistantPreview();
  const loading = status === 'loading';

  return (
    <section className={styles.root} aria-label="Limited assistant preview">
      <div className={styles.promptList} aria-label="Preview prompts">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className={styles.prompt}
            data-active={activePromptId === prompt.id}
            disabled={loading}
            onClick={() => { ask(prompt.id); }}
          >
            {prompt.label}
          </button>
        ))}
      </div>

      <p className={styles.answer} aria-live="polite">
        {loading ? 'Checking the approved preview context...' : answer}
      </p>
    </section>
  );
}
