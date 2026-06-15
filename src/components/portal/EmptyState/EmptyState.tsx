// EmptyState.tsx — shared empty-state block (token-only). Server component.
import type { EmptyStateProps } from './EmptyState.types';
import styles from './EmptyState.module.css';

export function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {icon !== undefined && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <p className={styles.title}>{title}</p>
      {message !== undefined && <p className={styles.message}>{message}</p>}
      {action !== undefined && <div className={styles.action}>{action}</div>}
    </div>
  );
}
