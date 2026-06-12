// /requirements/:id — ranked shortlist detail for a requirement
import Link from 'next/link';
import { z } from 'zod';
import { ShortlistView, MatchResponseSchema, RequirementDetailSchema } from './ShortlistView';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const IdSchema = z.string().cuid();

async function fetchJson<S extends z.ZodTypeAny>(
  path: string,
  method: 'GET' | 'POST',
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; status: number }> {
  const res = await fetch(`${BASE_URL}${path}`, { method, cache: 'no-store' });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: schema.parse(await res.json()) };
}

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const idResult = IdSchema.safeParse(id);
  if (!idResult.success) {
    return <main><p>Requirement not found.</p></main>;
  }

  const [reqResult, matchResult] = await Promise.all([
    fetchJson(
      `/api/requirements/${id}`,
      'GET',
      z.object({ data: RequirementDetailSchema }),
    ),
    fetchJson(
      `/api/requirements/${id}/match`,
      'POST',
      MatchResponseSchema,
    ),
  ]);

  if (!reqResult.ok || !matchResult.ok) {
    return (
      <main>
        <Link href="/requirements">← Requirements</Link>
        <p>Requirement not found.</p>
      </main>
    );
  }

  return (
    <>
      <Link href="/requirements">← Requirements</Link>
      <ShortlistView
        requirement={reqResult.data.data}
        match={matchResult.data.data}
      />
    </>
  );
}
