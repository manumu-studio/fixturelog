// LandingNav.types.ts — prop interfaces for the LandingNav component.
import type { ReactNode } from 'react';

export interface LandingNavProps {
  className?: string;
  // Server-rendered auth CTA (AuthCta) injected by the page; replaces the old disabled teaser.
  readonly authSlot?: ReactNode;
}
