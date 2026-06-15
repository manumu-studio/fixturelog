import type { PendingAction } from '@/lib/validators/portal.validators';

export interface PendingActionsHrefs {
  enquiry: string;
  fixtures: string;
  documents: string;
}

export interface PendingActionsProps {
  actions: PendingAction[];
  /** Where each action links (default the charterer portal surfaces). */
  hrefs?: PendingActionsHrefs;
}
