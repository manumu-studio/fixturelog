// Test suite for FixtureMatcher service — hard filters, scoring, edge cases, and determinism

import { describe, expect, it } from 'vitest';
import { match } from './fixture-matcher';
import { DEFAULT_WEIGHTS } from './fixture-matcher.types';
import type { MatchCandidate, MatchRequirement, MatchBenchmark } from './fixture-matcher.types';

// ---------------------------------------------------------------------------
// Factory helpers — sensible defaults, override only what each test needs
// ---------------------------------------------------------------------------

function makeRequirement(overrides: Partial<MatchRequirement> = {}): MatchRequirement {
  return {
    vesselTypeNeeded: 'PSV',
    regionId: 'NORTH_SEA',
    regionCenterLat: 57.0,
    regionCenterLng: 2.0,
    minDeckAreaM2: null,
    minBollardPullT: null,
    minDpClass: null,
    startDate: new Date('2026-07-01'),
    dayRateBudget: null,
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<MatchCandidate> & { name?: string } = {}): MatchCandidate {
  return {
    id: overrides.name ?? 'vessel-1',
    name: overrides.name ?? 'Test Vessel',
    vesselType: 'PSV',
    status: 'OPEN',
    dpClass: 'DP2',
    deckAreaM2: 600,
    bollardPullT: 100,
    openDate: null,
    openRegionId: 'NORTH_SEA',
    positionLat: 57.5,
    positionLng: 2.5,
    ...overrides,
  };
}

function makeBenchmark(overrides: Partial<MatchBenchmark> = {}): MatchBenchmark {
  return {
    vesselType: 'PSV',
    regionId: 'NORTH_SEA',
    minRate: 10_000,
    medianRate: 15_000,
    maxRate: 20_000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Group 1: Hard filter tests (12 tests)
// ---------------------------------------------------------------------------

describe('FixtureMatcher — hard filters', () => {
  it('excludes candidate with wrong vessel type', () => {
    const req = makeRequirement({ vesselTypeNeeded: 'PSV' });
    const candidate = makeCandidate({ vesselType: 'AHTS' });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('includes candidate with correct vessel type and all filters passing', () => {
    const req = makeRequirement({ vesselTypeNeeded: 'PSV' });
    const candidate = makeCandidate({ vesselType: 'PSV' });
    expect(match(req, [candidate])).toHaveLength(1);
  });

  it('excludes candidate with status ON_HIRE (not OPEN)', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({ status: 'ON_HIRE' });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('excludes candidate with status YARD', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({ status: 'YARD' });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('excludes candidate with status LAID_UP', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({ status: 'LAID_UP' });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('excludes candidate OPEN with openDate after requirement startDate', () => {
    const startDate = new Date('2026-07-01');
    const openDate = new Date('2026-08-01');
    const req = makeRequirement({ startDate });
    const candidate = makeCandidate({ status: 'OPEN', openDate });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('includes candidate OPEN with openDate before startDate', () => {
    const startDate = new Date('2026-07-01');
    const openDate = new Date('2026-06-01');
    const req = makeRequirement({ startDate });
    const candidate = makeCandidate({ status: 'OPEN', openDate });
    expect(match(req, [candidate])).toHaveLength(1);
  });

  it('includes candidate OPEN with openDate equal to startDate', () => {
    const startDate = new Date('2026-07-01');
    const req = makeRequirement({ startDate });
    const candidate = makeCandidate({ status: 'OPEN', openDate: new Date('2026-07-01') });
    expect(match(req, [candidate])).toHaveLength(1);
  });

  it('includes candidate OPEN with null openDate (available immediately)', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({ status: 'OPEN', openDate: null });
    expect(match(req, [candidate])).toHaveLength(1);
  });

  it('excludes candidate with wrong region', () => {
    const req = makeRequirement({ regionId: 'NORTH_SEA' });
    const candidate = makeCandidate({ openRegionId: 'GULF_OF_MEXICO' });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('excludes candidate with null deck area when minimum required', () => {
    const req = makeRequirement({ minDeckAreaM2: 500 });
    const candidate = makeCandidate({ deckAreaM2: null });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('excludes candidate with deck area below minimum', () => {
    const req = makeRequirement({ minDeckAreaM2: 500 });
    const candidate = makeCandidate({ deckAreaM2: 400 });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('includes candidate with deck area above minimum', () => {
    const req = makeRequirement({ minDeckAreaM2: 500 });
    const candidate = makeCandidate({ deckAreaM2: 700 });
    expect(match(req, [candidate])).toHaveLength(1);
  });

  it('skips deck area filter when requirement minimum is null (any value passes)', () => {
    const req = makeRequirement({ minDeckAreaM2: null });
    const candidate = makeCandidate({ deckAreaM2: null });
    expect(match(req, [candidate])).toHaveLength(1);
  });

  it('excludes candidate with null bollard pull when minimum required', () => {
    const req = makeRequirement({ minBollardPullT: 80 });
    const candidate = makeCandidate({ bollardPullT: null });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('excludes candidate with bollard pull below minimum', () => {
    const req = makeRequirement({ minBollardPullT: 100 });
    const candidate = makeCandidate({ bollardPullT: 50 });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('includes candidate with bollard pull above minimum', () => {
    const req = makeRequirement({ minBollardPullT: 80 });
    const candidate = makeCandidate({ bollardPullT: 150 });
    expect(match(req, [candidate])).toHaveLength(1);
  });

  it('excludes candidate with DP class below minimum', () => {
    const req = makeRequirement({ minDpClass: 'DP2' });
    const candidate = makeCandidate({ dpClass: 'DP1' });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('includes candidate with DP class meeting minimum', () => {
    const req = makeRequirement({ minDpClass: 'DP2' });
    const candidate = makeCandidate({ dpClass: 'DP2' });
    expect(match(req, [candidate])).toHaveLength(1);
  });

  it('includes candidate with DP class exceeding minimum', () => {
    const req = makeRequirement({ minDpClass: 'DP1' });
    const candidate = makeCandidate({ dpClass: 'DP3' });
    expect(match(req, [candidate])).toHaveLength(1);
  });

  it('no capability minimums set — all capability filters pass', () => {
    const req = makeRequirement({ minDeckAreaM2: null, minBollardPullT: null, minDpClass: null });
    const candidate = makeCandidate({ deckAreaM2: null, bollardPullT: null, dpClass: 'NONE' });
    expect(match(req, [candidate])).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Group 2: Scoring tests (16 tests)
// ---------------------------------------------------------------------------

describe('FixtureMatcher — scoring', () => {
  it('closer vessel scores higher than farther vessel on distance factor', () => {
    const req = makeRequirement({ regionCenterLat: 57.0, regionCenterLng: 2.0 });
    const near = makeCandidate({ name: 'Near', positionLat: 57.1, positionLng: 2.1 });
    const far  = makeCandidate({ name: 'Far Vessel', positionLat: 60.0, positionLng: 5.0 });
    const results = match(req, [near, far]);
    expect(results[0]?.vesselName).toBe(near.name);
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });

  it('candidate with null position gets distance factor score 0', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({ positionLat: null, positionLng: null });
    const [result] = match(req, [candidate]);
    expect(result?.factors.distance).toBe(0);
  });

  it('single candidate that passes gets distance factor 100', () => {
    const req = makeRequirement({ regionCenterLat: 57.0, regionCenterLng: 2.0 });
    const c = makeCandidate({ positionLat: 60.0, positionLng: 5.0 });
    const [result] = match(req, [c]);
    expect(result?.factors.distance).toBe(100);
  });

  it('all candidates at same position all receive distance factor 100', () => {
    const req = makeRequirement({ regionCenterLat: 57.0, regionCenterLng: 2.0 });
    const a = makeCandidate({ name: 'A', positionLat: 57.0, positionLng: 2.0 });
    const b = makeCandidate({ name: 'B', positionLat: 57.0, positionLng: 2.0 });
    const results = match(req, [a, b]);
    expect(results.every(r => r.factors.distance === 100)).toBe(true);
  });

  it('rateFit: budget >= maxRate → factor score 100', () => {
    const req = makeRequirement({ dayRateBudget: 20_000 });
    const candidate = makeCandidate({});
    const benchmark = makeBenchmark({ minRate: 10_000, medianRate: 15_000, maxRate: 18_000 });
    const [result] = match(req, [candidate], [benchmark]);
    expect(result?.factors.rateFit).toBe(100);
  });

  it('rateFit: budget <= minRate → factor score 0', () => {
    const req = makeRequirement({ dayRateBudget: 9_000 });
    const candidate = makeCandidate({});
    const benchmark = makeBenchmark({ minRate: 10_000, medianRate: 15_000, maxRate: 18_000 });
    const [result] = match(req, [candidate], [benchmark]);
    expect(result?.factors.rateFit).toBe(0);
  });

  it('rateFit: budget at exactly minRate → factor score 0', () => {
    const req = makeRequirement({ dayRateBudget: 10_000 });
    const candidate = makeCandidate({});
    const benchmark = makeBenchmark({ minRate: 10_000, medianRate: 15_000, maxRate: 20_000 });
    const [result] = match(req, [candidate], [benchmark]);
    expect(result?.factors.rateFit).toBe(0);
  });

  it('rateFit: no budget → factor score 50 (neutral)', () => {
    const req = makeRequirement({ dayRateBudget: null });
    const candidate = makeCandidate({});
    const benchmark = makeBenchmark({});
    const [result] = match(req, [candidate], [benchmark]);
    expect(result?.factors.rateFit).toBe(50);
  });

  it('rateFit: budget present but no benchmark → factor score 50 (neutral, NOT 100)', () => {
    const req = makeRequirement({ dayRateBudget: 20_000 });
    const candidate = makeCandidate({});
    const [result] = match(req, [candidate]);
    expect(result?.factors.rateFit).toBe(50);
  });

  it('rateFit: degenerate range (minRate === maxRate) → factor score 50 (division-by-zero guard)', () => {
    const req = makeRequirement({ dayRateBudget: 15_000 });
    const candidate = makeCandidate({});
    const benchmark = makeBenchmark({ minRate: 15_000, medianRate: 15_000, maxRate: 15_000 });
    const [result] = match(req, [candidate], [benchmark]);
    expect(result?.factors.rateFit).toBe(50);
  });

  it('rateFit: all candidates of same type in same region receive identical rateFit value', () => {
    const req = makeRequirement({ dayRateBudget: 14_000 });
    const a = makeCandidate({ name: 'A' });
    const b = makeCandidate({ name: 'B' });
    const benchmark = makeBenchmark({ minRate: 10_000, medianRate: 15_000, maxRate: 18_000 });
    const results = match(req, [a, b], [benchmark]);
    expect(results[0]?.factors.rateFit).toBe(results[1]?.factors.rateFit);
  });

  it('capability: candidate exactly at minimum gets headroom factor 0', () => {
    const req = makeRequirement({ minDeckAreaM2: 500, minBollardPullT: null, minDpClass: null });
    const candidate = makeCandidate({ deckAreaM2: 500 });
    const [result] = match(req, [candidate]);
    expect(result?.factors.capabilityMargin).toBe(0);
  });

  it('capability: no capability requirements → factor score 50 (neutral)', () => {
    const req = makeRequirement({ minDeckAreaM2: null, minBollardPullT: null, minDpClass: null });
    const candidate = makeCandidate({ deckAreaM2: null, bollardPullT: null });
    const [result] = match(req, [candidate]);
    expect(result?.factors.capabilityMargin).toBe(50);
  });

  it('capability: 2x deck area minimum → headroom capped at 1.0 → factor score 100', () => {
    const req = makeRequirement({ minDeckAreaM2: 500, minBollardPullT: null, minDpClass: null });
    const candidate = makeCandidate({ deckAreaM2: 1000 });
    const [result] = match(req, [candidate]);
    expect(result?.factors.capabilityMargin).toBe(100);
  });

  it('weight tuning: increasing distance weight promotes closer vessel above farther one', () => {
    const req = makeRequirement({ regionCenterLat: 57.0, regionCenterLng: 2.0 });
    const near = makeCandidate({ name: 'Near', positionLat: 57.1, positionLng: 2.1 });
    const far  = makeCandidate({ name: 'Far',  positionLat: 62.0, positionLng: 8.0 });
    const highDistanceWeights = { distance: 0.90, rateFit: 0.05, capabilityMargin: 0.05 };
    const results = match(req, [near, far], undefined, highDistanceWeights);
    expect(results[0]?.vesselName).toBe('Near');
  });

  // Rank-flip fixture: Near is closest but sits exactly at deck-area minimum (capability=0).
  // Far is the farthest (distance=0) but has 2x deck area (capability=1.0).
  // No benchmark → rateFit=0.5 uniform (cancels out). Ordering driven by distance vs capability.
  it('weight tuning flips rank order for candidates with opposing factor tradeoffs', () => {
    const req = makeRequirement({
      regionCenterLat: 57.0,
      regionCenterLng: 2.0,
      minDeckAreaM2: 500,
      minBollardPullT: null,
      minDpClass: null,
    });
    const near = makeCandidate({ name: 'Near', positionLat: 57.1, positionLng: 2.1, deckAreaM2: 500 });
    const far  = makeCandidate({ name: 'Far',  positionLat: 62.0, positionLng: 8.0, deckAreaM2: 1000 });

    // Distance-favouring weights → the close-but-minimal vessel ranks first.
    const distanceFirst = match(req, [near, far], undefined, {
      distance: 0.80, rateFit: 0.10, capabilityMargin: 0.10,
    });
    expect(distanceFirst[0]?.vesselName).toBe('Near');
    expect(distanceFirst[1]?.vesselName).toBe('Far');

    // Capability-favouring weights → the order FLIPS; the far-but-capable vessel ranks first.
    const capabilityFirst = match(req, [near, far], undefined, {
      distance: 0.10, rateFit: 0.10, capabilityMargin: 0.80,
    });
    expect(capabilityFirst[0]?.vesselName).toBe('Far');
    expect(capabilityFirst[1]?.vesselName).toBe('Near');
  });

  it('composite score is within 0–100 range', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({});
    const [result] = match(req, [candidate]);
    expect(result?.score).toBeGreaterThanOrEqual(0);
    expect(result?.score).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// Group 3: Edge cases and determinism (12 tests)
// ---------------------------------------------------------------------------

describe('FixtureMatcher — edge cases and determinism', () => {
  it('returns empty array for empty candidate input', () => {
    const req = makeRequirement({});
    expect(match(req, [])).toEqual([]);
  });

  it('returns empty array when no candidates pass hard filters', () => {
    const req = makeRequirement({ vesselTypeNeeded: 'PSV' });
    const candidate = makeCandidate({ vesselType: 'AHTS' });
    expect(match(req, [candidate])).toEqual([]);
  });

  it('single candidate that passes gets rank 1', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({});
    const [result] = match(req, [candidate]);
    expect(result?.rank).toBe(1);
  });

  it('ranks are 1-based and sequential', () => {
    const req = makeRequirement({ regionCenterLat: 57.0, regionCenterLng: 2.0 });
    const a = makeCandidate({ name: 'A', positionLat: 57.1, positionLng: 2.1 });
    const b = makeCandidate({ name: 'B', positionLat: 60.0, positionLng: 5.0 });
    const c = makeCandidate({ name: 'C', positionLat: 62.0, positionLng: 8.0 });
    const results = match(req, [a, b, c]);
    expect(results.map(r => r.rank)).toEqual([1, 2, 3]);
  });

  it('tie-breaking: same composite score sorted by vesselName ascending', () => {
    const req = makeRequirement({ regionCenterLat: 57.0, regionCenterLng: 2.0 });
    const alpha = makeCandidate({ name: 'Zeta', positionLat: 57.0, positionLng: 2.0 });
    const beta  = makeCandidate({ name: 'Alpha', positionLat: 57.0, positionLng: 2.0 });
    const results = match(req, [alpha, beta]);
    expect(results[0]?.vesselName).toBe('Alpha');
    expect(results[1]?.vesselName).toBe('Zeta');
  });

  it('determinism: same inputs produce identical output on repeated calls', () => {
    const req = makeRequirement({});
    const candidates = [makeCandidate({ name: 'A' }), makeCandidate({ name: 'B' })];
    const first  = match(req, candidates);
    const second = match(req, candidates);
    expect(first).toEqual(second);
  });

  it('factor breakdown sums correctly to composite: Math.round((d*wd + r*wr + c*wc) * 100) === score', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({});
    const [result] = match(req, [candidate], undefined, DEFAULT_WEIGHTS);
    if (!result) return;
    const { distance: d, rateFit: r, capabilityMargin: c } = result.factors;
    const { distance: wd, rateFit: wr, capabilityMargin: wc } = DEFAULT_WEIGHTS;
    const expected = Math.round(((d / 100) * wd + (r / 100) * wr + (c / 100) * wc) * 100);
    expect(result.score).toBe(expected);
  });

  it('per-factor breakdown values are each 0–100 integers', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({});
    const [result] = match(req, [candidate]);
    if (!result) return;
    for (const val of Object.values(result.factors)) {
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });

  it('custom weights applied correctly — non-default weights change scores vs default', () => {
    const req = makeRequirement({ regionCenterLat: 57.0, regionCenterLng: 2.0 });
    const near = makeCandidate({ name: 'Near', positionLat: 57.0, positionLng: 2.0 });
    const far  = makeCandidate({ name: 'Far',  positionLat: 65.0, positionLng: 15.0 });
    const defaultResults = match(req, [near, far]);
    const altWeights = { distance: 0.10, rateFit: 0.80, capabilityMargin: 0.10 };
    const altResults = match(req, [near, far], undefined, altWeights);
    expect(defaultResults[0]?.score).not.toBe(altResults[0]?.score);
  });

  it('candidate with all null capabilities and no capability requirements passes and gets 0.5 capability score', () => {
    const req = makeRequirement({ minDeckAreaM2: null, minBollardPullT: null, minDpClass: null });
    const candidate = makeCandidate({ deckAreaM2: null, bollardPullT: null });
    const [result] = match(req, [candidate]);
    expect(result).toBeDefined();
    expect(result?.factors.capabilityMargin).toBe(50);
  });

  it('benchmark from different region is not used (no benchmark match → rateFit 50)', () => {
    const req = makeRequirement({ regionId: 'NORTH_SEA', dayRateBudget: 20_000 });
    const candidate = makeCandidate({ openRegionId: 'NORTH_SEA' });
    const wrongBenchmark = makeBenchmark({ regionId: 'GULF_OF_MEXICO' });
    const [result] = match(req, [candidate], [wrongBenchmark]);
    expect(result?.factors.rateFit).toBe(50);
  });

  it('benchmark from different vessel type is not used (no benchmark match → rateFit 50)', () => {
    const req = makeRequirement({ vesselTypeNeeded: 'PSV', dayRateBudget: 20_000 });
    const candidate = makeCandidate({ vesselType: 'PSV' });
    const wrongBenchmark = makeBenchmark({ vesselType: 'AHTS' });
    const [result] = match(req, [candidate], [wrongBenchmark]);
    expect(result?.factors.rateFit).toBe(50);
  });

  it('output contains vesselId and vesselName matching the candidate', () => {
    const req = makeRequirement({});
    const candidate = makeCandidate({ name: 'Alpha Star' });
    const [result] = match(req, [candidate]);
    expect(result?.vesselId).toBe('Alpha Star');
    expect(result?.vesselName).toBe('Alpha Star');
  });
});
