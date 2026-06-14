// LandingFooter.tsx — portfolio disclaimer, route links, and copyright.
// No SSY affiliation claim. Clearly labelled as independent portfolio demo.
// Footer column headings use mid-blue (#0087cb) per SSY-pattern report guidance.

import Link from 'next/link';
import { LANDING_FOOTER_COPY } from '@/lib/constants/landing-copy';
import type { LandingFooterProps } from './LandingFooter.types';
import styles from './LandingFooter.module.css';

export function LandingFooter({ className }: LandingFooterProps) {
  const { disclaimer, links, copyright } = LANDING_FOOTER_COPY;

  return (
    <footer
      className={[styles.footer, className].filter(Boolean).join(' ')}
      aria-label="Site footer"
    >
      <div className={styles.inner}>
        {/* Left column — product identity + disclaimer */}
        <div className={styles.brand}>
          <p className={styles.groupLabel}>FixtureLog</p>
          <p className={styles.disclaimer}>{disclaimer}</p>
        </div>

        {/* Right column — navigation links */}
        <div className={styles.navCol}>
          <p className={styles.groupLabel}>Explore</p>
          <nav aria-label="Footer navigation">
            <ul className={styles.linkList} role="list">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copyright}>{copyright}</p>
      </div>
    </footer>
  );
}
