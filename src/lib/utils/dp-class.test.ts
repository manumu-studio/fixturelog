// Tests for dp-class utility — rank ordering, minimum-check boundaries, headroom values

import { describe, expect, it } from 'vitest';
import { dpClassRank, dpClassMeetsMinimum, dpClassHeadroom } from './dp-class';

describe('dpClassRank', () => {
  it('returns 0 for NONE', () => {
    expect(dpClassRank('NONE')).toBe(0);
  });

  it('returns 1 for DP1', () => {
    expect(dpClassRank('DP1')).toBe(1);
  });

  it('returns 2 for DP2', () => {
    expect(dpClassRank('DP2')).toBe(2);
  });

  it('returns 3 for DP3', () => {
    expect(dpClassRank('DP3')).toBe(3);
  });
});

describe('dpClassMeetsMinimum', () => {
  it('DP2 meets DP1 (actual above minimum)', () => {
    expect(dpClassMeetsMinimum('DP2', 'DP1')).toBe(true);
  });

  it('DP1 does not meet DP2 (actual below minimum)', () => {
    expect(dpClassMeetsMinimum('DP1', 'DP2')).toBe(false);
  });

  it('DP2 meets DP2 (exact boundary)', () => {
    expect(dpClassMeetsMinimum('DP2', 'DP2')).toBe(true);
  });

  it('NONE meets NONE (exact boundary — lowest rank)', () => {
    expect(dpClassMeetsMinimum('NONE', 'NONE')).toBe(true);
  });

  it('DP3 meets NONE (max actual, min requirement)', () => {
    expect(dpClassMeetsMinimum('DP3', 'NONE')).toBe(true);
  });

  it('NONE does not meet DP1', () => {
    expect(dpClassMeetsMinimum('NONE', 'DP1')).toBe(false);
  });

  it('NONE does not meet DP3', () => {
    expect(dpClassMeetsMinimum('NONE', 'DP3')).toBe(false);
  });

  it('DP3 meets DP3 (exact boundary — highest rank)', () => {
    expect(dpClassMeetsMinimum('DP3', 'DP3')).toBe(true);
  });
});

describe('dpClassHeadroom', () => {
  it('returns 0 for exact match (DP2 above DP2)', () => {
    expect(dpClassHeadroom('DP2', 'DP2')).toBe(0);
  });

  it('returns ~0.667 for DP3 above DP1 (2/3)', () => {
    expect(dpClassHeadroom('DP3', 'DP1')).toBeCloseTo(2 / 3, 5);
  });

  it('returns 1.0 for DP3 above NONE (full range)', () => {
    expect(dpClassHeadroom('DP3', 'NONE')).toBe(1);
  });

  it('returns 0 when actual is below minimum (clamped, not negative)', () => {
    expect(dpClassHeadroom('DP1', 'DP3')).toBe(0);
  });

  it('returns 0 for NONE above NONE', () => {
    expect(dpClassHeadroom('NONE', 'NONE')).toBe(0);
  });

  it('returns ~0.333 for DP2 above DP1 (1/3)', () => {
    expect(dpClassHeadroom('DP2', 'DP1')).toBeCloseTo(1 / 3, 5);
  });

  it('returns ~0.333 for DP1 above NONE (1/3)', () => {
    expect(dpClassHeadroom('DP1', 'NONE')).toBeCloseTo(1 / 3, 5);
  });

  it('returns ~0.667 for DP2 above NONE (2/3)', () => {
    expect(dpClassHeadroom('DP2', 'NONE')).toBeCloseTo(2 / 3, 5);
  });
});
