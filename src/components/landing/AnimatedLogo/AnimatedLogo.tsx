// AnimatedLogo.tsx — FixtureLog logo with OR Studio-style stroke-draw animation.

'use client';

import { useId, useState } from 'react';
import * as motion from 'motion/react-client';
import { useReducedMotion } from 'motion/react';
import { BRAND_LOGO_LABEL } from '@/lib/constants/brand';
import { LOGO_CLIP, LOGO_SEGMENTS, LOGO_VIEWBOX, THICKNESS } from './logoPaths';
import type { LogoClip } from './logoPaths';
import type {
  AnimatedLogoConfig,
  AnimatedLogoProps,
  LogoDrawLayerProps,
  LogoRevealLayerProps,
} from './AnimatedLogo.types';
import styles from './AnimatedLogo.module.css';

function getRootClassName(className: string | undefined) {
  return [styles.root, className].filter(Boolean).join(' ');
}

/** Map a segment's clip plane to the matching clipPath url (none = uncut). */
function clipUrl(clip: LogoClip, topRightId: string, bottomLeftId: string): string | undefined {
  if (clip === 'topRight') return `url(#${topRightId})`;
  if (clip === 'bottomLeft') return `url(#${bottomLeftId})`;
  return undefined;
}

function getLogoConfig(props: AnimatedLogoProps, reduced: boolean): AnimatedLogoConfig {
  const width = props.width ?? 120;
  const stroke = props.stroke ?? 'currentColor';
  const animate = props.animate ?? true;
  const animateFill = props.animateFill ?? true;

  return {
    width,
    height: (width * LOGO_VIEWBOX.height) / LOGO_VIEWBOX.width,
    stroke,
    fill: props.fill ?? stroke,
    strokeWidth: props.strokeWidth ?? THICKNESS,
    animate,
    revealEnabled: animate && animateFill,
    decorative: props.decorative ?? false,
    className: props.className,
    duration: reduced ? 0 : 1,
    stagger: reduced ? 0 : 0.12,
    revealDuration: reduced ? 0 : 0.6,
    revealDelay: reduced ? 0 : 0.45,
    rootDuration: reduced ? 0 : 0.2,
  };
}

function getLogoRole(decorative: boolean) {
  if (decorative) return undefined;
  return 'img';
}

function getLogoLabel(decorative: boolean) {
  if (decorative) return undefined;
  return BRAND_LOGO_LABEL;
}

function getLogoHidden(decorative: boolean) {
  if (decorative) return true;
  return undefined;
}

function LogoRevealLayer({
  enabled,
  fill,
  strokeWidth,
  duration,
  delay,
  clipTopRightId,
  clipBottomLeftId,
}: LogoRevealLayerProps) {
  if (!enabled) return null;

  return LOGO_SEGMENTS.map((segment) => (
    <motion.path
      key={`logo-fill-${segment.d}`}
      d={segment.d}
      clipPath={clipUrl(segment.clip, clipTopRightId, clipBottomLeftId)}
      fill="none"
      stroke={fill}
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      strokeMiterlimit={8}
      vectorEffect="non-scaling-stroke"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
    />
  ));
}

function LogoDrawLayer({
  stroke,
  strokeWidth,
  animate,
  duration,
  stagger,
  clipTopRightId,
  clipBottomLeftId,
}: LogoDrawLayerProps) {
  return LOGO_SEGMENTS.map((segment, index) => (
    <motion.path
      key={`logo-stroke-${index}`}
      d={segment.d}
      clipPath={clipUrl(segment.clip, clipTopRightId, clipBottomLeftId)}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      strokeMiterlimit={8}
      vectorEffect="non-scaling-stroke"
      initial={animate ? { pathLength: 0, opacity: 0.7 } : false}
      animate={animate ? { pathLength: 1, opacity: 1 } : false}
      transition={{
        duration,
        delay: index * stagger,
        ease: 'easeInOut',
      }}
    />
  ));
}

export function AnimatedLogo(props: AnimatedLogoProps) {
  const [restartKey, setRestartKey] = useState(0);
  const reduced = useReducedMotion() ?? false;
  const config = getLogoConfig(props, reduced);
  const rawId = useId();
  const clipTopRightId = `${rawId}-tr`;
  const clipBottomLeftId = `${rawId}-bl`;

  return (
    <motion.svg
      key={restartKey}
      className={getRootClassName(config.className)}
      width={config.width}
      height={config.height}
      viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      role={getLogoRole(config.decorative)}
      aria-label={getLogoLabel(config.decorative)}
      aria-hidden={getLogoHidden(config.decorative)}
      onClick={() => { setRestartKey((value) => value + 1); }}
      initial={{ opacity: 0.95, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: config.rootDuration, ease: 'easeOut' }}
    >
      <defs>
        {/* Twin's vertical top is recessed by an angled plane parallel to line 3. */}
        <clipPath id={clipTopRightId} clipPathUnits="userSpaceOnUse">
          <polygon points={LOGO_CLIP.topRight} />
        </clipPath>
        {/* Upright's vertical bottom is recessed (the 180deg mirror of the cut above). */}
        <clipPath id={clipBottomLeftId} clipPathUnits="userSpaceOnUse">
          <polygon points={LOGO_CLIP.bottomLeft} />
        </clipPath>
      </defs>
      <g>
        <LogoRevealLayer
          enabled={config.revealEnabled}
          fill={config.fill}
          strokeWidth={config.strokeWidth}
          duration={config.revealDuration}
          delay={config.revealDelay}
          clipTopRightId={clipTopRightId}
          clipBottomLeftId={clipBottomLeftId}
        />
        <LogoDrawLayer
          stroke={config.stroke}
          strokeWidth={config.strokeWidth}
          animate={config.animate}
          duration={config.duration}
          stagger={config.stagger}
          clipTopRightId={clipTopRightId}
          clipBottomLeftId={clipBottomLeftId}
        />
      </g>
    </motion.svg>
  );
}
