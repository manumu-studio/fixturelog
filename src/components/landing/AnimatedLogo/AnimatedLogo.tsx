// AnimatedLogo.tsx — FixtureLog logo with OR Studio-style stroke-draw animation.

'use client';

import { useState } from 'react';
import * as motion from 'motion/react-client';
import { useReducedMotion } from 'motion/react';
import { BRAND_LOGO_LABEL } from '@/lib/constants/brand';
import { LOGO_STROKE_PATHS, LOGO_VIEWBOX } from './logoPaths';
import type { AnimatedLogoProps } from './AnimatedLogo.types';
import styles from './AnimatedLogo.module.css';

export function AnimatedLogo({
  width = 120,
  stroke = 'currentColor',
  strokeWidth = 2.4,
  animate = true,
  decorative = false,
  className,
}: AnimatedLogoProps) {
  const [restartKey, setRestartKey] = useState(0);
  const reduced = useReducedMotion() ?? false;
  const height = (width * LOGO_VIEWBOX.height) / LOGO_VIEWBOX.width;
  const duration = reduced ? 0 : 1;
  const stagger = reduced ? 0 : 0.15;

  return (
    <motion.svg
      key={restartKey}
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      width={width}
      height={height}
      viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : BRAND_LOGO_LABEL}
      aria-hidden={decorative ? true : undefined}
      onClick={() => { setRestartKey((value) => value + 1); }}
      initial={{ opacity: 0.95, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduced ? 0 : 0.2, ease: 'easeOut' }}
    >
      {LOGO_STROKE_PATHS.map((pathD, index) => (
        <motion.path
          key={`logo-stroke-${index}`}
          d={pathD}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
          initial={animate ? { pathLength: 0, opacity: 0.7 } : false}
          animate={animate ? { pathLength: 1, opacity: 1 } : false}
          transition={{
            duration,
            delay: index * stagger,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.svg>
  );
}
