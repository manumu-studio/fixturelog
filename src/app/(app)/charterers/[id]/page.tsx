// /charterers/:id — charterer detail: info, contact, Requirements section, Fixtures section
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { serverFetch } from '@/lib/server-fetch';
import { requireBroker } from '@/lib/auth/require-broker';
import { EmptyState, PortalCard, PortalPageHeader, StatusBadge } from '@/components/portal';
import { formatDate } from '@/lib/utils/format';
import styles from './page.module.css';

const ChartererSchema = z.object({
  id: z.string(),
  name: z.string(),
  sector: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  notes: z.string().nullable(),
});

const RequirementSchema = z.object({
  id: z.string(),
  status: z.string(),
  vesselTypeNeeded: z.string(),
  region: z.object({ name: z.string() }).nullable(),
  workscope: z.object({ name: z.string() }).nullable(),
  createdAt: z.string(),
});

const FixtureSchema = z.object({
  id: z.string(),
  status: z.string(),
  vessel: z.object({ name: z.string(), vesselType: z.string() }),
  createdAt: z.string(),
});

type Requirement = z.infer<typeof RequirementSchema>;
type Fixture = z.infer<typeof FixtureSchema>;

// Validate the `{ data: ... }` envelope at the fetch boundary — no `as` on external data.
async function fetchData<S extends z.ZodTypeAny>(
  path: string,
  dataSchema: S,
): Promise<z.infer<S>> {
  const res = await serverFetch(path);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Fetch failed: ${path}`);
  return z.object({ data: dataSchema }).parse(await res.json()).data;
}

function RequirementsSection({ requirements }: { requirements: Requirement[] }) {
  return (
    <PortalCard padded={false}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Requirements</h2>
        <span className={styles.count}>{requirements.length}</span>
      </div>
      {requirements.length === 0 ? (
        <EmptyState title="No requirements recorded" message="New charterer enquiries will appear here." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vessel type</th>
                <th>Region</th>
                <th>Workscope</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((requirement) => (
                <tr key={requirement.id}>
                  <td>
                    <Link href={`/requirements/${requirement.id}`} className={styles.primaryLink}>
                      {requirement.vesselTypeNeeded}
                    </Link>
                  </td>
                  <td>{requirement.region?.name ?? '—'}</td>
                  <td>{requirement.workscope?.name ?? '—'}</td>
                  <td><StatusBadge status={requirement.status} /></td>
                  <td>{formatDate(requirement.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalCard>
  );
}

function FixturesSection({ fixtures }: { fixtures: Fixture[] }) {
  return (
    <PortalCard padded={false}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Fixtures</h2>
        <span className={styles.count}>{fixtures.length}</span>
      </div>
      {fixtures.length === 0 ? (
        <EmptyState title="No fixtures recorded" message="Fixed work will appear here once a shortlist moves forward." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vessel</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {fixtures.map((fixture) => (
                <tr key={fixture.id}>
                  <td className={styles.vesselName}>{fixture.vessel.name}</td>
                  <td>{fixture.vessel.vesselType}</td>
                  <td><StatusBadge status={fixture.status} /></td>
                  <td>{formatDate(fixture.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalCard>
  );
}

export default async function ChartererDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBroker();
  const { id } = await params;

  const [charterer, requirements, fixtures] = await Promise.all([
    fetchData(`/api/charterers/${id}`, ChartererSchema),
    fetchData(`/api/charterers/${id}/requirements`, z.array(RequirementSchema)),
    fetchData(`/api/charterers/${id}/fixtures`, z.array(FixtureSchema)),
  ]);

  return (
    <>
      <div className={styles.backBar}>
        <Link href="/charterers" className={styles.backLink}>Back to charterers</Link>
      </div>

      <PortalPageHeader
        eyebrow="Charterer record"
        title={charterer.name}
        subline={charterer.sector ?? 'Broker-managed charterer profile'}
      />

      <div className={styles.layout}>
        <PortalCard>
          <h2 className={styles.profileTitle}>Relationship details</h2>
          <dl className={styles.profileList}>
            <div className={styles.profileRow}>
              <dt>Contact</dt>
              <dd>{charterer.contactName ?? '—'}</dd>
            </div>
            <div className={styles.profileRow}>
              <dt>Email</dt>
              <dd>{charterer.contactEmail ?? '—'}</dd>
            </div>
            <div className={styles.profileRow}>
              <dt>Phone</dt>
              <dd>{charterer.contactPhone ?? '—'}</dd>
            </div>
          </dl>
          {charterer.notes !== null && <p className={styles.notes}>{charterer.notes}</p>}
        </PortalCard>

        <div className={styles.activity}>
          <RequirementsSection requirements={requirements} />
          <FixturesSection fixtures={fixtures} />
        </div>
      </div>
    </>
  );
}
