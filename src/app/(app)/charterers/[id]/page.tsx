// /charterers/:id — charterer detail: info, contact, Requirements section, Fixtures section
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { serverFetch } from '@/lib/server-fetch';

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
    <section>
      <h2>Requirements ({requirements.length})</h2>
      {requirements.length === 0 ? (
        <p>No requirements recorded.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Vessel Type</th>
              <th>Region</th>
              <th>Workscope</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((r) => (
              <tr key={r.id}>
                <td>{r.vesselTypeNeeded}</td>
                <td>{r.region?.name ?? '—'}</td>
                <td>{r.workscope?.name ?? '—'}</td>
                <td>{r.status}</td>
                <td>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function FixturesSection({ fixtures }: { fixtures: Fixture[] }) {
  return (
    <section>
      <h2>Fixtures ({fixtures.length})</h2>
      {fixtures.length === 0 ? (
        <p>No fixtures recorded.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Vessel</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {fixtures.map((f) => (
              <tr key={f.id}>
                <td>
                  <Link href={`/fixtures/${f.id}`}>{f.vessel.name}</Link>
                </td>
                <td>{f.vessel.vesselType}</td>
                <td>{f.status}</td>
                <td>{new Date(f.createdAt).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function ChartererDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [charterer, requirements, fixtures] = await Promise.all([
    fetchData(`/api/charterers/${id}`, ChartererSchema),
    fetchData(`/api/charterers/${id}/requirements`, z.array(RequirementSchema)),
    fetchData(`/api/charterers/${id}/fixtures`, z.array(FixtureSchema)),
  ]);

  return (
    <main>
      <Link href="/charterers">← Charterers</Link>

      <section>
        <h1>{charterer.name}</h1>
        {charterer.sector && <p>Sector: {charterer.sector}</p>}
        {charterer.contactName && <p>Contact: {charterer.contactName}</p>}
        {charterer.contactEmail && <p>Email: {charterer.contactEmail}</p>}
        {charterer.contactPhone && <p>Phone: {charterer.contactPhone}</p>}
        {charterer.notes && <p>{charterer.notes}</p>}
      </section>

      <RequirementsSection requirements={requirements} />
      <FixturesSection fixtures={fixtures} />
    </main>
  );
}
