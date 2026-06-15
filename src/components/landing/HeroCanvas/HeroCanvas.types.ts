// HeroCanvas.types.ts — procedural cluster-dot canvas with wave-form hover transition.

export interface ClusterConfig {
  readonly cx: number;
  readonly cy: number;
  readonly count: number;
  readonly color: string;
  readonly label: string;
}

export interface Dot {
  clusterX: number;
  clusterY: number;
  waveX: number;
  waveY: number;
  waveIndex: number;
  waveT: number;
  ribbonOffset: number;
  currentX: number;
  currentY: number;
  color: string;
  radius: number;
  phaseX: number;
  phaseY: number;
  speed: number;
}

export type HelixState = 'idle' | 'hovering' | 'locked';

export interface HeroCanvasProps {
  readonly className?: string;
}
