import type { EnquirySummary } from '@/lib/validators/portal.validators';

export interface ActiveEnquiriesProps {
  enquiries: EnquirySummary[];
  /** Base path each row links to (default the charterer portal detail). */
  enquiryHrefBase?: string;
  /** Empty-state CTA (default the charterer "Create enquiry"). */
  emptyCta?: { label: string; href: string };
}
