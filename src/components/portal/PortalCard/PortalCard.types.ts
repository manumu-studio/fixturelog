// Props for the shared portal surface card (base for dashboard tiles + vessel cards).
import type { ReactNode } from 'react';

export interface PortalCardProps {
  children: ReactNode;
  className?: string;
  /** Apply the default internal padding (default true). */
  padded?: boolean;
}
