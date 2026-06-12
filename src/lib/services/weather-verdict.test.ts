// Tests for computeVerdict — workability verdict from marine weather readings

import { describe, it, expect } from 'vitest';
import { computeVerdict, NORTH_SEA_THRESHOLDS } from './weather-verdict';
import type { WorkabilityThresholds } from './weather-enricher.types';

describe('computeVerdict', () => {
  it('1: calm seas — well within WORKABLE', () => {
    expect(
      computeVerdict({ waveHeightM: 1.0, swellHeightM: 1.0, windWaveHeightM: 0.5 }),
    ).toBe('WORKABLE');
  });

  it('2: wave at WORKABLE boundary (just under 2.0)', () => {
    expect(
      computeVerdict({ waveHeightM: 1.99, swellHeightM: 2.0, windWaveHeightM: null }),
    ).toBe('WORKABLE');
  });

  it('3: wave WORKABLE, swell in MARGINAL range', () => {
    expect(
      computeVerdict({ waveHeightM: 1.5, swellHeightM: 3.0, windWaveHeightM: 1.0 }),
    ).toBe('MARGINAL');
  });

  it('4: wave MARGINAL, swell null', () => {
    expect(
      computeVerdict({ waveHeightM: 2.5, swellHeightM: null, windWaveHeightM: null }),
    ).toBe('MARGINAL');
  });

  it('5: wave MARGINAL, swell WORKABLE', () => {
    expect(
      computeVerdict({ waveHeightM: 2.5, swellHeightM: 2.0, windWaveHeightM: 0.8 }),
    ).toBe('MARGINAL');
  });

  it('6: wave MARGINAL, swell above MARGINAL threshold', () => {
    expect(
      computeVerdict({ waveHeightM: 2.5, swellHeightM: 4.5, windWaveHeightM: 2.0 }),
    ).toBe('NOT_WORKABLE');
  });

  it('7: wave above MARGINAL threshold', () => {
    expect(
      computeVerdict({ waveHeightM: 3.5, swellHeightM: 1.0, windWaveHeightM: 0.5 }),
    ).toBe('NOT_WORKABLE');
  });

  it('8: extreme conditions', () => {
    expect(
      computeVerdict({ waveHeightM: 6.0, swellHeightM: 5.0, windWaveHeightM: 4.0 }),
    ).toBe('NOT_WORKABLE');
  });

  it('9: null swell with WORKABLE wave', () => {
    expect(
      computeVerdict({ waveHeightM: 1.5, swellHeightM: null, windWaveHeightM: null }),
    ).toBe('WORKABLE');
  });

  it('10: null swell with MARGINAL wave', () => {
    expect(
      computeVerdict({ waveHeightM: 2.8, swellHeightM: null, windWaveHeightM: 0.5 }),
    ).toBe('MARGINAL');
  });

  it('11: exact WORKABLE boundary (wave = 2.0) → MARGINAL (strict <)', () => {
    expect(
      computeVerdict({ waveHeightM: 2.0, swellHeightM: 1.0, windWaveHeightM: null }),
    ).toBe('MARGINAL');
  });

  it('12: exact MARGINAL boundary (wave = 3.0) → NOT_WORKABLE (strict <)', () => {
    expect(
      computeVerdict({ waveHeightM: 3.0, swellHeightM: 1.0, windWaveHeightM: null }),
    ).toBe('NOT_WORKABLE');
  });

  it('13: custom thresholds override North Sea defaults', () => {
    const custom: WorkabilityThresholds = {
      workable: { maxWaveHeightM: 1.0, maxSwellHeightM: 1.5 },
      marginal: { maxWaveHeightM: 2.0, maxSwellHeightM: 3.0 },
    };
    // wave: 1.5 >= custom workable 1.0, so falls to marginal branch; < 2.0 → MARGINAL
    // But swell is null → MARGINAL
    expect(
      computeVerdict({ waveHeightM: 1.5, swellHeightM: null, windWaveHeightM: null }, custom),
    ).toBe('MARGINAL');

    // wave: 1.5 >= custom workable 1.0, >= custom marginal 2.0? No (1.5 < 2.0) → still MARGINAL
    // Make wave exceed custom marginal to hit NOT_WORKABLE
    expect(
      computeVerdict({ waveHeightM: 2.5, swellHeightM: null, windWaveHeightM: null }, custom),
    ).toBe('NOT_WORKABLE');
  });

  it('14: wind-wave does not affect verdict', () => {
    expect(
      computeVerdict({ waveHeightM: 1.0, swellHeightM: 1.0, windWaveHeightM: 10.0 }),
    ).toBe('WORKABLE');
  });

  it('swell in WORKABLE range with WORKABLE wave — border swell null path (NOT_WORKABLE via swell)', () => {
    // wave WORKABLE, swell >= marginal.maxSwellHeightM → NOT_WORKABLE
    expect(
      computeVerdict({ waveHeightM: 1.5, swellHeightM: 4.5, windWaveHeightM: null }),
    ).toBe('NOT_WORKABLE');
  });

  it('exports NORTH_SEA_THRESHOLDS with correct values', () => {
    expect(NORTH_SEA_THRESHOLDS.workable.maxWaveHeightM).toBe(2.0);
    expect(NORTH_SEA_THRESHOLDS.workable.maxSwellHeightM).toBe(2.5);
    expect(NORTH_SEA_THRESHOLDS.marginal.maxWaveHeightM).toBe(3.0);
    expect(NORTH_SEA_THRESHOLDS.marginal.maxSwellHeightM).toBe(4.0);
  });
});
