// Props for the portal layout chrome.
import type { ReactNode } from 'react';
import type { PortalNavItem, PortalNavUser } from '@/components/portal/PortalNav';

export interface PortalShellProps {
  user: PortalNavUser;
  children: ReactNode;
  /** Nav config (defaults to the charterer portal); the broker dashboard passes broker items. */
  navItems?: PortalNavItem[] | undefined;
  homeHref?: string | undefined;
  brandSub?: string | undefined;
}
