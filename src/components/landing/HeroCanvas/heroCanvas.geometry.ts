// heroCanvas.geometry.ts — dot factory and wave target geometry for HeroCanvas.

import {
  CLUSTERS,
  IDLE_SPEED_MIN,
  IDLE_SPEED_RANGE,
  TOTAL_DOTS,
  WAVE_COLORS,
  WAVE_COUNT,
  WAVE_RIBBON_SPREAD,
  WAVE_SHAPE_AMP,
  WAVE_STACK_CENTERS,
  WAVE_SWELL_AMP,
  WAVE_SWELL_SPEED,
  WAVE_TRAVEL_FACTOR,
} from './heroCanvas.constants';
import type { Dot } from './HeroCanvas.types';
import {
  getWavePathSamples,
  interpolatePath,
  WAVE_VIEWBOX,
} from './heroCanvas.wavePaths';

interface WavePointInput {
  readonly dot: Dot;
  readonly width: number;
  readonly height: number;
  readonly wavePhase: number;
  readonly time: number;
}

interface WavePointResult {
  readonly x: number;
  readonly y: number;
}

function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

interface RibbonSpreadInput {
  readonly x: number;
  readonly y: number;
  readonly pathPoints: Array<{ x: number; y: number }>;
  readonly t: number;
  readonly ribbonOffset: number;
  readonly width: number;
  readonly height: number;
}

interface WaveTargetsInput {
  readonly dots: Dot[];
  readonly width: number;
  readonly height: number;
  readonly wavePhase: number;
  readonly time: number;
}

function applyRibbonSpread(input: RibbonSpreadInput): { x: number; y: number } {
  const { x, y, pathPoints, t, ribbonOffset, width, height } = input;
  const current = interpolatePath(pathPoints, t);
  const ahead = interpolatePath(pathPoints, t + 0.004);
  const dx = ((ahead.x - current.x) / WAVE_VIEWBOX.width) * width * 0.92;
  const dy = ((ahead.y - current.y) / WAVE_VIEWBOX.height) * height * 0.42;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const spread = ribbonOffset * height * WAVE_RIBBON_SPREAD;

  return {
    x: x + normalX * spread,
    y: y + normalY * spread,
  };
}

export function computeWavePoint(input: WavePointInput): WavePointResult {
  const { dot, width, height, wavePhase, time } = input;
  const samples = getWavePathSamples();
  const pathPoints = samples[0] ?? [];
  const travelT = (dot.waveT - wavePhase * WAVE_TRAVEL_FACTOR + 1) % 1;
  const pathPoint = interpolatePath(pathPoints, travelT);

  const nx = pathPoint.x / WAVE_VIEWBOX.width;
  const stackCenter = WAVE_STACK_CENTERS[dot.waveIndex] ?? WAVE_STACK_CENTERS[1];
  const pathUndulation = (pathPoint.y / WAVE_VIEWBOX.height - 0.35) * height * WAVE_SHAPE_AMP;
  let x = width * (0.04 + nx * 0.92);
  let y = height * stackCenter + pathUndulation;

  const spread = applyRibbonSpread({
    x,
    y,
    pathPoints,
    t: travelT,
    ribbonOffset: dot.ribbonOffset,
    width,
    height,
  });
  x = spread.x;
  y = spread.y;

  const swell = Math.sin(time * WAVE_SWELL_SPEED + dot.phaseX + dot.waveIndex * 1.15)
    * height
    * WAVE_SWELL_AMP;
  y += swell;

  return { x, y };
}

export function createDots(width: number, height: number): Dot[] {
  const dots: Dot[] = [];
  let globalIndex = 0;
  const dotsPerWave = Math.ceil(TOTAL_DOTS / WAVE_COUNT);

  for (const cluster of CLUSTERS) {
    const spread = Math.min(width, height) * 0.08;
    for (let i = 0; i < cluster.count; i += 1) {
      const clusterX = cluster.cx * width + gaussianRandom() * spread;
      const clusterY = cluster.cy * height + gaussianRandom() * spread;
      const waveIndex = globalIndex % WAVE_COUNT;
      const indexOnWave = Math.floor(globalIndex / WAVE_COUNT);
      const waveT = (indexOnWave % dotsPerWave) / dotsPerWave;
      const waveColor = WAVE_COLORS[waveIndex] ?? WAVE_COLORS[1];

      const dot: Dot = {
        clusterX,
        clusterY,
        waveX: clusterX,
        waveY: clusterY,
        waveIndex,
        waveT,
        ribbonOffset: gaussianRandom(),
        currentX: clusterX,
        currentY: clusterY,
        color: waveColor,
        radius: 1.0 + Math.random() * 1.2,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speed: IDLE_SPEED_MIN + Math.random() * IDLE_SPEED_RANGE,
      };

      const wavePoint = computeWavePoint({
        dot,
        width,
        height,
        wavePhase: 0,
        time: 0,
      });
      dot.waveX = wavePoint.x;
      dot.waveY = wavePoint.y;

      dots.push(dot);
      globalIndex += 1;
    }
  }

  return dots;
}

export function updateWaveTargets(input: WaveTargetsInput): void {
  const { dots, width, height, wavePhase, time } = input;

  for (let i = 0; i < dots.length; i += 1) {
    const dot = dots[i];
    if (!dot) continue;

    const wavePoint = computeWavePoint({
      dot,
      width,
      height,
      wavePhase,
      time,
    });
    dot.waveX = wavePoint.x;
    dot.waveY = wavePoint.y;
  }
}
