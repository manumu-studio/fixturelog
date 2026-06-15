// heroCanvas.frame.ts — per-frame draw passes for the HeroCanvas animation loop.

import type { Dot } from './HeroCanvas.types';
import {
  BASE_OPACITY,
  IDLE_DRIFT_PX,
  LERP_FAST,
  LERP_SLOW,
  OVERSHOOT_FACTOR,
  OVERSHOOT_SETTLE_RATIO,
  SNAP_THRESHOLD,
  WAVE_DRIFT_SPEED,
} from './heroCanvas.constants';
import { updateWaveTargets } from './heroCanvas.geometry';
import { getHelixState } from './useHelixHover';

interface FrameLayout {
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly fadeRadius: number;
}

interface DotTarget {
  readonly x: number;
  readonly y: number;
}

interface DotAppearance {
  readonly radius: number;
  readonly opacity: number;
}

interface DotDrawPass {
  readonly ctx: CanvasRenderingContext2D;
  readonly layout: FrameLayout;
  readonly refs: HeroCanvasFrameRefs;
  readonly isWaveForm: boolean;
  readonly lerpFactor: number;
  readonly time: number;
}

interface HeroFrameInput {
  readonly ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  readonly time: number;
  readonly refs: HeroCanvasFrameRefs;
}

export interface HeroCanvasFrameRefs {
  dots: Dot[];
  wavePhase: number;
  settledCount: number;
}

function createFrameLayout(width: number, height: number): FrameLayout {
  return {
    width,
    height,
    centerX: width * 0.5,
    centerY: height * 0.45,
    fadeRadius: Math.min(width, height) * 0.35,
  };
}

function tickWaveMotion(
  isWaveForm: boolean,
  layout: FrameLayout,
  refs: HeroCanvasFrameRefs,
  time: number,
): void {
  if (isWaveForm) {
    refs.wavePhase += WAVE_DRIFT_SPEED * 16;
    updateWaveTargets({
      dots: refs.dots,
      width: layout.width,
      height: layout.height,
      wavePhase: refs.wavePhase,
      time,
    });
    return;
  }

  refs.wavePhase *= 0.95;
}

function resolveWaveTarget(dot: Dot): DotTarget {
  let targetX = dot.waveX;
  let targetY = dot.waveY;

  const dx = targetX - dot.currentX;
  const dy = targetY - dot.currentY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const initialDist = Math.sqrt(
    (dot.waveX - dot.clusterX) ** 2 + (dot.waveY - dot.clusterY) ** 2,
  );

  if (initialDist > 0 && dist > initialDist * OVERSHOOT_SETTLE_RATIO) {
    const overshootDist = dist * (OVERSHOOT_FACTOR - 1);
    const norm = dist > 0 ? 1 / dist : 0;
    targetX += dx * norm * overshootDist;
    targetY += dy * norm * overshootDist;
  }

  return { x: targetX, y: targetY };
}

function resolveIdleTarget(dot: Dot, time: number): DotTarget {
  const offsetX = Math.sin(time * dot.speed + dot.phaseX) * IDLE_DRIFT_PX;
  const offsetY = Math.cos(time * dot.speed + dot.phaseY) * IDLE_DRIFT_PX;
  return {
    x: dot.clusterX + offsetX,
    y: dot.clusterY + offsetY,
  };
}

function lerpDotTowardTarget(
  dot: Dot,
  target: DotTarget,
  lerpFactor: number,
  isWaveForm: boolean,
): boolean {
  dot.currentX += (target.x - dot.currentX) * lerpFactor;
  dot.currentY += (target.y - dot.currentY) * lerpFactor;

  const snapDx = target.x - dot.currentX;
  const snapDy = target.y - dot.currentY;
  if (snapDx * snapDx + snapDy * snapDy >= SNAP_THRESHOLD * SNAP_THRESHOLD) {
    return false;
  }

  dot.currentX = target.x;
  dot.currentY = target.y;
  return isWaveForm;
}

function resolveDotAppearance(
  dot: Dot,
  layout: FrameLayout,
  isWaveForm: boolean,
): DotAppearance {
  const distToCenter = Math.sqrt(
    (dot.currentX - layout.centerX) ** 2 + (dot.currentY - layout.centerY) ** 2,
  );
  const radialFade = isWaveForm
    ? 1
    : Math.min(1, 0.25 + 0.75 * (distToCenter / layout.fadeRadius));

  return {
    radius: dot.radius,
    opacity: BASE_OPACITY * radialFade,
  };
}

function paintDot(
  ctx: CanvasRenderingContext2D,
  dot: Dot,
  appearance: DotAppearance,
): void {
  ctx.beginPath();
  ctx.arc(dot.currentX, dot.currentY, appearance.radius, 0, Math.PI * 2);
  ctx.fillStyle = dot.color;
  ctx.globalAlpha = appearance.opacity;
  ctx.fill();
}

function drawDots(pass: DotDrawPass): number {
  let settledCount = 0;

  for (let i = 0; i < pass.refs.dots.length; i += 1) {
    const dot = pass.refs.dots[i];
    if (!dot) continue;

    const target = pass.isWaveForm
      ? resolveWaveTarget(dot)
      : resolveIdleTarget(dot, pass.time);
    if (lerpDotTowardTarget(dot, target, pass.lerpFactor, pass.isWaveForm)) {
      settledCount += 1;
    }

    const appearance = resolveDotAppearance(dot, pass.layout, pass.isWaveForm);
    paintDot(pass.ctx, dot, appearance);
  }

  return settledCount;
}

export function drawHeroFrame(input: HeroFrameInput): HeroCanvasFrameRefs {
  const { ctx, width, height, time, refs } = input;
  ctx.clearRect(0, 0, width, height);

  const state = getHelixState();
  const isWaveForm = state === 'hovering' || state === 'locked';
  const lerpFactor = isWaveForm ? LERP_FAST : LERP_SLOW;
  const layout = createFrameLayout(width, height);

  tickWaveMotion(isWaveForm, layout, refs, time);
  const settledCount = drawDots({
    ctx,
    layout,
    refs,
    isWaveForm,
    lerpFactor,
    time,
  });

  ctx.globalAlpha = 1;
  return { ...refs, settledCount };
}

export function syncDotsForWaveState(dots: Dot[], isWaveForm: boolean): void {
  for (const dot of dots) {
    if (isWaveForm) {
      dot.currentX = dot.waveX;
      dot.currentY = dot.waveY;
      continue;
    }
    dot.currentX = dot.clusterX;
    dot.currentY = dot.clusterY;
  }
}
