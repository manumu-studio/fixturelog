// Props for the shared empty-state block: optional icon, a title line, an optional
// message, and an optional CTA (typically a PortalButton).
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}
