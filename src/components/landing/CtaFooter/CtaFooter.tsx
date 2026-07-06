// CtaFooter.tsx — final full-width CTA band on deep navy.
// Links lead to real public demo routes.
// "Add Charterer" is used for /charterers/new — never "Register".

import { PendingLink } from '@/components/shared/pending';
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
              <PendingLink key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </PendingLink>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
