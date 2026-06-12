// Open-Meteo fetch, in-memory cache, and workability verdict for marine weather enrichment

import { OpenMeteoResponseSchema } from '@/lib/validators/weather.validators';
import { computeVerdict } from './weather-verdict';
import type { WeatherEnrichmentResult, WeatherCacheConfig, CachedWeatherEntry } from './weather-enricher.types';

/** Module-level in-memory cache — singleton per server process */
const weatherCache = new Map<string, CachedWeatherEntry>();

const DEFAULT_TTL_MS = 300_000; // 5 minutes

/**
 * Fetches marine weather from Open-Meteo, applies verdict, caches result.
 * Does NOT persist — caller decides whether to save a snapshot.
 */
export async function fetchMarineWeather(
  lat: number,
  lng: number,
  config?: Partial<WeatherCacheConfig>,
): Promise<WeatherEnrichmentResult> {
  const ttlMs = config?.ttlMs ?? DEFAULT_TTL_MS;
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;

  const cached = weatherCache.get(cacheKey);
  if (cached !== undefined && Date.now() - cached.fetchedAt.getTime() <= ttlMs) {
    return {
      lat,
      lng,
      waveHeightM: cached.waveHeightM,
      swellHeightM: cached.swellHeightM,
      windWaveHeightM: cached.windWaveHeightM,
      workabilityVerdict: cached.verdict,
      fetchedAt: cached.fetchedAt,
      fromCache: true,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, 10_000);

  let response: Response;
  try {
    const url =
      `https://marine-api.open-meteo.com/v1/marine` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=wave_height,swell_wave_height,wind_wave_height` +
      `&cell_selection=sea`;

    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Open-Meteo returned non-2xx status: ${response.status}`);
  }

  const raw: unknown = await response.json();
  const parsed = OpenMeteoResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Open-Meteo response validation failed: ${parsed.error.message}`);
  }

  const { current } = parsed.data;
  const waveHeightM = current.wave_height ?? 0.0;
  const swellHeightM = current.swell_wave_height;
  const windWaveHeightM = current.wind_wave_height;

  const workabilityVerdict = computeVerdict({ waveHeightM, swellHeightM, windWaveHeightM });
  const fetchedAt = new Date();

  const entry: CachedWeatherEntry = {
    waveHeightM,
    swellHeightM,
    windWaveHeightM,
    verdict: workabilityVerdict,
    fetchedAt,
  };
  weatherCache.set(cacheKey, entry);

  return {
    lat,
    lng,
    waveHeightM,
    swellHeightM,
    windWaveHeightM,
    workabilityVerdict,
    fetchedAt,
    fromCache: false,
  };
}

/**
 * Clears the in-memory weather cache.
 * Exposed for testing — allows tests to reset cache state between runs.
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
}
