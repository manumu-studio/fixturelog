// /requirements/:id — ranked shortlist detail for a requirement
import Link from 'next/link';
import { z } from 'zod';
import { serverFetch } from '@/lib/server-fetch';
import { requireBroker } from '@/lib/auth/require-broker';
import { PortalButton } from '@/components/portal';
import { ShortlistView, MatchResponseSchema, RequirementDetailSchema } from './ShortlistView';
import styles from './page.module.css';

const IdSchema = z.string().cuid();

async function fetchJson<S extends z.ZodTypeAny>(
  path: string,
  method: 'GET' | 'POST',
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; status: number }> {
  const res = await serverFetch(path, { method });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: schema.parse(await res.json()) };
}

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Broker-only workspace: charterer -> /portal, anonymous -> '/' (via the (app) layout).
  await requireBroker();
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
      <div className={styles.notFound}>
        <PortalButton href="/requirements" variant="secondary">Back to requirements</PortalButton>
        <p>Requirement not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.backBar}>
        <Link href="/requirements" className={styles.backLink}>Back to requirements</Link>
      </div>
      <ShortlistView
        requirement={reqResult.data.data}
        match={matchResult.data.data}
      />
    </>
  );
}
