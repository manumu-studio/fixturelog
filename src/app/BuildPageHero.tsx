// BuildPageHero.tsx - hero section with junior assistant visual and disclosure panel.
'use client';

import { useState } from 'react';
import { BuildStatusPanel } from '@/components/landing/BuildStatusPanel';
import type { BuildStatusPanelItem } from '@/components/landing/BuildStatusPanel/BuildStatusPanel.types';
import { useBuildStatusPanel } from '@/components/landing/BuildStatusPanel/useBuildStatusPanel';
import { JuniorVoiceAssistant } from '@/components/landing/JuniorVoiceAssistant';
import { PublicAssistantPreview } from '@/components/landing/PublicAssistantPreview';
import type { PublicAssistantPreviewPrompt } from '@/components/landing/PublicAssistantPreview';
import { BuildPageHeroCanvas } from './BuildPageHeroCanvas';
import styles from './page.module.css';

interface BuildPageHeroProps {
  readonly panelTitle: string;
  readonly panelSummary: string;
  readonly panelItems: readonly BuildStatusPanelItem[];
  readonly assistantPrompts: readonly PublicAssistantPreviewPrompt[];
}

export function BuildPageHero({
  panelTitle,
  panelSummary,
  panelItems,
  assistantPrompts,
}: BuildPageHeroProps) {
  const { activeItem, activeLabel, selectItem } = useBuildStatusPanel(panelItems);
  const [cardHovered, setCardHovered] = useState(false);

  return (
    <section className={styles.hero} aria-labelledby="build-title">
      <BuildPageHeroCanvas />
      <div className={`${styles.cardOverlay} card-overlay`} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.layout}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Private build in progress</p>
            <h1 id="build-title" className={styles.title}>
              Two junior assistants are being built for chartering and matching.
            </h1>
            <p className={styles.lede}>
              The public product is temporarily hidden while the broker and charterer
              experience is prepared. One assistant is for chartering handoffs; the other
              will explain vessel matching. Both stay supervised, grounded, and preview-only.
            </p>
            <p className={styles.promise}>The desk stays private while the service takes shape.</p>
          </div>

          <aside
            className={styles.assistantCard}
            aria-label="Assistant preview card"
            onMouseEnter={() => { setCardHovered(true); }}
            onMouseLeave={() => { setCardHovered(false); }}
          >
            <JuniorVoiceAssistant
              className={styles.assistantVisual ?? ''}
              formingHint={cardHovered}
            />

            <BuildStatusPanel
              title={panelTitle}
              summary={panelSummary}
              items={panelItems}
              activeItem={activeItem}
              activeLabel={activeLabel}
              selectItem={selectItem}
            />

            <PublicAssistantPreview prompts={assistantPrompts} />
          </aside>

          <dl className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <dt>Public access</dt>
              <dd>Locked</dd>
            </div>
            <div className={styles.statusItem}>
              <dt>Assistants</dt>
              <dd>Two junior</dd>
            </div>
            <div className={styles.statusItem}>
              <dt>Matching</dt>
              <dd>Prototype</dd>
            </div>
          </dl>

        </div>
      </div>
    </section>
  );
}
