// LandingHero.tsx — full-bleed first-viewport hero with marine canvas background.
// Staggered entrance (eyebrow → headline → subline → CTAs → utility) via motion/react.
// useReducedMotion: reduced-motion users and SSR get content at full opacity with no translate.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as motion from 'motion/react-client';
import { useReducedMotion } from 'motion/react';
import { LANDING_HERO_COPY } from '@/lib/constants/landing-copy';
import { MarineTrafficCanvas } from '@/components/landing/MarineTrafficCanvas';
import type { LandingHeroProps } from './LandingHero.types';
import styles from './LandingHero.module.css';

/* ── Stagger config ───────────────────────────────────────────────────── */

const FADE_UP = { opacity: 0, y: 20 } as const;
const VISIBLE = { opacity: 1, y: 0 } as const;
const INSTANT = { opacity: 1, y: 0 } as const;
const NO_ANIM = { opacity: 1, y: 0 } as const;

function stagger(delay: number, reduced: boolean) {
  if (reduced) return { duration: 0, delay: 0 } as const;
  // Cap total entrance: last item (delay 0.35) + duration 0.4 = 0.75 s total.
  return { duration: 0.4, delay, ease: [0.19, 1, 0.22, 1] } as const;
}

/* ── Sub-components ───────────────────────────────────────────────────── */

function ScrollHint({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      className={styles.scrollHint}
      initial={{ opacity: 0 }}
      animate={
        reduced
          ? { opacity: 0.45 }
          : { opacity: 0.45, y: [0, 8, 0] }
      }
      transition={
        reduced
          ? { duration: 0 }
          : {
              opacity: { duration: 0.6, delay: 0.9 },
              y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }
      }
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        width={24}
        height={24}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
        />
      </svg>
    </motion.div>
  );
}

function UtilityLinks({ reduced }: { reduced: boolean }) {
  const { utilityLinks, authTeaser } = LANDING_HERO_COPY;
  return (
    <motion.div
      className={styles.utility}
      initial={reduced ? NO_ANIM : FADE_UP}
      animate={INSTANT}
      transition={stagger(0.35, reduced)}
    >
      {utilityLinks.map((link) => (
        <Link key={link.href} href={link.href} className={styles.utilityLink}>
          {link.label}
        </Link>
      ))}
      {/* Not an interactive element — aria-disabled signals it is not actionable; tabIndex -1 prevents focus */}
      <span
        className={styles.authTeaser}
        aria-disabled="true"
        tabIndex={-1}
      >
        {authTeaser}
      </span>
    </motion.div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */

export function LandingHero({ className }: LandingHeroProps) {
  const [canvasIntensity, setCanvasIntensity] = useState<'calm' | 'active'>('calm');
  const { eyebrow, headline, subline, primaryCta, secondaryCta } = LANDING_HERO_COPY;
  const reduced = useReducedMotion() ?? false;

  const handleCtaEnter = () => { setCanvasIntensity('active'); };
  const handleCtaLeave = () => { setCanvasIntensity('calm'); };

  return (
    <section
      className={`${styles.hero}${className ? ` ${className}` : ''}`}
      aria-label="Hero"
    >
      <MarineTrafficCanvas
        intensity={canvasIntensity}
        className={styles.canvas ?? ''}
      />

      <div className={styles.inner}>
        <motion.p
          className={styles.eyebrow}
          initial={reduced ? NO_ANIM : FADE_UP}
          animate={VISIBLE}
          transition={stagger(0.05, reduced)}
        >
          {eyebrow}
        </motion.p>

        <motion.h1
          className={styles.headline}
          initial={reduced ? NO_ANIM : FADE_UP}
          animate={VISIBLE}
          transition={stagger(0.12, reduced)}
        >
          {headline}
        </motion.h1>

        <motion.p
          className={styles.subline}
          initial={reduced ? NO_ANIM : FADE_UP}
          animate={VISIBLE}
          transition={stagger(0.19, reduced)}
        >
          {subline}
        </motion.p>

        <motion.div
          className={styles.ctas}
          initial={reduced ? NO_ANIM : FADE_UP}
          animate={VISIBLE}
          transition={stagger(0.27, reduced)}
          onMouseEnter={handleCtaEnter}
          onMouseLeave={handleCtaLeave}
        >
          <Link href={primaryCta.href} className={styles.ctaPrimary}>
            {primaryCta.label}
            <span aria-hidden="true"> →</span>
          </Link>
          <Link href={secondaryCta.href} className={styles.ctaSecondary}>
            {secondaryCta.label}
            <span aria-hidden="true"> →</span>
          </Link>
        </motion.div>

        <UtilityLinks reduced={reduced} />
      </div>

      <ScrollHint reduced={reduced} />
    </section>
  );
}
