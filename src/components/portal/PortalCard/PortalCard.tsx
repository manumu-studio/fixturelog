// PortalCard.tsx — shared white surface card (token-only). Server component.
import type { PortalCardProps } from './PortalCard.types';
import styles from './PortalCard.module.css';

export function PortalCard({ children, className, padded = true }: PortalCardProps) {
  const cn = [styles.card, padded ? styles.padded : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return <div className={cn}>{children}</div>;
}
