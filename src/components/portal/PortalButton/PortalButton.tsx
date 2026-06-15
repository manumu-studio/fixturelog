// PortalButton.tsx — canonical pill button for the portal (primary cyan / secondary navy
// outline), token-only. Renders a <button>, a next/link, or a plain <a> for GET routes.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PendingSpinner } from '@/components/shared/pending';
import type { PortalButtonProps } from './PortalButton.types';
import styles from './PortalButton.module.css';

function renderLabel(pending: boolean, children: React.ReactNode, loadingLabel: string) {
  return pending ? <PendingSpinner label={loadingLabel} /> : children;
}

export function PortalButton(props: PortalButtonProps) {
  const { variant = 'primary', size = 'md', fullWidth = false, children } = props;
  const [pending, setPending] = useState(false);
  const className = [styles.btn, styles[variant], styles[size], fullWidth ? styles.full : '']
    .filter(Boolean)
    .join(' ');

  if (props.href !== undefined) {
    if (props.external === true) {
      return (
        <a
          href={props.href}
          className={className}
          aria-busy={pending}
          onClick={() => { setPending(true); }}
        >
          {renderLabel(pending, children, 'Loading')}
        </a>
      );
    }

    return (
      <Link
        href={props.href}
        className={className}
        aria-busy={pending}
        onClick={() => { setPending(true); }}
      >
        {renderLabel(pending, children, 'Loading')}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      className={className}
      disabled={props.disabled === true || pending}
      aria-busy={pending}
      onClick={(event) => {
        setPending(true);
        props.onClick?.(event);
      }}
    >
      {renderLabel(pending, children, 'Loading')}
    </button>
  );
}
