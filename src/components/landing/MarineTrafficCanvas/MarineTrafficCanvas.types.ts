// MarineTrafficCanvas.types.ts — prop and data interfaces for the marine canvas.

export interface MarineTrafficCanvasProps {
  /** Animation intensity level — calm (idle) or active (CTA hovered). */
  readonly intensity?: 'calm' | 'active';
  readonly className?: string;
}

export interface PortNode {
  /** 0..1 fractional position on canvas */
  readonly nx: number;
  readonly ny: number;
  readonly label: string;
}

export interface VesselParticle {
  /** Current canvas position */
  x: number;
  y: number;
  /** Drift phase offsets */
  phaseX: number;
  phaseY: number;
  /** Drift speed multiplier */
  speed: number;
  opacity: number;
  radius: number;
}

export interface RouteArc {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  /** Control-point offset factor */
  readonly cp: number;
  progress: number;
  /** 0..1 animation phase */
  phase: number;
}
