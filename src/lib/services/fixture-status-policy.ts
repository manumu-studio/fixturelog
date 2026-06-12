// Pure fixture status transition policy — enforces the legal transition matrix and subject-lift gate

import type { FixtureStatus, RequirementStatus, SubjectItemStatus } from '@prisma/client';

export interface TransitionContext {
  /** Status of every subject on the fixture, in any order. Empty array if none. */
  subjectStatuses: SubjectItemStatus[];
}

export interface TransitionResult {
  allowed: true;
  /** When -> FIXED, propagate `status: FIXED` to the linked Requirement (status ONLY —
   *  Requirement has no `fixedAt` column). Null for every other legal transition. */
  requirementUpdate: { status: RequirementStatus } | null;
  /** When -> FIXED, the timestamp the caller stamps onto `Fixture.fixedAt`. Null otherwise. */
  fixtureFixedAt: Date | null;
}

export interface TransitionRejection {
  allowed: false;
  reason: string;
}

export type TransitionOutcome = TransitionResult | TransitionRejection;

/**
 * Legal transition matrix per SPEC-001 §4.4.
 * Key: fromStatus. Value: set of allowed toStatus values (excluding the subject-gated path).
 */
const LEGAL_TRANSITIONS: Partial<Record<FixtureStatus, ReadonlySet<FixtureStatus>>> = {
  DRAFT: new Set<FixtureStatus>(['NEGOTIATING']),
  NEGOTIATING: new Set<FixtureStatus>(['ON_SUBS', 'FAILED']),
  ON_SUBS: new Set<FixtureStatus>(['FIXED', 'FAILED']),
  FIXED: new Set<FixtureStatus>(['COMPLETED']),
  // COMPLETED and FAILED are terminal — no entries
};

const TERMINAL_STATUSES: ReadonlySet<FixtureStatus> = new Set<FixtureStatus>([
  'COMPLETED',
  'FAILED',
]);

/**
 * Evaluates whether a fixture status transition is legal per SPEC-001 §4.4.
 * Pure function — no DB access, no side effects (the only impurity is `new Date()`
 * for the FIXED timestamp; callers needing determinism can pass a clock).
 */
export function evaluateTransition(
  fromStatus: FixtureStatus,
  toStatus: FixtureStatus,
  context: TransitionContext,
): TransitionOutcome {
  // Rule 1: same-status rejection
  if (fromStatus === toStatus) {
    return { allowed: false, reason: 'Cannot transition to the same status' };
  }

  // Rule 3: terminal state rejection
  if (TERMINAL_STATUSES.has(fromStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition from terminal status ${fromStatus}`,
    };
  }

  // Rule 2: illegal transition
  const allowed = LEGAL_TRANSITIONS[fromStatus];
  if (allowed === undefined || !allowed.has(toStatus)) {
    return {
      allowed: false,
      reason: `Transition from ${fromStatus} to ${toStatus} is not allowed`,
    };
  }

  // Rule 4: subject-lift gate on ON_SUBS -> FIXED only
  if (fromStatus === 'ON_SUBS' && toStatus === 'FIXED') {
    const { subjectStatuses } = context;

    if (subjectStatuses.length === 0) {
      return {
        allowed: false,
        reason: 'Cannot fix: fixture has no subjects to lift',
      };
    }

    const unresolved = subjectStatuses.filter(
      (s) => s === 'PENDING' || s === 'FAILED',
    );

    if (unresolved.length > 0) {
      return {
        allowed: false,
        reason: `Cannot fix: every subject must be LIFTED or WAIVED (${unresolved.length} still unresolved)`,
      };
    }

    // Rule 5: FIXED propagation — status only on Requirement; fixedAt on Fixture.
    const fixedOutcome: TransitionResult = {
      allowed: true,
      requirementUpdate: { status: 'FIXED' },
      fixtureFixedAt: new Date(),
    };
    return fixedOutcome;
  }

  // All other legal transitions — no side effects
  return {
    allowed: true,
    requirementUpdate: null,
    fixtureFixedAt: null,
  };
}
