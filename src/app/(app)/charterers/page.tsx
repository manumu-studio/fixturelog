// /charterers — broker client book with contact and activity counts.
import Link from 'next/link';
import { z } from 'zod';
import { serverFetch } from '@/lib/server-fetch';
import { requireBroker } from '@/lib/auth/require-broker';
import { PortalButton, PortalCard, PortalPageHeader } from '@/components/portal';
import styles from './page.module.css';

const ApiResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      contactName: z.string().nullable(),
      contactEmail: z.string().nullable(),
      _count: z.object({ requirements: z.number(), fixtures: z.number() }).optional(),
    }),
  ),
  total: z.number(),
});
type ApiResponse = z.infer<typeof ApiResponseSchema>;

async function fetchCharterers(): Promise<ApiResponse> {
  const res = await serverFetch('/api/charterers?limit=100');
  if (!res.ok) throw new Error('Failed to fetch charterers');
  return ApiResponseSchema.parse(await res.json());
}

export default async function CharterersPage() {
  await requireBroker();
  const { data: charterers, total } = await fetchCharterers();
  const requirementCount = charterers.reduce(
    (sum, charterer) => sum + (charterer._count?.requirements ?? 0),
    0,
  );
  const fixtureCount = charterers.reduce(
    (sum, charterer) => sum + (charterer._count?.fixtures ?? 0),
    0,
  );

  return (
    <>
      <PortalPageHeader
        eyebrow="Client book"
        title="Charterers"
        subline="Broker-facing client records with enquiry and fixture activity. Keep the commercial relationship close to the operational workflow."
        actions={<PortalButton href="/charterers/new">Register charterer</PortalButton>}
      />

      <div className={styles.summary} aria-label="Charterer book summary">
        <PortalCard>
          <span className={styles.metricValue}>{total}</span>
          <span className={styles.metricLabel}>Registered charterers</span>
        </PortalCard>
        <PortalCard>
          <span className={styles.metricValue}>{requirementCount}</span>
          <span className={styles.metricLabel}>Requirements logged</span>
        </PortalCard>
        <PortalCard>
          <span className={styles.metricValue}>{fixtureCount}</span>
          <span className={styles.metricLabel}>Fixtures tracked</span>
        </PortalCard>
      </div>

      <PortalCard padded={false}>
        <div className={styles.tableHeader}>
          <h2 className={styles.cardTitle}>Charterer directory</h2>
          <p className={styles.cardSubline}>Open a client record to review requirements and fixture history.</p>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Requirements</th>
                <th>Fixtures</th>
              </tr>
            </thead>
            <tbody>
              {charterers.map((charterer) => (
                <tr key={charterer.id}>
                  <td>
                    <Link href={`/charterers/${charterer.id}`} className={styles.primaryLink}>
                      {charterer.name}
                    </Link>
                  </td>
                  <td>{charterer.contactName ?? charterer.contactEmail ?? '—'}</td>
                  <td>{charterer._count?.requirements ?? 0}</td>
                  <td>{charterer._count?.fixtures ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PortalCard>
    </>
  );
}
