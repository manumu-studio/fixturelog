// EnquiryList.tsx — full list of the charterer's requirements (My Enquiries). Server
// component; each row links to the enquiry detail + shortlist.
import Link from 'next/link';
import { PortalCard } from '@/components/portal/PortalCard';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { EmptyState } from '@/components/portal/EmptyState';
import { PortalButton } from '@/components/portal/PortalButton';
import { formatDate, formatRate } from '@/lib/utils/format';
import type { EnquiryListProps } from './EnquiryList.types';
import styles from './EnquiryList.module.css';

export function EnquiryList({ enquiries }: EnquiryListProps) {
  if (enquiries.length === 0) {
    return (
      <PortalCard>
        <EmptyState
          title="No enquiries yet"
          message="Create your first enquiry and we'll recommend vessels from the fleet."
          action={<PortalButton href="/portal/enquiries/new">Create enquiry</PortalButton>}
        />
      </PortalCard>
    );
  }

  return (
    <PortalCard padded={false}>
      <ul className={styles.list}>
        {enquiries.map((e) => (
          <li key={e.id}>
            <Link href={`/portal/enquiries/${e.id}`} className={styles.row}>
              <span className={styles.type}>{e.vesselTypeNeeded}</span>
              <span className={styles.region}>{e.regionName}</span>
              <span className={styles.workscope}>{e.workscopeName}</span>
              <span className={styles.date}>{formatDate(e.startDate)}</span>
              <span className={styles.rate}>{formatRate(e.dayRateBudget)}</span>
              <StatusBadge status={e.status} />
            </Link>
          </li>
        ))}
      </ul>
    </PortalCard>
  );
}
