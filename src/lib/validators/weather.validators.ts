// Zod validation schemas for Weather API boundaries

import { z } from 'zod';

/**
 * A required coordinate query param.
 * Coordinates arrive as strings from URLSearchParams. We REQUIRE a non-empty string
 * BEFORE coercion — a bare `z.coerce.number()` coerces `null` (missing) and `""` (`?lat=`)
 * to `0`, so a request missing `lat` would silently validate as `lat: 0`. `.finite()`
 * rejects NaN/Infinity from non-numeric input like `?lat=abc`.
 */
const requiredCoordParam = (min: number, max: number) =>
  z.string().trim().min(1).pipe(z.coerce.number().finite().min(min).max(max));

/** GET /api/weather/marine query params */
export const WeatherQuerySchema = z.object({
  lat: requiredCoordParam(-90, 90),
  lng: requiredCoordParam(-180, 180),
});

export type WeatherQuery = z.infer<typeof WeatherQuerySchema>;

/**
 * Validates the shape of the Open-Meteo Marine API response (external data boundary).
 * We request `current` conditions (not `hourly`), so the payload carries a single
 * `current` object — never trust this external data with `as Type`.
 */
export const OpenMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    time: z.string(),
    wave_height: z.number().nullable(),
    swell_wave_height: z.number().nullable(),
    wind_wave_height: z.number().nullable(),
  }),
});

export type OpenMeteoResponse = z.infer<typeof OpenMeteoResponseSchema>;

/** Workability verdict union — discriminates sea-state fitness for offshore ops */
export const WorkabilityVerdictSchema = z.enum([
  'WORKABLE',
  'MARGINAL',
  'NOT_WORKABLE',
]);

export type WorkabilityVerdict = z.infer<typeof WorkabilityVerdictSchema>;

/** Response shape for a persisted or computed weather snapshot */
export const WeatherSnapshotResponseSchema = z.object({
  id: z.string().cuid().optional(), // absent for ad-hoc (non-persisted) lookups
  fixtureId: z.string().cuid().nullable(), // always present; null for ad-hoc, a CUID when persisted
  lat: z.number(),
  lng: z.number(),
  waveHeightM: z.number(),
  swellHeightM: z.number().nullable(),
  windWaveHeightM: z.number().nullable(),
  workabilityVerdict: WorkabilityVerdictSchema,
  laycanFrom: z.coerce.date().nullable(),
  laycanTo: z.coerce.date().nullable(),
  fetchedAt: z.coerce.date(),
});

export type WeatherSnapshotResponse = z.infer<typeof WeatherSnapshotResponseSchema>;

/** POST /api/fixtures/:id/weather request body — required; lat/lng mandatory, laycan optional */
export const FixtureWeatherRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  laycanFrom: z.coerce.date().optional(),
  laycanTo: z.coerce.date().optional(),
});

export type FixtureWeatherRequest = z.infer<typeof FixtureWeatherRequestSchema>;
