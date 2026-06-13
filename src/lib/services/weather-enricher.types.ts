// TypeScript interfaces for the WeatherEnricher service

import type { WorkabilityVerdict } from '../validators/weather.validators';

/** Configuration for the in-memory weather cache */
export interface WeatherCacheConfig {
  ttlMs: number; // Default: 300_000 (5 minutes)
}

/** A single cached weather entry */
export interface CachedWeatherEntry {
  waveHeightM: number;
  swellHeightM: number | null;
  windWaveHeightM: number | null;
  verdict: WorkabilityVerdict;
  fetchedAt: Date;
}

/** Result of a weather enrichment call */
export interface WeatherEnrichmentResult {
  lat: number;
  lng: number;
  waveHeightM: number;
  swellHeightM: number | null;
  windWaveHeightM: number | null;
  workabilityVerdict: WorkabilityVerdict;
  fetchedAt: Date;
  fromCache: boolean;
}

/** Threshold configuration for workability verdict computation */
export interface WorkabilityThresholds {
  workable: {
    maxWaveHeightM: number;
    maxSwellHeightM: number;
  };
  marginal: {
    maxWaveHeightM: number;
    maxSwellHeightM: number;
  };
  // Anything above marginal thresholds → NOT_WORKABLE
}
