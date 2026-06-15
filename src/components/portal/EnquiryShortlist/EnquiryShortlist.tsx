// EnquiryShortlist.tsx — recommended-vessel shortlist with "why this vessel" evidence
// (match score + per-factor breakdown + specs). Server component; reuses the broker matcher
// output via the portal API. Adapts the broker ShortlistView into the portal design kit.
import Image from 'next/image';
import { PortalCard } from '@/components/portal/PortalCard';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { EmptyState } from '@/components/portal/EmptyState';
import { BRAND_NAME } from '@/lib/constants/brand';
import type { ShortlistEntry } from '@/lib/validators/portal.validators';
import type { EnquiryShortlistProps } from './EnquiryShortlist.types';
import styles from './EnquiryShortlist.module.css';

const FALLBACK_IMAGE = '/assets/vessels/generic.svg';

function ScoreChip({ label, value, primary = false }: { label: string; value: number; primary?: boolean }) {
  return (
    <span className={primary ? `${styles.chip} ${styles.chipPrimary}` : styles.chip}>
      <span className={styles.chipLabel}>{label}</span>
      <span className={styles.chipValue}>{Math.round(value)}</span>
    </span>
  );
}

function ShortlistItem({ vessel }: { vessel: ShortlistEntry }) {
  return (
    <article className={styles.entry}>
      <div className={styles.thumb}>
        <Image src={vessel.imageUrl ?? FALLBACK_IMAGE} alt={vessel.vesselName} fill sizes="120px" className={styles.thumbImg} />
      </div>
      <div className={styles.body}>
        <div className={styles.head}>
          <span className={styles.rank}>#{vessel.rank}</span>
          <span className={styles.name}>{vessel.vesselName}</span>
          <span className={styles.type}>{vessel.vesselType}</span>
          <StatusBadge status={vessel.status} />
        </div>
        <div className={styles.specs}>
          <span>{vessel.dpClass}</span>
          {vessel.deckAreaM2 !== null && <span>{vessel.deckAreaM2} m² deck</span>}
          {vessel.bollardPullT !== null && <span>{vessel.bollardPullT} t bollard pull</span>}
        </div>
        <div className={styles.factors}>
          <ScoreChip label="Match" value={vessel.score} primary />
          <ScoreChip label="Distance" value={vessel.factors.distance} />
          <ScoreChip label="Rate fit" value={vessel.factors.rateFit} />
          <ScoreChip label="Capability" value={vessel.factors.capabilityMargin} />
        </div>
      </div>
    </article>
  );
}

export function EnquiryShortlist({ shortlist }: EnquiryShortlistProps) {
  return (
    <PortalCard>
      <h2 className={styles.heading}>Recommended vessels</h2>
      <p className={styles.sub}>Ranked by the {BRAND_NAME} matching engine — score, location, rate fit, and capability.</p>
      {shortlist.length === 0 ? (
        <EmptyState
          title="No matching vessels yet"
          message="No open vessels currently match this requirement's type and region."
        />
      ) : (
        <div className={styles.list}>
          {shortlist.map((vessel) => (
            <ShortlistItem key={vessel.vesselId} vessel={vessel} />
          ))}
        </div>
      )}
    </PortalCard>
  );
}
