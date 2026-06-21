// BuildStatusPanel.tsx - disclosure panel for public build status copy and metrics.
'use client';

import type { BuildStatusPanelViewProps } from './BuildStatusPanel.types';
import styles from './BuildStatusPanel.module.css';

export function BuildStatusPanel({
  title,
  summary,
  items,
  activeItem,
  activeLabel,
  selectItem,
}: BuildStatusPanelViewProps) {
  const activeIndex = items.findIndex((item) => item.label === activeLabel);

  return (
    <section
      className={styles.root}
      aria-label="Build status"
      data-active-index={activeIndex >= 0 ? activeIndex : 0}
    >
      <details className={styles.details}>
        <summary className={styles.disclosure}>
          <div className={styles.header}>
            <p className={styles.kicker}>Build status</p>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{title}</h2>
              <span className={styles.activatedBadge}>
                <span className={styles.activatedPulse} aria-hidden="true" />
                Activated
              </span>
            </div>
          </div>
        </summary>

        <div className={styles.detailsBody}>
          <p className={styles.summary}>{summary}</p>
          {activeItem ? <p className={styles.focusReadout}>{activeItem.detail}</p> : null}

          <div className={styles.metrics} aria-label="Build status signals">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={styles.metric}
                data-active={item.label === activeLabel}
                aria-pressed={item.label === activeLabel}
                onClick={() => { selectItem(item.label); }}
                onMouseEnter={() => { selectItem(item.label); }}
              >
                <span className={styles.metricLabel}>{item.label}</span>
                <span className={styles.metricValue}>{item.value}</span>
              </button>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}
