// Props for the canonical portal pill button. Renders as a <button> or, when `href`
// is given, as a link. The landing AuthCta matches this primitive.
import type { MouseEventHandler, ReactNode } from 'react';

export type PortalButtonVariant = 'primary' | 'secondary';
export type PortalButtonSize = 'md' | 'sm';

interface PortalButtonBase {
  variant?: PortalButtonVariant;
  size?: PortalButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

export interface PortalButtonAsButton extends PortalButtonBase {
  href?: undefined;
  type?: 'button' | 'submit' | 'reset';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export interface PortalButtonAsLink extends PortalButtonBase {
  href: string;
  /** Use a plain <a> (e.g. a GET route like federated sign-out) instead of next/link. */
  external?: boolean;
}

export type PortalButtonProps = PortalButtonAsButton | PortalButtonAsLink;
