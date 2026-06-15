// ActiveEnquiries.tsx — dashboard zone 1: the charterer's open requirement rows. Server
// component; composes PortalCard + StatusBadge + EmptyState.
import Link from 'next/link';
import { PortalCard } from '@/components/portal/PortalCard';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { EmptyState } from '@/components/portal/EmptyState';
import { PortalButton } from '@/components/portal/PortalButton';
import { formatDate, formatRate } from '@/lib/utils/format';
import type { ActiveEnquiriesProps } from './ActiveEnquiries.types';
import styles from './ActiveEnquiries.module.css';

const DEFAULT_EMPTY_CTA = { label: 'Create enquiry', href: '/portal/enquiries/new' };

export function ActiveEnquiries({
  enquiries,
  enquiryHrefBase = '/portal/enquiries',
  emptyCta = DEFAULT_EMPTY_CTA,
}: ActiveEnquiriesProps) {
  return (
    <PortalCard>
      <h2 className={styles.heading}>Active enquiries</h2>
      {enquiries.length === 0 ? (
        <EmptyState
          title="No active enquiries"
          message="Post a requirement and we'll recommend vessels from the fleet."
          action={<PortalButton href={emptyCta.href}>{emptyCta.label}</PortalButton>}
        />
      ) : (
        <ul className={styles.list}>
          {enquiries.map((e) => (
            <li key={e.id}>
              <Link href={`${enquiryHrefBase}/${e.id}`} className={styles.row}>
                <span className={styles.type}>{e.vesselTypeNeeded}</span>
                <span className={styles.region}>{e.regionName}</span>
                <span className={styles.date}>{formatDate(e.startDate)}</span>
                <span className={styles.rate}>{formatRate(e.dayRateBudget)}</span>
                <StatusBadge status={e.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PortalCard>
  );
}
