// FixtureCloseActions.types.ts — props + the next-status map for the broker close-the-deal
// actions. The component is broker-only; the charterer portal never renders it. Statuses and
// the SubjectSummary shape are reused from the portal validators so the boundary stays typed.
import { z } from 'zod';
import type { FixtureSummary } from '@/lib/validators/portal.validators';

// A fixture's forward (deal-advancing) status, if any. Terminal and FAILED branches are
// intentionally excluded — the broker close UI only moves a deal toward FIXED/COMPLETED.
export type ForwardStatus = 'NEGOTIATING' | 'ON_SUBS' | 'FIXED' | 'COMPLETED';

/** A subject as the close-actions UI needs it: id, label, current status. */
export type CloseActionSubject = FixtureSummary['subjects'][number];

export interface FixtureCloseActionsProps {
  fixtureId: string;
  status: FixtureSummary['status'];
  subjects: CloseActionSubject[];
}

// ─── Boundary schemas (Zod-parsed on every response) ─────────────────────────
// We only read the fields we act on; unknown extra fields are ignored. A success
// response carries `data`; an error response carries `error` (a human string).
export const MutationSuccessSchema = z.object({
  data: z.object({ id: z.string() }),
});

export const MutationErrorSchema = z.object({
  error: z.string(),
});
