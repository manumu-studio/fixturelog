// AnimatedLogo.types.ts — props for the SVG stroke-draw logo.

export interface AnimatedLogoProps {
  readonly width?: number;
  readonly stroke?: string;
  readonly fill?: string;
  readonly strokeWidth?: number;
  readonly animate?: boolean;
  readonly animateFill?: boolean;
  readonly decorative?: boolean;
  readonly className?: string;
}

export interface LogoRevealLayerProps {
  readonly enabled: boolean;
  readonly fill: string;
  readonly strokeWidth: number;
  readonly duration: number;
  readonly delay: number;
  readonly clipTopRightId: string;
  readonly clipBottomLeftId: string;
}

export interface LogoDrawLayerProps {
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly animate: boolean;
  readonly duration: number;
  readonly stagger: number;
  readonly clipTopRightId: string;
  readonly clipBottomLeftId: string;
}

export interface AnimatedLogoConfig {
  readonly width: number;
  readonly height: number;
  readonly stroke: string;
  readonly fill: string;
  readonly strokeWidth: number;
  readonly animate: boolean;
  readonly revealEnabled: boolean;
  readonly decorative: boolean;
  readonly className: string | undefined;
  readonly duration: number;
  readonly stagger: number;
  readonly revealDuration: number;
  readonly revealDelay: number;
  readonly rootDuration: number;
}
