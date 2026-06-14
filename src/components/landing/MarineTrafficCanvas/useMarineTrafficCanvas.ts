// useMarineTrafficCanvas.ts — rAF animation loop for the marine hero canvas.
// Mirrors Helical's HeroCanvas architecture: init, resize, layered draw, cleanup.

'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { PortNode, RouteArc, VesselParticle } from './MarineTrafficCanvas.types';

/* ── Constants ─────────────────────────────────────────────────────────── */

const VESSEL_COUNT = 18;
const IDLE_DRIFT_PX = 14;
const IDLE_SPEED_MIN = 0.0006;
const IDLE_SPEED_RANGE = 0.0008;
const ACTIVE_DRIFT_PX = 28;
const LERP_SLOW = 0.012;
const LERP_FAST = 0.06;

const PORT_NODES: readonly PortNode[] = [
  { nx: 0.18, ny: 0.22, label: 'Aberdeen' },
  { nx: 0.55, ny: 0.12, label: 'Stavanger' },
  { nx: 0.82, ny: 0.30, label: 'Bergen' },
  { nx: 0.72, ny: 0.72, label: 'Rotterdam' },
  { nx: 0.30, ny: 0.80, label: 'Dundee' },
  { nx: 0.50, ny: 0.50, label: 'North Sea Hub' },
  { nx: 0.10, ny: 0.55, label: 'Lerwick' },
] as const;

/* ── Draw context shapes ────────────────────────────────────────────────── */

interface PassCtx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
  isActive: boolean;
}

interface FrameCtx extends PassCtx {
  vessels: VesselParticle[];
  arcs: RouteArc[];
}

/* ── Factory helpers ───────────────────────────────────────────────────── */

function makeVessels(w: number, h: number): VesselParticle[] {
  return Array.from({ length: VESSEL_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    speed: IDLE_SPEED_MIN + Math.random() * IDLE_SPEED_RANGE,
    opacity: 0.18 + Math.random() * 0.22,
    radius: 1.5 + Math.random() * 2,
  }));
}

function makeArcs(w: number, h: number): RouteArc[] {
  const pairs: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 4]];
  return pairs.map(([a, b]) => {
    const p0 = PORT_NODES[a];
    const p1 = PORT_NODES[b];
    if (!p0 || !p1) return null;
    return {
      x0: p0.nx * w, y0: p0.ny * h,
      x1: p1.nx * w, y1: p1.ny * h,
      cp: (Math.random() - 0.5) * 0.3,
      progress: Math.random(),
      phase: Math.random() * Math.PI * 2,
    };
  }).filter((a): a is RouteArc => a !== null);
}

/* ── Draw passes ───────────────────────────────────────────────────────── */

function drawPortNodes(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  for (const node of PORT_NODES) {
    const x = node.nx * w;
    const y = node.ny * h;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,97,0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,97,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawWeatherBand(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, h * 0.28, 0, h * 0.45);
  grad.addColorStop(0, 'rgba(0,226,253,0.06)');
  grad.addColorStop(0.5, 'rgba(0,135,203,0.04)');
  grad.addColorStop(1, 'rgba(0,226,253,0.00)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h * 0.28, w, h * 0.17);
}

function drawVessels(
  ctx: CanvasRenderingContext2D,
  vessels: VesselParticle[],
  t: number,
  isActive: boolean,
): void {
  const driftPx = isActive ? ACTIVE_DRIFT_PX : IDLE_DRIFT_PX;
  const lerpF = isActive ? LERP_FAST : LERP_SLOW;
  for (const v of vessels) {
    const ox = Math.sin(t * v.speed + v.phaseX) * driftPx;
    const oy = Math.cos(t * v.speed + v.phaseY) * driftPx;
    v.x += ((v.x + ox) - v.x) * lerpF;
    v.y += ((v.y + oy) - v.y) * lerpF;
    ctx.beginPath();
    ctx.arc(v.x + ox, v.y + oy, v.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,135,203,${isActive ? v.opacity * 1.6 : v.opacity})`;
    ctx.fill();
  }
}

function drawRouteArcs(
  ctx: CanvasRenderingContext2D,
  arcs: RouteArc[],
  t: number,
  isActive: boolean,
): void {
  const alpha = isActive ? 0.22 : 0.10;
  for (const arc of arcs) {
    const midX = (arc.x0 + arc.x1) * 0.5;
    const midY = (arc.y0 + arc.y1) * 0.5;
    const dx = arc.x1 - arc.x0;
    const dy = arc.y1 - arc.y0;
    ctx.beginPath();
    ctx.moveTo(arc.x0, arc.y0);
    ctx.quadraticCurveTo(midX - dy * arc.cp, midY + dx * arc.cp, arc.x1, arc.y1);
    ctx.strokeStyle = `rgba(0,0,97,${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    arc.phase += 0.008;
    arc.progress = Math.sin(t * 0.0004 + arc.phase) * 0.5 + 0.5;
  }
}

function drawCyanRibbon({ ctx, w, h, t, isActive }: PassCtx): void {
  const amp = isActive ? 24 : 14;
  const alpha = isActive ? 0.55 : 0.35;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  for (let x = 0; x <= w; x += 4) {
    const wave = Math.sin((x / w) * Math.PI * 3 + t * 0.0006) * amp;
    ctx.lineTo(x, h * 0.62 + wave);
  }
  ctx.strokeStyle = `rgba(0,226,253,${alpha})`;
  ctx.lineWidth = isActive ? 2.5 : 1.5;
  ctx.stroke();

  // Offset ribbon — laycan band depth
  ctx.beginPath();
  ctx.moveTo(0, h * 0.64);
  for (let x = 0; x <= w; x += 4) {
    const wave = Math.sin((x / w) * Math.PI * 3 + t * 0.0006 + 0.6) * (amp * 0.6);
    ctx.lineTo(x, h * 0.64 + wave);
  }
  ctx.strokeStyle = `rgba(0,226,253,${alpha * 0.4})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawFrame({ ctx, w, h, t, isActive, vessels, arcs }: FrameCtx): void {
  ctx.clearRect(0, 0, w, h);
  drawWeatherBand(ctx, w, h);
  drawRouteArcs(ctx, arcs, t, isActive);
  drawCyanRibbon({ ctx, w, h, t, isActive });
  drawPortNodes(ctx, w, h);
  drawVessels(ctx, vessels, t, isActive);
  ctx.globalAlpha = 1;
}

/* ── Hook ─────────────────────────────────────────────────────────────── */

export function useMarineTrafficCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  reducedMotion: boolean,
  isActive: boolean,
): void {
  const vesselsRef = useRef<VesselParticle[]>([]);
  const arcsRef = useRef<RouteArc[]>([]);
  const rafRef = useRef<number>(0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      drawFrame({ ctx, w, h, t, isActive, vessels: vesselsRef.current, arcs: arcsRef.current });
    },
    [isActive],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      vesselsRef.current = makeVessels(rect.width, rect.height);
      arcsRef.current = makeArcs(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    if (reducedMotion) {
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height, 0);
      return () => { window.removeEventListener('resize', resize); };
    }

    const loop = (t: number) => {
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height, t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, draw, reducedMotion]);
}
