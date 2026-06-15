// AnimatedLogo.types.ts — props for the SVG stroke-draw logo.

export interface AnimatedLogoProps {
  readonly width?: number;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly animate?: boolean;
  readonly decorative?: boolean;
  readonly className?: string;
}
