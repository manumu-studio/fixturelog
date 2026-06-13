// Pure workability verdict logic — North Sea thresholds + computeVerdict function

import type { WorkabilityThresholds } from './weather-enricher.types';
import type { WorkabilityVerdict } from '../validators/weather.validators';

/**
 * North Sea offshore workability thresholds.
 * Based on typical PSV/AHTS operational limits for cargo operations.
 * Source: industry standard for North Sea operations.
 */
export const NORTH_SEA_THRESHOLDS: WorkabilityThresholds = {
  workable: {
    maxWaveHeightM: 2.0,
    maxSwellHeightM: 2.5,
  },
  marginal: {
    maxWaveHeightM: 3.0,
    maxSwellHeightM: 4.0,
  },
} as const;

export interface WeatherReadings {
  waveHeightM: number;
  swellHeightM: number | null;
  windWaveHeightM: number | null;
}

/**
 * Computes a workability verdict from marine weather readings.
 * Pure function — no I/O, no side effects.
 */
export function computeVerdict(
  readings: WeatherReadings,
  thresholds?: WorkabilityThresholds,
): WorkabilityVerdict {
  const t = thresholds ?? NORTH_SEA_THRESHOLDS;
  const { waveHeightM, swellHeightM } = readings;

  if (waveHeightM < t.workable.maxWaveHeightM) {
    if (swellHeightM === null || swellHeightM < t.workable.maxSwellHeightM) {
      return 'WORKABLE';
    }
    if (swellHeightM < t.marginal.maxSwellHeightM) {
      return 'MARGINAL';
    }
    return 'NOT_WORKABLE';
  }

  if (waveHeightM < t.marginal.maxWaveHeightM) {
    if (swellHeightM === null || swellHeightM < t.marginal.maxSwellHeightM) {
      return 'MARGINAL';
    }
    return 'NOT_WORKABLE';
  }

  return 'NOT_WORKABLE';
}
