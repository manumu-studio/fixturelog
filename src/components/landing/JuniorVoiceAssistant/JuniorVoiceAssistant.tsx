// JuniorVoiceAssistant.tsx - reusable cluster-to-formed assistant visual for the build page.

'use client';

import { useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type {
  JuniorVoiceAssistantProps,
  JuniorVoiceAssistantState,
} from './JuniorVoiceAssistant.types';
import { useJuniorVoiceAssistantCanvas } from './useJuniorVoiceAssistantCanvas';
import styles from './JuniorVoiceAssistant.module.css';

function resolveVoiceLine(state: JuniorVoiceAssistantState): string {
  if (state === 'formed') return 'Supervised voice. Preview only.';
  if (state === 'forming') return 'Calm, brief, evidence-led.';
  return 'Voice identity being shaped.';
}

function resolveVisualState(
  state: JuniorVoiceAssistantState,
  formingHint: boolean,
): JuniorVoiceAssistantState {
  if (state === 'formed') return 'formed';
  if (formingHint || state === 'forming') return 'forming';
  return 'dispersed';
}

export function JuniorVoiceAssistant({
  className,
  label = 'Activate assistant preview',
  formingHint = false,
}: JuniorVoiceAssistantProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<JuniorVoiceAssistantState>('dispersed');
  const visualState = resolveVisualState(state, formingHint);

  useJuniorVoiceAssistantCanvas(canvasRef, visualState, reducedMotion);

  const rootClass = [styles.root, className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={rootClass}
      data-state={visualState}
      aria-label={label}
      aria-pressed={state === 'formed'}
      onMouseEnter={() => { if (state !== 'formed') setState('forming'); }}
      onMouseLeave={() => { if (state !== 'formed') setState('dispersed'); }}
      onFocus={() => { if (state !== 'formed') setState('forming'); }}
      onBlur={() => { if (state !== 'formed') setState('dispersed'); }}
      onClick={() => { setState('formed'); }}
    >
      <span className={styles.canvasWrap} aria-hidden="true">
        <canvas ref={canvasRef} className={styles.canvas} />
        <span className={styles.ring} />
      </span>
      <span className={styles.voiceLine} aria-live="polite">
        {resolveVoiceLine(visualState)}
      </span>
    </button>
  );
}
