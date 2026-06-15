// Props + nav model for the portal navigation. Client-facing labels only.

export interface PortalNavUser {
  name: string | null;
  email: string | null;
}

export interface PortalNavItem {
  label: string;
  href: string;
  /** Render as a cyan pill CTA (e.g. Available Vessels). */
  emphasis?: 'cta' | undefined;
}

export interface PortalNavProps {
  user: PortalNavUser;
  /** Nav items (defaults to the charterer portal items). */
  items?: PortalNavItem[] | undefined;
  /** Brand link target (defaults to /portal). */
  homeHref?: string | undefined;
  /** Brand subtitle (defaults to "Client Portal"). */
  brandSub?: string | undefined;
}

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { label: 'Dashboard', href: '/portal' },
  { label: 'Create Enquiry', href: '/portal/enquiries/new' },
  { label: 'My Enquiries', href: '/portal/enquiries' },
  { label: 'Available Vessels', href: '/map', emphasis: 'cta' },
  { label: 'My Fixtures', href: '/portal/fixtures' },
  { label: 'Documents', href: '/portal/documents' },
];

export const BROKER_NAV_ITEMS: PortalNavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Requirements', href: '/requirements' },
  { label: 'Charterers', href: '/charterers' },
  { label: 'Regional Map', href: '/map' },
];

/** @deprecated Landing links — not used in authenticated portal chrome. */
export const PRIMARY_NAV_LINKS = PORTAL_NAV_ITEMS;
