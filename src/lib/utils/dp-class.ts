// DP class comparison utility — rank, minimum-check, and headroom over the DPClass enum

import type { DPClass } from '@prisma/client';

/** Numeric rank map. Ordering: NONE < DP1 < DP2 < DP3. */
const DP_CLASS_RANK = {
  NONE: 0,
  DP1: 1,
  DP2: 2,
  DP3: 3,
} as const satisfies Record<DPClass, number>;

/** Returns the numeric rank of a DP class (NONE=0, DP1=1, DP2=2, DP3=3) */
export function dpClassRank(dpClass: DPClass): number {
  return DP_CLASS_RANK[dpClass];
}

/** Returns true if `actual` meets or exceeds the `minimum` DP class requirement */
export function dpClassMeetsMinimum(actual: DPClass, minimum: DPClass): boolean {
  return dpClassRank(actual) >= dpClassRank(minimum);
}

/**
 * Returns the headroom above minimum as a 0–1 value.
 * 0 = exact match, 1 = max headroom (NONE → DP3 gap).
 * Negative values (actual below minimum) are clamped to 0.
 */
export function dpClassHeadroom(actual: DPClass, minimum: DPClass): number {
  const raw = (dpClassRank(actual) - dpClassRank(minimum)) / 3;
  return Math.max(0, Math.min(1, raw));
}
