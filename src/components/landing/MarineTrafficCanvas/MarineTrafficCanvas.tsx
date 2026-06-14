// MarineTrafficCanvas.tsx — procedural marine chart canvas for the landing hero.
// Decorative only: vessel dots, port nodes, route arcs, weather band, cyan ribbon.

'use client';

import { useEffect, useRef, useState } from 'react';
import type { MarineTrafficCanvasProps } from './MarineTrafficCanvas.types';
import { useMarineTrafficCanvas } from './useMarineTrafficCanvas';
import styles from './MarineTrafficCanvas.module.css';

export function MarineTrafficCanvas({
  intensity = 'calm',
  className,
}: MarineTrafficCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const isActive = intensity === 'active';

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => { setReducedMotion(e.matches); };
    mq.addEventListener('change', handler);
    return () => { mq.removeEventListener('change', handler); };
  }, []);

  useMarineTrafficCanvas(canvasRef, reducedMotion, isActive);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvas}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      data-testid="marine-canvas"
    />
  );
}
