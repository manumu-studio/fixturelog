// PendingActions.tsx — dashboard zone 2: items needing the charterer's decision, each
// linking to the relevant surface. Server component.
import Link from 'next/link';
import { PortalCard } from '@/components/portal/PortalCard';
import { EmptyState } from '@/components/portal/EmptyState';
import { formatDate } from '@/lib/utils/format';
import type { PendingAction } from '@/lib/validators/portal.validators';
import type { PendingActionsHrefs, PendingActionsProps } from './PendingActions.types';
import styles from './PendingActions.module.css';

const DEFAULT_HREFS: PendingActionsHrefs = {
  enquiry: '/portal/enquiries',
  fixtures: '/portal/fixtures',
  documents: '/portal/documents',
};

function actionHref(action: PendingAction, hrefs: PendingActionsHrefs): string {
  if (action.kind === 'REVIEW_RECAP') return hrefs.documents;
  if (action.enquiryId !== null) return `${hrefs.enquiry}/${action.enquiryId}`;
  if (action.fixtureId !== null) return hrefs.fixtures;
  return hrefs.enquiry;
}

export function PendingActions({ actions, hrefs = DEFAULT_HREFS }: PendingActionsProps) {
  return (
    <PortalCard>
      <h2 className={styles.heading}>Needs your decision</h2>
      {actions.length === 0 ? (
        <EmptyState title="You're all caught up" message="No actions are waiting on you right now." />
      ) : (
        <ul className={styles.list}>
          {actions.map((action) => (
            <li key={action.id}>
              <Link href={actionHref(action, hrefs)} className={styles.row}>
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.label}>{action.label}</span>
                {action.dueAt !== null && (
                  <span className={styles.due}>Due {formatDate(action.dueAt)}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PortalCard>
  );
}
