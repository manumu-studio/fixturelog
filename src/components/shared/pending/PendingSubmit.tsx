// PendingSubmit.tsx — form submit button that shows a spinner while the action is pending.

'use client';

import { useFormStatus } from 'react-dom';
import { PendingSpinner } from './PendingSpinner';

interface PendingSubmitProps {
  readonly children: React.ReactNode;
  readonly className?: string | undefined;
  readonly loadingLabel?: string;
}

export function PendingSubmit({ children, className, loadingLabel }: PendingSubmitProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? <PendingSpinner label={loadingLabel ?? 'Submitting'} /> : children}
    </button>
  );
}
