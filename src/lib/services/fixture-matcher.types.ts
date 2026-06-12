// Type definitions for the FixtureMatcher service — candidates, requirements, benchmarks, weights, results

import type { DPClass, VesselType } from '@prisma/client';

/** A vessel candidate prepared for matching (pre-fetched from DB) */
export interface MatchCandidate {
  id: string;
  name: string;
  vesselType: VesselType;
  status: 'OPEN' | 'ON_HIRE' | 'YARD' | 'LAID_UP';
  dpClass: DPClass;
  deckAreaM2: number | null;
  bollardPullT: number | null;
  openDate: Date | null;
  openRegionId: string | null;
  /** Vessel's current position (latest snapshot) */
  positionLat: number | null;
  positionLng: number | null;
}

/** The requirement to match against (simplified from Prisma model) */
export interface MatchRequirement {
  vesselTypeNeeded: VesselType;
  regionId: string;
  regionCenterLat: number;
  regionCenterLng: number;
  minDeckAreaM2: number | null;
  minBollardPullT: number | null;
  minDpClass: DPClass | null;
  startDate: Date;
  dayRateBudget: number | null;
}

/** Rate benchmark data for scoring (maps to RateBenchmark schema fields) */
export interface MatchBenchmark {
  vesselType: VesselType;
  regionId: string;
  minRate: number;
  medianRate: number;
  maxRate: number;
}

/** Tunable weights — must sum to 1.0 */
export interface MatchWeights {
  distance: number;
  rateFit: number;
  capabilityMargin: number;
}

/** Per-factor score breakdown (each 0–100) */
export interface FactorBreakdown {
  distance: number;
  rateFit: number;
  capabilityMargin: number;
}

/** Single result in the ranked shortlist */
export interface MatchResult {
  vesselId: string;
  vesselName: string;
  score: number;        // 0–100, composite weighted score
  factors: FactorBreakdown;
  rank: number;         // 1-based, 1 = best
}

/** Default weights per SPEC-001 §4.6 */
export const DEFAULT_WEIGHTS: MatchWeights = {
  distance: 0.40,
  rateFit: 0.35,
  capabilityMargin: 0.25,
} as const;
