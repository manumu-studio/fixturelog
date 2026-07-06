// /requirements — broker requirement queue with charterer, vessel, region, status, screening, date, and budget.
import Link from 'next/link';
import { z } from 'zod';
import { serverFetch } from '@/lib/server-fetch';
import { requireBroker } from '@/lib/auth/require-broker';
import { PortalButton, PortalCard, PortalPageHeader, StatusBadge } from '@/components/portal';
import { formatDate, formatRate } from '@/lib/utils/format';
import styles from './page.module.css';

const ScreeningStatusSchema = z.enum(['CLEAR', 'REVIEW', 'BLOCKED']);

const RequirementListResponseSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    vesselTypeNeeded: z.string(),
    status: z.string(),
    startDate: z.string(),
    dayRateBudget: z.number().nullable(),
    charterer: z.object({
      name: z.string(),
      latestScreeningStatus: ScreeningStatusSchema.nullable(),
      latestScreenedAt: z.string().nullable().or(z.date().nullable()),
      latestScreeningTtlExpiresAt: z.string().nullable().or(z.date().nullable()),
      latestScreeningSourceName: z.string().nullable(),
    }),
    region: z.object({ name: z.string(), code: z.string() }),
  })),
  total: z.number(),
});

type RequirementListResponse = z.infer<typeof RequirementListResponseSchema>;

async function fetchRequirements(): Promise<RequirementListResponse> {
  const res = await serverFetch('/api/requirements?limit=50');
  if (!res.ok) throw new Error('Failed to fetch requirements');
  return RequirementListResponseSchema.parse(await res.json());
}

function screeningLabel(charterer: RequirementListResponse['data'][number]['charterer']): string {
  if (charterer.latestScreeningStatus === null) return 'NOT_SCREENED';
  if (charterer.latestScreeningTtlExpiresAt === null) return charterer.latestScreeningStatus;
  const expiresAt = new Date(charterer.latestScreeningTtlExpiresAt);
  return expiresAt.getTime() <= Date.now() ? 'STALE' : charterer.latestScreeningStatus;
}

export default async function RequirementsPage() {
  // Broker-only workspace: charterer -> /portal, anonymous -> '/' (via the (app) layout).
  await requireBroker();
  const { data: requirements, total } = await fetchRequirements();
  const liveCount = requirements.filter((r) => r.status !== 'LOST' && r.status !== 'FIXED').length;
  const reviewCount = requirements.filter((r) => (
    r.status === 'NEGOTIATING'
    || r.status === 'ON_SUBS'
    || screeningLabel(r.charterer) !== 'CLEAR'
  )).length;

  return (
    <>
      <PortalPageHeader
        eyebrow="Broker queue"
        title="Requirements"
        subline="Every open charterer enquiry in one place: shortlist vessels, track negotiation state, and keep screening evidence visible before commitment."
        actions={<PortalButton href="/map" variant="secondary">Open map</PortalButton>}
      />

      <div className={styles.summary} aria-label="Requirement queue summary">
        <PortalCard>
          <span className={styles.metricValue}>{total}</span>
          <span className={styles.metricLabel}>Total requirements</span>
        </PortalCard>
        <PortalCard>
          <span className={styles.metricValue}>{liveCount}</span>
          <span className={styles.metricLabel}>Active broker queue</span>
        </PortalCard>
        <PortalCard>
          <span className={styles.metricValue}>{reviewCount}</span>
          <span className={styles.metricLabel}>Needs review</span>
        </PortalCard>
      </div>

      <PortalCard padded={false}>
        <div className={styles.tableHeader}>
          <div>
            <h2 className={styles.cardTitle}>Incoming requirements</h2>
            <p className={styles.cardSubline}>Commercial fit first; screening evidence review before the deal moves forward.</p>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Charterer</th>
                <th>Vessel type</th>
                <th>Region</th>
                <th>Status</th>
                <th>Screening</th>
                <th>Start date</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((requirement) => (
                <tr key={requirement.id}>
                  <td>
                    <Link href={`/requirements/${requirement.id}`} className={styles.primaryLink}>
                      {requirement.charterer.name}
                    </Link>
                  </td>
                  <td>{requirement.vesselTypeNeeded}</td>
                  <td>{requirement.region.name}</td>
                  <td><StatusBadge status={requirement.status} /></td>
                  <td><StatusBadge status={screeningLabel(requirement.charterer)} /></td>
                  <td>{formatDate(requirement.startDate)}</td>
                  <td>{formatRate(requirement.dayRateBudget, 'USD')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PortalCard>
    </>
  );
}
