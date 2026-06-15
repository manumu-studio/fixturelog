// HeroCanvas.tsx — procedural cluster-dot canvas with three-wave hover transition.

'use client';

import { useEffect, useRef, useState } from 'react';
import type { HeroCanvasProps } from './HeroCanvas.types';
import { useHeroCanvas } from './useHeroCanvas';
import { resetHelixState } from './useHelixHover';
import styles from './HeroCanvas.module.css';

export function HeroCanvas({ className }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    resetHelixState();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };
    mq.addEventListener('change', handler);
    return () => {
      mq.removeEventListener('change', handler);
    };
  }, []);

  useHeroCanvas(canvasRef, reducedMotion);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvas}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      data-testid="hero-canvas"
    />
  );
}
