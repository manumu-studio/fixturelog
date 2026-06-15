// /requirements — requirement list: table of Charterer, Vessel Type, Region, Status, Start Date, Budget
import Link from 'next/link';
import { z } from 'zod';
import { serverFetch } from '@/lib/server-fetch';
import { requireBroker } from '@/lib/auth/require-broker';

const RequirementListResponseSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    vesselTypeNeeded: z.string(),
    status: z.string(),
    startDate: z.string(),
    dayRateBudget: z.number().nullable(),
    charterer: z.object({ name: z.string() }),
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

export default async function RequirementsPage() {
  // Broker-only workspace: charterer -> /portal, anonymous -> '/' (via the (app) layout).
  await requireBroker();
  const { data: requirements, total } = await fetchRequirements();

  return (
    <main>
      <div>
        <h1>Requirements</h1>
        <span>{total} total</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Charterer</th>
            <th>Vessel Type</th>
            <th>Region</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>Budget ($/day)</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/requirements/${r.id}`}>{r.charterer.name}</Link>
              </td>
              <td>{r.vesselTypeNeeded}</td>
              <td>{r.region.name}</td>
              <td>{r.status}</td>
              <td>{new Date(r.startDate).toLocaleDateString('en-GB')}</td>
              <td>{r.dayRateBudget != null ? r.dayRateBudget.toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
