// StatusBadge.tsx — shared status pill (token-only). Server component. Maps the various
// requirement/fixture/subject statuses to one of four palette tones.
import type { StatusBadgeProps, StatusTone } from './StatusBadge.types';
import styles from './StatusBadge.module.css';

const TONE: Record<string, StatusTone> = {
  ENQUIRY: 'new',
  DRAFT: 'new',
  PENDING: 'new',
  SHORTLISTED: 'active',
  NEGOTIATING: 'active',
  ON_SUBS: 'active',
  OPEN: 'active',
  FIXED: 'done',
  COMPLETED: 'done',
  LIFTED: 'done',
  WAIVED: 'done',
  ON_HIRE: 'done',
  CLEAR: 'done',
  LOST: 'lost',
  FAILED: 'lost',
  BLOCKED: 'lost',
  SOURCE_ERROR: 'lost',
  REVIEW: 'active',
  STALE: 'active',
  NOT_SCREENED: 'new',
};

/** "ON_SUBS" -> "On Subs", "ENQUIRY" -> "Enquiry". Shared by the portal surfaces. */
export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = TONE[status] ?? 'new';
  return <span className={`${styles.badge} ${styles[tone]}`}>{formatStatusLabel(status)}</span>;
}
