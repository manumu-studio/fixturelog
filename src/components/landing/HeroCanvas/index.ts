// index.ts — barrel export for HeroCanvas and helix hover hook.

export { HeroCanvas } from './HeroCanvas';
export { useHelixHover, getHelixState, resetHelixState } from './useHelixHover';
export type { HeroCanvasProps, ClusterConfig, Dot, HelixState } from './HeroCanvas.types';
export type { HelixHoverHandlers } from './useHelixHover';
