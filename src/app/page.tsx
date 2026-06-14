// page.tsx — public landing page for FixtureLog. Route `/` remains public with no auth.
// Composed from landing section components; all copy sourced from landing-copy.ts.

import { CtaFooter } from '@/components/landing/CtaFooter';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingNav } from '@/components/landing/LandingNav';
import { TechBadges } from '@/components/landing/TechBadges';
import { LANDING_PROOF_POINTS } from '@/lib/constants/landing-copy';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <LandingNav />

      <main id="main-content">
        <LandingHero />

        {/* Proof strip — concise metrics from MVP v1.0.0 */}
        <section className={styles.proofStrip} aria-label="Key metrics">
          <div className={styles.proofInner}>
            {/* Visually-hidden h2 preserves heading order for screen readers */}
            <h2 className={styles.proofHeading}>Key metrics</h2>
            <ul className={styles.proofList} role="list">
              {LANDING_PROOF_POINTS.map((point) => (
                <li key={point.label} className={styles.proofItem}>
                  <span className={styles.proofValue}>{point.value}</span>
                  <span className={styles.proofLabel}>{point.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FeatureShowcase />
        <HowItWorks />
        <TechBadges />
        <CtaFooter />
      </main>

      <LandingFooter />
    </>
  );
}
