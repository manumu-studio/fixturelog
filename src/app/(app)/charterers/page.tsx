// /charterers — charterer list: table of Name, Contact, Requirements, Fixtures + Register button
import Link from 'next/link';
import { z } from 'zod';
import { serverFetch } from '@/lib/server-fetch';

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
  const { data: charterers, total } = await fetchCharterers();

  return (
    <main>
      <div>
        <h1>Charterers</h1>
        <span>{total} registered</span>
        <Link href="/charterers/new">Register Charterer</Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Requirements</th>
            <th>Fixtures</th>
          </tr>
        </thead>
        <tbody>
          {charterers.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/charterers/${c.id}`}>{c.name}</Link>
              </td>
              <td>{c.contactName ?? c.contactEmail ?? '—'}</td>
              <td>{c._count?.requirements ?? 0}</td>
              <td>{c._count?.fixtures ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
