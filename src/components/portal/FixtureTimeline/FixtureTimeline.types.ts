import type { ReactNode } from 'react';
import type { FixtureSummary } from '@/lib/validators/portal.validators';

export interface FixtureTimelineProps {
  fixtures: FixtureSummary[];
  /** Optional empty-state message override. */
  emptyMessage?: string;
  /**
   * Optional broker-only render slot drawn under each fixture's subjects. The charterer
   * call sites omit it (undefined → nothing renders), so their behaviour is unchanged.
   */
  renderFixtureActions?: (fixture: FixtureSummary) => ReactNode;
}
