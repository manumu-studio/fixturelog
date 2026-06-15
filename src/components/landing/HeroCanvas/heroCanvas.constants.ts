// heroCanvas.constants.ts — palette, cluster layout, and animation tuning for HeroCanvas.

import type { ClusterConfig } from './HeroCanvas.types';

export const BLUE_PALETTE = [
  '#000043',
  '#000061',
  '#001f7a',
  '#003d99',
  '#0057b8',
  '#0087cb',
  '#00a8e0',
  '#00e2fd',
] as const;

export const CLUSTERS: readonly ClusterConfig[] = [
  { cx: 0.20, cy: 0.30, count: 750, color: BLUE_PALETTE[0], label: 'North Sea' },
  { cx: 0.35, cy: 0.25, count: 700, color: BLUE_PALETTE[1], label: 'Norwegian Sea' },
  { cx: 0.55, cy: 0.20, count: 650, color: BLUE_PALETTE[2], label: 'Barents' },
  { cx: 0.70, cy: 0.35, count: 600, color: BLUE_PALETTE[3], label: 'UKCS' },
  { cx: 0.25, cy: 0.60, count: 700, color: BLUE_PALETTE[4], label: 'Central Graben' },
  { cx: 0.50, cy: 0.55, count: 650, color: BLUE_PALETTE[5], label: 'West of Shetland' },
  { cx: 0.75, cy: 0.60, count: 500, color: BLUE_PALETTE[6], label: 'Atlantic Margin' },
  { cx: 0.65, cy: 0.75, count: 450, color: BLUE_PALETTE[7], label: 'Southern North Sea' },
];

export const TOTAL_DOTS = CLUSTERS.reduce((sum, cluster) => sum + cluster.count, 0);
export const WAVE_COUNT = 3;

/** One color per stacked wave ribbon (bottom → top). */
export const WAVE_COLORS = [
  BLUE_PALETTE[1],
  BLUE_PALETTE[5],
  BLUE_PALETTE[7],
] as const;

/** Vertical center of each wave layer as a viewport height fraction. */
export const WAVE_STACK_CENTERS = [0.40, 0.48, 0.56] as const;

/** Shared swash undulation around each layer center. */
export const WAVE_SHAPE_AMP = 0.06;

export const LERP_FAST = 0.08;
export const LERP_SLOW = 0.015;
export const SNAP_THRESHOLD = 0.5;
export const OVERSHOOT_FACTOR = 1.05;
export const OVERSHOOT_SETTLE_RATIO = 0.2;
export const WAVE_DRIFT_SPEED = 0.00006;
export const WAVE_TRAVEL_FACTOR = 0.05;
export const WAVE_SWELL_SPEED = 0.0007;
export const WAVE_SWELL_AMP = 0.01;
export const WAVE_RIBBON_SPREAD = 0.012;
export const IDLE_DRIFT_PX = 12;
export const IDLE_SPEED_MIN = 0.0008;
export const IDLE_SPEED_RANGE = 0.0008;
export const BASE_OPACITY = 0.35;
