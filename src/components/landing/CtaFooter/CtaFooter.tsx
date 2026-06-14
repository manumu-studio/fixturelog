// CtaFooter.tsx — final full-width CTA band on deep navy with a subtle
// cyan/blue gradient overlay. Links lead to real public demo routes.
// "Add Charterer" is used for /charterers/new — never "Register".

import Link from 'next/link';
import { LANDING_CTA_FOOTER } from '@/lib/constants/landing-copy';
import type { CtaFooterProps } from './CtaFooter.types';
import styles from './CtaFooter.module.css';

export function CtaFooter({ className }: CtaFooterProps) {
  const { heading, subline, links } = LANDING_CTA_FOOTER;

  return (
    <section
      className={[styles.section, className].filter(Boolean).join(' ')}
      aria-label="Call to action"
    >
      {/* Gradient pattern overlay — purely decorative */}
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.inner}>
        <h2 className={styles.heading}>{heading}</h2>
        <p className={styles.subline}>{subline}</p>

        <nav className={styles.links} aria-label="Demo routes">
          {links.map((link, index) => {
            const linkClass = [
              styles.link,
              index === 0 ? styles.linkPrimary : styles.linkSecondary,
            ].join(' ');

            return (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
