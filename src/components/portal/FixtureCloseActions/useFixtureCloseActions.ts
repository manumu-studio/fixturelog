// useFixtureCloseActions.ts — client hook owning the two broker mutations: lift a PENDING
// subject (PATCH the subject route) and advance the fixture status (PATCH the status route).
// Every response is Zod-parsed at the boundary; on success we router.refresh() so the server
// component re-renders with the new state. A 400 surfaces the API's own error text inline so
// the ON_SUBS→FIXED subject gate ("every subject must be LIFTED or WAIVED") is shown live.
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MutationErrorSchema, MutationSuccessSchema } from './FixtureCloseActions.types';
import type { ForwardStatus } from './FixtureCloseActions.types';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

// Pull a human error string from a non-OK response, falling back to a generic message.
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const json: unknown = await res.json();
    const parsed = MutationErrorSchema.safeParse(json);
    return parsed.success ? parsed.data.error : GENERIC_ERROR;
  } catch {
    return GENERIC_ERROR;
  }
}

export interface UseFixtureCloseActions {
  /** Which request is in flight: a subject id, the literal 'status', or null when idle. */
  busy: string | null;
  error: string | null;
  liftSubject: (subjectId: string) => Promise<void>;
  advanceStatus: (toStatus: ForwardStatus) => Promise<void>;
}

export function useFixtureCloseActions(fixtureId: string): UseFixtureCloseActions {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Shared mutation runner: PATCH the url, parse the boundary, refresh or surface the error.
  const run = useCallback(
    async (key: string, url: string, body: Record<string, string>): Promise<void> => {
      setBusy(key);
      setError(null);
      try {
        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          setError(await readErrorMessage(res));
          return;
        }
        const json: unknown = await res.json();
        if (!MutationSuccessSchema.safeParse(json).success) {
          setError(GENERIC_ERROR);
          return;
        }
        router.refresh();
      } catch {
        setError('Network error — please try again.');
      } finally {
        setBusy(null);
      }
    },
    [router],
  );

  const liftSubject = useCallback(
    (subjectId: string) =>
      run(subjectId, `/api/fixtures/${fixtureId}/subjects/${subjectId}`, { status: 'LIFTED' }),
    [fixtureId, run],
  );

  const advanceStatus = useCallback(
    (toStatus: ForwardStatus) =>
      run('status', `/api/fixtures/${fixtureId}/status`, { toStatus }),
    [fixtureId, run],
  );

  return { busy, error, liftSubject, advanceStatus };
}
