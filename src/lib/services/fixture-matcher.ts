// FixtureMatcher service — pure two-stage scoring engine (hard filters → weighted scoring)

import { haversineNm } from '@/lib/utils/haversine';
import { dpClassMeetsMinimum, dpClassHeadroom } from '@/lib/utils/dp-class';
import { DEFAULT_WEIGHTS } from './fixture-matcher.types';
import type {
  MatchCandidate,
  MatchRequirement,
  MatchBenchmark,
  MatchWeights,
  MatchResult,
  FactorBreakdown,
} from './fixture-matcher.types';

// ---------------------------------------------------------------------------
// Stage 1 — Hard filter
// ---------------------------------------------------------------------------

function passesHardFilters(
  candidate: MatchCandidate,
  requirement: MatchRequirement,
): boolean {
  if (candidate.vesselType !== requirement.vesselTypeNeeded) return false;
  if (candidate.status !== 'OPEN') return false;
  if (candidate.openDate !== null && candidate.openDate > requirement.startDate) return false;
  if (candidate.openRegionId !== requirement.regionId) return false;

  if (requirement.minDeckAreaM2 !== null) {
    if (candidate.deckAreaM2 === null || candidate.deckAreaM2 < requirement.minDeckAreaM2) {
      return false;
    }
  }

  if (requirement.minBollardPullT !== null) {
    if (candidate.bollardPullT === null || candidate.bollardPullT < requirement.minBollardPullT) {
      return false;
    }
  }

  if (requirement.minDpClass !== null) {
    if (!dpClassMeetsMinimum(candidate.dpClass, requirement.minDpClass)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Stage 2 — Scoring helpers
// ---------------------------------------------------------------------------

function scoreDistance(
  candidate: MatchCandidate,
  maxDistance: number,
  requirement: MatchRequirement,
): number {
  if (candidate.positionLat === null || candidate.positionLng === null) return 0;
  if (maxDistance === 0) return 1;
  const dist = haversineNm(
    candidate.positionLat,
    candidate.positionLng,
    requirement.regionCenterLat,
    requirement.regionCenterLng,
  );
  return 1 - dist / maxDistance;
}

function scoreRateFit(
  requirement: MatchRequirement,
  benchmark: MatchBenchmark | undefined,
): number {
  if (requirement.dayRateBudget === null || benchmark === undefined) return 0.5;
  if (benchmark.maxRate === benchmark.minRate) return 0.5;
  const raw = (requirement.dayRateBudget - benchmark.minRate) / (benchmark.maxRate - benchmark.minRate);
  return Math.max(0, Math.min(1, raw));
}

function scoreCapability(
  candidate: MatchCandidate,
  requirement: MatchRequirement,
): number {
  const dimensions: number[] = [];

  if (requirement.minDeckAreaM2 !== null && candidate.deckAreaM2 !== null) {
    const margin = (candidate.deckAreaM2 - requirement.minDeckAreaM2) / requirement.minDeckAreaM2;
    dimensions.push(Math.min(margin, 1));
  }

  if (requirement.minBollardPullT !== null && candidate.bollardPullT !== null) {
    const margin = (candidate.bollardPullT - requirement.minBollardPullT) / requirement.minBollardPullT;
    dimensions.push(Math.min(margin, 1));
  }

  if (requirement.minDpClass !== null) {
    dimensions.push(dpClassHeadroom(candidate.dpClass, requirement.minDpClass));
  }

  if (dimensions.length === 0) return 0.5;
  const sum = dimensions.reduce((acc, v) => acc + v, 0);
  return sum / dimensions.length;
}

// ---------------------------------------------------------------------------
// Distance max pre-compute
// ---------------------------------------------------------------------------

function computeMaxDistance(
  passed: ReadonlyArray<MatchCandidate>,
  requirement: MatchRequirement,
): number {
  if (passed.length <= 1) return 0;
  let max = 0;
  for (const c of passed) {
    if (c.positionLat === null || c.positionLng === null) continue;
    const d = haversineNm(
      c.positionLat,
      c.positionLng,
      requirement.regionCenterLat,
      requirement.regionCenterLng,
    );
    if (d > max) max = d;
  }
  return max;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Matches candidate vessels against a requirement.
 * Stage 1: hard filters (type, availability, region, capabilities).
 * Stage 2: weighted scoring (distance, rate fit, capability margin).
 * Pure function — no I/O, no DB, deterministic for identical inputs.
 */
export function match(
  requirement: MatchRequirement,
  candidates: ReadonlyArray<MatchCandidate>,
  benchmarks?: ReadonlyArray<MatchBenchmark>,
  weights?: MatchWeights,
): MatchResult[] {
  const w = weights ?? DEFAULT_WEIGHTS;

  const passed = candidates.filter(c => passesHardFilters(c, requirement));
  if (passed.length === 0) return [];

  const benchmark = benchmarks?.find(
    b => b.vesselType === requirement.vesselTypeNeeded && b.regionId === requirement.regionId,
  );

  const maxDist = computeMaxDistance(passed, requirement);

  const scored = passed.map((candidate): MatchResult => {
    const dScore = scoreDistance(candidate, maxDist, requirement);
    const rScore = scoreRateFit(requirement, benchmark);
    const cScore = scoreCapability(candidate, requirement);

    const compositeRaw = dScore * w.distance + rScore * w.rateFit + cScore * w.capabilityMargin;
    const score = Math.round(compositeRaw * 100);

    const factors: FactorBreakdown = {
      distance: Math.round(dScore * 100),
      rateFit: Math.round(rScore * 100),
      capabilityMargin: Math.round(cScore * 100),
    };

    return { vesselId: candidate.id, vesselName: candidate.name, score, factors, rank: 0 };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.vesselName.localeCompare(b.vesselName);
  });

  return scored.map((r, i) => ({ ...r, rank: i + 1 }));
}
