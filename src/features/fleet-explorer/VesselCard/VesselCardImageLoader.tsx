// VesselCardImageLoader.tsx — layered sonar-style placeholder while vessel photos load.

'use client';

import { useReducedMotion } from 'motion/react';
import styles from './VesselCard.module.css';

interface VesselCardImageLoaderProps {
  readonly hidden: boolean;
}

export function VesselCardImageLoader({ hidden }: VesselCardImageLoaderProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <span
      className={[styles.loader, hidden ? styles.loaderHidden : ''].filter(Boolean).join(' ')}
      aria-hidden="true"
      data-testid="vessel-card-loader"
    >
      <span className={reduceMotion ? styles.loaderStatic : styles.loaderSweep} />
      <span className={reduceMotion ? styles.loaderWaveStatic : styles.loaderWave} />
      <span className={reduceMotion ? styles.loaderWaveStatic : styles.loaderWave} />
      <span className={reduceMotion ? styles.loaderWaveStatic : styles.loaderWave} />
      <span className={reduceMotion ? styles.loaderPingStatic : styles.loaderPing} />
    </span>
  );
}
