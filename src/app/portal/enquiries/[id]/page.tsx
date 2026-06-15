// portal/enquiries/[id]/page.tsx — enquiry detail + recommended shortlist. A requirement
// not owned by the session charterer resolves to null -> notFound() (404, no leak).
import { notFound } from 'next/navigation';
import { requireCharterer } from '@/lib/auth/require-charterer';
import { getEnquiryDetail } from '@/lib/services/portal/portal-queries';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { PortalCard } from '@/components/portal/PortalCard';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { EnquiryShortlist } from '@/components/portal/EnquiryShortlist';
import { formatDate, formatRate } from '@/lib/utils/format';
import styles from './page.module.css';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <dt className={styles.dt}>{label}</dt>
      <dd className={styles.dd}>{value}</dd>
    </div>
  );
}

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireCharterer();
  const detail = await getEnquiryDetail(ctx.chartererId, id);
  if (detail === null) notFound();

  const { enquiry, shortlist } = detail;

  return (
    <>
      <PortalPageHeader
        eyebrow="Enquiry"
        title={`${enquiry.vesselTypeNeeded} · ${enquiry.regionName}`}
        subline={`${enquiry.workscopeName} · ${enquiry.charterType === 'SPOT' ? 'Spot' : 'Term'} charter`}
        actions={<StatusBadge status={enquiry.status} />}
      />
      <div className={styles.layout}>
        <PortalCard>
          <h2 className={styles.heading}>Requirement details</h2>
          <dl className={styles.specs}>
            <DetailRow label="Start date" value={formatDate(enquiry.startDate)} />
            <DetailRow label="End date" value={formatDate(enquiry.endDate)} />
            <DetailRow
              label="Duration"
              value={enquiry.durationDays !== null ? `${enquiry.durationDays} days` : '—'}
            />
            <DetailRow label="Day-rate budget" value={formatRate(enquiry.dayRateBudget)} />
            <DetailRow label="Created" value={formatDate(enquiry.createdAt)} />
          </dl>
          {enquiry.notes !== null && <p className={styles.notes}>{enquiry.notes}</p>}
        </PortalCard>
        <EnquiryShortlist shortlist={shortlist} />
      </div>
    </>
  );
}
