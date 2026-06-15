// SeaWaveAnimation.tsx — wave mark drifting right to left with vertical swell motion.

'use client';

import { useReducedMotion } from 'motion/react';
import * as motion from 'motion/react-client';
import type { SeaWaveAnimationProps } from './SeaWaveAnimation.types';
import { SeaWaveMark } from './SeaWaveMark';
import styles from './SeaWaveAnimation.module.css';

const WAVE_COPIES = 6;

export function SeaWaveAnimation({ className }: SeaWaveAnimationProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      data-testid="sea-wave-animation"
    >
      <div className={styles.track}>
        <motion.div
          className={styles.swell}
          animate={reduced ? { y: 0 } : { y: [0, -12, 0, 10, 0] }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: 5.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        >
          <div className={`${styles.waveRow}${reduced ? ` ${styles.waveRowReduced}` : ` ${styles.waveRowAnimated}`}`}>
            {Array.from({ length: WAVE_COPIES }, (_, index) => (
              <div key={index} className={styles.waveItem}>
                <SeaWaveMark className={styles.waveSvg ?? ''} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
