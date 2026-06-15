// FleetTeaser.tsx — public landing section that previews the fleet for charterers and
// funnels to the portal Fleet Explorer. Read-only and data-free: it shows the committed
// vessel-type illustrations (no portal data is exposed to anonymous visitors). Server
// component; copy + cards come from landing-copy.ts.
import Image from 'next/image';
import { PendingLink } from '@/components/shared/pending';
import { LANDING_FLEET_TEASER } from '@/lib/constants/landing-copy';
import styles from './FleetTeaser.module.css';

export function FleetTeaser() {
  const teaser = LANDING_FLEET_TEASER;
  return (
    <section className={styles.section} aria-label="Fleet preview for charterers">
      <div className={styles.inner}>
        <div className={styles.head}>
          <p className={styles.eyebrow}>{teaser.eyebrow}</p>
          <h2 className={styles.heading}>{teaser.heading}</h2>
          <p className={styles.subline}>{teaser.subline}</p>
        </div>
        <ul className={styles.grid}>
          {teaser.vessels.map((vessel) => (
            <li key={vessel.type} className={styles.card}>
              <span className={styles.imageWrap}>
                <Image
                  src={vessel.image}
                  alt={`${vessel.label} vessel illustration`}
                  fill
                  sizes="(max-width: 720px) 50vw, 240px"
                  className={styles.image}
                />
              </span>
              <span className={styles.label}>
                <span className={styles.name}>{vessel.label}</span>
                <span className={styles.type}>{vessel.type}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.credit}>{teaser.creditNote}</p>
        <div className={styles.ctaRow}>
          <PendingLink href={teaser.cta.href} className={styles.cta}>
            {teaser.cta.label}
          </PendingLink>
        </div>
      </div>
    </section>
  );
}
