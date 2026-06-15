// Props for the portal page header: blue eyebrow -> Playfair heading -> muted subline,
// with an optional right-aligned actions slot (e.g. a primary CTA).
import type { ReactNode } from 'react';

export interface PortalPageHeaderProps {
  eyebrow?: string;
  title: string;
  subline?: string;
  actions?: ReactNode;
}
