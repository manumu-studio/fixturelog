// LandingHero.types.ts — prop interfaces for the LandingHero component.
import type { ReactNode } from 'react';

export interface LandingHeroProps {
  readonly className?: string;
  // Server-rendered auth CTA (AuthCta) injected by the page in place of the demo CTA buttons.
  readonly authSlot?: ReactNode;
}
