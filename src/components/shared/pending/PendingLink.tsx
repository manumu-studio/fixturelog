// PendingLink.tsx — Next.js link that activates a spinner immediately on click.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PendingSpinner } from './PendingSpinner';

interface PendingLinkProps {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly className?: string | undefined;
  readonly loadingLabel?: string;
}

export function PendingLink({ href, children, className, loadingLabel }: PendingLinkProps) {
  const [pending, setPending] = useState(false);

  return (
    <Link
      href={href}
      className={className}
      aria-busy={pending}
      onClick={() => { setPending(true); }}
    >
      {pending ? <PendingSpinner label={loadingLabel ?? 'Loading'} /> : children}
    </Link>
  );
}
