// HowItWorks.tsx — four-step pipeline: Capture → Match → Fix → Recap.
// Scroll-driven SVG connector on desktop; stacked timeline on mobile and
// under prefers-reduced-motion. Uses motion/react for scroll progress.

'use client';

import { useRef } from 'react';
import { useScroll, useTransform, motion } from 'motion/react';
import { LANDING_HOW_IT_WORKS_STEPS } from '@/lib/constants/landing-copy';
import type { HowItWorksProps } from './HowItWorks.types';
import styles from './HowItWorks.module.css';

export function HowItWorks({ className }: HowItWorksProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Draw the connector as the section scrolls into view.
  // [0.1, 0.55] maps to pathLength [0, 1].
  const pathLength = useTransform(scrollYProgress, [0.1, 0.55], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className={[styles.section, className].filter(Boolean).join(' ')}
      aria-label="How it works"
    >
      <div className={styles.inner}>
        <h2 className={styles.heading}>How it works</h2>

        <div className={styles.pipeline} aria-hidden="true">
          {/* Scroll-drawn connector — desktop only, hidden on mobile via CSS.
              aria-hidden because the steps list is the semantic content. */}
          <svg
            className={styles.connector}
            viewBox="0 0 1000 4"
            preserveAspectRatio="none"
            focusable="false"
          >
            {/* Static track (low-opacity baseline) */}
            <line
              x1="80"
              y1="2"
              x2="920"
              y2="2"
              stroke="rgba(0, 226, 253, 0.2)"
              strokeWidth="2"
            />
            {/* Animated fill */}
            <motion.line
              x1="80"
              y1="2"
              x2="920"
              y2="2"
              stroke="var(--fl-cyan)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ pathLength }}
            />
          </svg>
        </div>

        <ol className={styles.steps} role="list">
          {LANDING_HOW_IT_WORKS_STEPS.map((step) => (
            <li key={step.step} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                0{step.step}
              </span>
              <span className={styles.phase}>{step.phase}</span>
              <h3 className={styles.stepHeading}>{step.heading}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
