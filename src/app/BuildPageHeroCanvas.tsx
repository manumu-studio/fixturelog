// BuildPageHeroCanvas.tsx - calm marine canvas backdrop for the locked public build page.
'use client';

import { MarineTrafficCanvas } from '@/components/landing/MarineTrafficCanvas';
import styles from './page.module.css';

export function BuildPageHeroCanvas() {
  return <MarineTrafficCanvas intensity="calm" className={styles.canvas ?? ''} />;
}
