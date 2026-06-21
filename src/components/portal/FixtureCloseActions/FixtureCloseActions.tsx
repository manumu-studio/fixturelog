// FixtureCloseActions.tsx — broker-only "close the deal" controls rendered next to each
// fixture on the broker dashboard. It offers a "Lift" button per PENDING subject and a single
// primary button labelled by the fixture's next forward status (e.g. "Fix the deal" on
// ON_SUBS). It never renders on the charterer portal — the shared FixtureTimeline only calls
// this through an optional render-prop the charterer call sites omit. Buttons disable while a
// request is in flight; errors (including the API's subject-gate message) show inline.
'use client';

import { PortalButton } from '@/components/portal/PortalButton';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { useFixtureCloseActions } from './useFixtureCloseActions';
import type {
  CloseActionSubject,
  FixtureCloseActionsProps,
  ForwardStatus,
} from './FixtureCloseActions.types';
import styles from './FixtureCloseActions.module.css';

// The forward (deal-advancing) move for each status, with the broker-facing label. Statuses
// with no forward move (COMPLETED, FAILED) are absent — no primary button renders for them.
const NEXT_MOVE: Partial<
  Record<FixtureCloseActionsProps['status'], { to: ForwardStatus; label: string }>
> = {
  DRAFT: { to: 'NEGOTIATING', label: 'Start negotiating' },
  NEGOTIATING: { to: 'ON_SUBS', label: 'Move to on-subs' },
  ON_SUBS: { to: 'FIXED', label: 'Fix the deal' },
  FIXED: { to: 'COMPLETED', label: 'Mark completed' },
};

function isPending(subject: CloseActionSubject): boolean {
  return subject.status === 'PENDING';
}

function screeningBlocksFix(screeningStatus: FixtureCloseActionsProps['screeningStatus']): boolean {
  return screeningStatus === 'BLOCKED'
    || screeningStatus === 'REVIEW'
    || screeningStatus === 'STALE'
    || screeningStatus === 'SOURCE_ERROR';
}

function screeningWarning(screeningStatus: FixtureCloseActionsProps['screeningStatus']): string | null {
  if (screeningStatus === 'BLOCKED') return 'Screening blocked: cannot proceed to FIXED.';
  if (screeningStatus === 'REVIEW') return 'Screening review required before FIXED.';
  if (screeningStatus === 'STALE') return 'Screening re-check required before FIXED.';
  if (screeningStatus === 'SOURCE_ERROR') return 'Screening unavailable: review required before FIXED.';
  return null;
}

export function FixtureCloseActions({
  fixtureId,
  status,
  subjects,
  screeningStatus,
}: FixtureCloseActionsProps) {
  const { busy, error, liftSubject, advanceStatus } = useFixtureCloseActions(fixtureId);
  const move = NEXT_MOVE[status];
  const pendingSubjects = subjects.filter(isPending);
  const inFlight = busy !== null;
  const fixedMoveBlocked = move?.to === 'FIXED' && screeningBlocksFix(screeningStatus);
  const screeningMessage = move?.to === 'FIXED' ? screeningWarning(screeningStatus) : null;

  // Nothing actionable for terminal fixtures and no open subjects → render nothing.
  if (move === undefined && pendingSubjects.length === 0) {
    return null;
  }

  return (
    <div className={styles.root}>
      {pendingSubjects.length > 0 && (
        <ul className={styles.lifts}>
          {pendingSubjects.map((subject) => (
            <li key={subject.id} className={styles.lift}>
              <span className={styles.liftLabel}>{subject.label}</span>
              <StatusBadge status={subject.status} />
              <PortalButton
                variant="secondary"
                size="sm"
                disabled={inFlight}
                onClick={() => {
                  void liftSubject(subject.id);
                }}
              >
                {busy === subject.id ? 'Lifting…' : 'Lift'}
              </PortalButton>
            </li>
          ))}
        </ul>
      )}

      {move !== undefined && (
        <div className={styles.primary}>
          <PortalButton
            variant="primary"
            size="sm"
            disabled={inFlight || fixedMoveBlocked}
            onClick={() => {
              void advanceStatus(move.to);
            }}
          >
            {busy === 'status' ? 'Working…' : move.label}
          </PortalButton>
        </div>
      )}

      {(error !== null || screeningMessage !== null) && (
        <p className={styles.error} role="alert">
          {error ?? screeningMessage}
        </p>
      )}
    </div>
  );
}
