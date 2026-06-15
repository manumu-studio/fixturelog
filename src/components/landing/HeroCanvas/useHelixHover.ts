// useHelixHover.ts — module-level helix hover state read by the canvas rAF loop.

'use client';

import { useCallback, useState } from 'react';
import type { HelixState } from './HeroCanvas.types';

let helixState: HelixState = 'idle';
let hoverCount = 0;

export function getHelixState(): HelixState {
  return helixState;
}

export function resetHelixState(): void {
  helixState = 'idle';
  hoverCount = 0;
}

export interface HelixHoverHandlers {
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
  readonly onClick: () => void;
  readonly isLoading: boolean;
}

export function useHelixHover(): HelixHoverHandlers {
  const [isLoading, setIsLoading] = useState(false);

  const onMouseEnter = useCallback(() => {
    hoverCount += 1;
    if (helixState !== 'locked') {
      helixState = 'hovering';
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    hoverCount = Math.max(0, hoverCount - 1);
    if (hoverCount === 0 && helixState !== 'locked') {
      helixState = 'idle';
    }
  }, []);

  const onClick = useCallback(() => {
    helixState = 'locked';
    setIsLoading(true);
  }, []);

  return { onMouseEnter, onMouseLeave, onClick, isLoading };
}
