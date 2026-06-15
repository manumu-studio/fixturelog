// logoPaths.ts — SVG paths measured from public/assets/assets/logo-white.webp.

/** Normalized viewBox for the FixtureLog circular monogram mark. */
export const LOGO_VIEWBOX = { width: 100, height: 100 } as const;

/**
 * Circle plus inner monogram strokes (left and right legs to center).
 * Coordinates mapped from the 500×500 source asset (÷5 → 100×100 viewBox).
 */
export const LOGO_STROKE_PATHS = [
  'M 50 20 A 30 30 0 1 1 49.99 20',
  'M 37.3 58 L 37.3 40 L 50 50.26',
  'M 62.4 58 L 62.4 40 L 50 50.26',
] as const;
