// PendingSpinner.tsx — compact inline spinner for pending buttons and links.

import styles from './PendingSpinner.module.css';

interface PendingSpinnerProps {
  readonly className?: string | undefined;
  readonly label?: string;
}

export function PendingSpinner({ className, label = 'Loading' }: PendingSpinnerProps) {
  return (
    <span
      className={`${styles.spinner}${className ? ` ${className}` : ''}`}
      role="status"
      aria-label={label}
    />
  );
}
