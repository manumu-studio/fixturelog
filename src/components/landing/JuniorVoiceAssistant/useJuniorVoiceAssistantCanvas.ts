// useJuniorVoiceAssistantCanvas.ts - particle field that collapses into the junior assistant form.

'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { AssistantDot, JuniorVoiceAssistantState } from './JuniorVoiceAssistant.types';

const PALETTE = ['#c7f1ff', '#86dcef', '#36adcf', '#0075a7', '#003d80'] as const;
const FORMED_PALETTE = ['#8bdcf1', '#28a9d0', '#006ba1', '#003c7a', '#001a5c'] as const;
const REFERENCE_AREA = 380 * 340;
const REFERENCE_DOTS = 1250;
const MIN_DOTS = 360;
const MAX_DOTS = 1400;
const IDLE_DRIFT = 14;
const FORMED_DRIFT = 0.8;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function resolveDotCount(width: number, height: number): number {
  const scale = (width * height) / REFERENCE_AREA;
  return Math.min(MAX_DOTS, Math.max(MIN_DOTS, Math.round(REFERENCE_DOTS * scale)));
}

function paletteColor(palette: readonly string[], index: number): string {
  return palette[index % palette.length] ?? palette[0] ?? '#003d80';
}

function createDot(index: number, total: number, width: number, height: number): AssistantDot {
  const centerX = width * 0.54;
  const centerY = height * 0.48;
  const radius = Math.min(width, height) * 0.31;
  const normalizedIndex = (index + 0.5) / total;
  const yUnit = 1 - normalizedIndex * 2;
  const latitudeRadius = Math.sqrt(1 - yUnit * yUnit);
  const angle = index * GOLDEN_ANGLE;
  const formedX = centerX + Math.cos(angle) * latitudeRadius * radius;
  const formedY = centerY + yUnit * radius;
  const formedZ = Math.sin(angle) * latitudeRadius * radius;
  const clusterIndex = index % 7;
  const clusterAngle = (clusterIndex / 7) * Math.PI * 2 - Math.PI / 2;
  const clusterRadiusX = width * (0.38 + Math.random() * 0.22);
  const clusterRadiusY = height * (0.34 + Math.random() * 0.18);
  const dispersedX = centerX + Math.cos(clusterAngle) * clusterRadiusX + gaussianRandom() * width * 0.075;
  const dispersedY = centerY + Math.sin(clusterAngle) * clusterRadiusY + gaussianRandom() * height * 0.075;

  return {
    dispersedX,
    dispersedY,
    formedX,
    formedY,
    formedZ,
    centerX,
    centerY,
    sphereRadius: radius,
    currentX: dispersedX,
    currentY: dispersedY,
    currentDepth: 0.2,
    color: paletteColor(PALETTE, index),
    formedColor: paletteColor(FORMED_PALETTE, index),
    radius: 0.72 + Math.random() * 0.82,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    speed: 0.0007 + Math.random() * 0.0007,
  };
}

function createDots(width: number, height: number): AssistantDot[] {
  const total = resolveDotCount(width, height);
  return Array.from({ length: total }, (_, index) => createDot(index, total, width, height));
}

function resolveLerp(state: JuniorVoiceAssistantState): number {
  if (state === 'formed') return 0.032;
  if (state === 'forming') return 0.018;
  return 0.012;
}

function projectSphereDot(dot: AssistantDot, time: number): { x: number; y: number; depth: number } {
  const rotateY = time * 0.00016;
  const rotateX = -0.24 + Math.sin(time * 0.00018) * 0.05;
  const offsetX = dot.formedX - dot.centerX;
  const offsetY = dot.formedY - dot.centerY;

  const cosY = Math.cos(rotateY);
  const sinY = Math.sin(rotateY);
  const rotatedX = offsetX * cosY + dot.formedZ * sinY;
  const rotatedZ = -offsetX * sinY + dot.formedZ * cosY;

  const cosX = Math.cos(rotateX);
  const sinX = Math.sin(rotateX);
  const tiltedY = offsetY * cosX - rotatedZ * sinX;
  const tiltedZ = offsetY * sinX + rotatedZ * cosX;
  const depth = (tiltedZ / dot.sphereRadius + 1) / 2;
  const perspective = 0.82 + depth * 0.2;

  return {
    x: dot.centerX + rotatedX * perspective,
    y: dot.centerY + tiltedY * perspective,
    depth,
  };
}

function resolveTarget(
  dot: AssistantDot,
  state: JuniorVoiceAssistantState,
  time: number,
): { x: number; y: number; depth: number } {
  if (state === 'dispersed') {
    return {
      x: dot.dispersedX + Math.sin(time * dot.speed + dot.phaseX) * IDLE_DRIFT,
      y: dot.dispersedY + Math.cos(time * dot.speed + dot.phaseY) * IDLE_DRIFT,
      depth: 0.2,
    };
  }

  const drift = state === 'formed' ? FORMED_DRIFT : 0;
  const sphere = projectSphereDot(dot, time);
  return {
    x: sphere.x + Math.sin(time * dot.speed * 2 + dot.phaseX) * drift,
    y: sphere.y + Math.cos(time * dot.speed * 2 + dot.phaseY) * drift,
    depth: sphere.depth,
  };
}

function paintDot(
  ctx: CanvasRenderingContext2D,
  dot: AssistantDot,
  state: JuniorVoiceAssistantState,
): void {
  const depthBoost = state === 'dispersed' ? 0.2 : dot.currentDepth;
  const radiusScale = state === 'dispersed' ? 0.72 + depthBoost * 0.62 : 0.48 + depthBoost * 0.9;
  const alpha = state === 'dispersed' ? 0.48 : 0.18 + depthBoost * 0.62;
  ctx.beginPath();
  ctx.arc(dot.currentX, dot.currentY, dot.radius * radiusScale, 0, Math.PI * 2);
  ctx.fillStyle = state === 'dispersed' ? dot.color : dot.formedColor;
  ctx.globalAlpha = alpha;
  ctx.fill();
}

export function useJuniorVoiceAssistantCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  state: JuniorVoiceAssistantState,
  reducedMotion: boolean,
): void {
  const dotsRef = useRef<AssistantDot[]>([]);
  const rafRef = useRef<number>(0);
  const stateRef = useRef(state);

  stateRef.current = state;

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height);
    const currentState = stateRef.current;
    const lerp = reducedMotion ? 1 : resolveLerp(currentState);

    for (const dot of dotsRef.current) {
      const target = resolveTarget(dot, currentState, time);
      dot.currentX += (target.x - dot.currentX) * lerp;
      dot.currentY += (target.y - dot.currentY) * lerp;
      dot.currentDepth += (target.depth - dot.currentDepth) * lerp;
    }

    const paintOrder = currentState === 'dispersed'
      ? dotsRef.current
      : [...dotsRef.current].sort((first, second) => first.currentDepth - second.currentDepth);

    for (const dot of paintOrder) {
      paintDot(ctx, dot, currentState);
    }

    ctx.globalAlpha = 1;
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      dotsRef.current = createDots(rect.width, rect.height);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('resize', resize);

    const loop = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height, time);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, draw]);
}
