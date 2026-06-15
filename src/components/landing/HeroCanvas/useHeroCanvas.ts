// useHeroCanvas.ts — rAF animation loop wiring for the HeroCanvas dot field.

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createDots } from './heroCanvas.geometry';
import {
  drawHeroFrame,
  syncDotsForWaveState,
  type HeroCanvasFrameRefs,
} from './heroCanvas.frame';
import { resetWavePathSamples } from './heroCanvas.wavePaths';
import { getHelixState } from './useHelixHover';

function resizeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): { width: number; height: number } {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return { width: rect.width, height: rect.height };
}

function createFrameRefs(width: number, height: number): HeroCanvasFrameRefs {
  return {
    dots: createDots(width, height),
    wavePhase: 0,
    settledCount: 0,
  };
}

export function useHeroCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  reducedMotion: boolean,
): void {
  const frameRef = useRef<HeroCanvasFrameRefs>({
    dots: [],
    wavePhase: 0,
    settledCount: 0,
  });
  const rafRef = useRef<number>(0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      frameRef.current = drawHeroFrame({
        ctx,
        width,
        height,
        time,
        refs: frameRef.current,
      });
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      resetWavePathSamples();
      const { width, height } = resizeCanvas(canvas, ctx);
      const next = createFrameRefs(width, height);
      frameRef.current = next;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    if (reducedMotion) {
      const drawStatic = () => {
        const rect = canvas.getBoundingClientRect();
        const state = getHelixState();
        const isWaveForm = state === 'hovering' || state === 'locked';
        syncDotsForWaveState(frameRef.current.dots, isWaveForm);
        draw(ctx, rect.width, rect.height, 0);
      };

      drawStatic();
      const interval = setInterval(drawStatic, 100);

      return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(interval);
      };
    }

    const loop = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height, time);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, draw, reducedMotion]);
}
