// FeatureShowcase.tsx — four alternating feature rows with whileInView reveal animations.
// Reads copy from landing-copy.ts. Mock panels are CSS-rendered honest UI previews;
// real Playwright screenshots are captured in TASK-067.

'use client';

import { motion, useReducedMotion } from 'motion/react';
import { PendingLink } from '@/components/shared/pending';
import { LANDING_FEATURES, LANDING_FEATURE_SECTION_HEADING } from '@/lib/constants/landing-copy';
import type { FeatureShowcaseProps, MockPanelProps } from './FeatureShowcase.types';
import {
  RequirementsPanel,
  MapPanel,
  LifecyclePanel,
  WeatherRecapPanel,
} from './MockPanels';
import styles from './FeatureShowcase.module.css';

// ---------------------------------------------------------------------------
// Panel selector — maps feature id to its CSS mock panel
// ---------------------------------------------------------------------------

const PANEL_MAP: Record<string, React.ComponentType> = {
  requirements: RequirementsPanel,
  map: MapPanel,
  lifecycle: LifecyclePanel,
  recap: WeatherRecapPanel,
} as const;

function FeaturePanel({ featureId }: MockPanelProps) {
  const Panel = PANEL_MAP[featureId];
  if (Panel === undefined) return null;
  return <Panel />;
}

// ---------------------------------------------------------------------------
// Single feature row — text + panel, alternating direction on desktop
// ---------------------------------------------------------------------------

interface FeatureRowProps {
  feature: (typeof LANDING_FEATURES)[number];
  index: number;
  reducedMotion: boolean;
}

function FeatureRow({ feature, index, reducedMotion }: FeatureRowProps) {
  const isReverse = index % 2 !== 0;
  const xOffset = isReverse ? 48 : -48;

  const rowClass = [styles.feature, isReverse ? styles.featureReverse : '']
    .filter(Boolean)
    .join(' ');

  const initial = reducedMotion ? { opacity: 0 } : { opacity: 0, x: xOffset };
  const animate = reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 };

  return (
    <motion.div
      className={rowClass}
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
    >
      <div className={styles.textCol}>
        <p className={styles.eyebrow}>{feature.eyebrow}</p>
        <h3 className={styles.heading}>{feature.heading}</h3>
        <p className={styles.body}>{feature.body}</p>
        <PendingLink href={feature.cta.href} className={styles.cta}>
          {feature.cta.label}
        </PendingLink>
      </div>

      <div className={styles.panelCol}>
        <FeaturePanel featureId={feature.id} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section heading row — editorial serif + divider
// ---------------------------------------------------------------------------

function ShowcaseHeading() {
  return (
    <div className={styles.headingBlock}>
      <p className={styles.sectionEyebrow}>The demo workflow</p>
      <h2 className={styles.sectionHeading}>{LANDING_FEATURE_SECTION_HEADING}</h2>
      <p className={styles.sectionSubline}>
        Four real capabilities — each backed by a public route or API you can explore now.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeatureShowcase — section root
// ---------------------------------------------------------------------------

export function FeatureShowcase({ className }: FeatureShowcaseProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section
      className={`${styles.section}${className !== undefined ? ` ${className}` : ''}`}
      aria-label="Feature showcase"
    >
      <div className={styles.inner}>
        <ShowcaseHeading />

        <div className={styles.features}>
          {LANDING_FEATURES.map((feature, index) => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              index={index}
              reducedMotion={shouldReduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
