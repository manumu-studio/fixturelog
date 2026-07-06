// (app)/dashboard/page.tsx — broker home. The same three zones as the charterer dashboard,
// fed by the broker-wide aggregate. The fixture timeline gains broker-only close-the-deal
// actions (lift subjects, advance status) via FixtureTimeline's optional render slot; the
// charterer portal omits that prop and is unchanged. Links point at the broker workspace.
import { requireBroker } from '@/lib/auth/require-broker';
import { getBrokerDashboard } from '@/lib/services/portal/broker-queries';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { PortalButton } from '@/components/portal/PortalButton';
import { ActiveEnquiries } from '@/components/portal/ActiveEnquiries';
import { PendingActions } from '@/components/portal/PendingActions';
import { FixtureTimeline } from '@/components/portal/FixtureTimeline';
import { FixtureCloseActions } from '@/components/portal/FixtureCloseActions';
import { BrokerCopilot } from '@/components/portal/BrokerCopilot';
import styles from './page.module.css';

const BROKER_HREFS = { enquiry: '/requirements', fixtures: '/requirements', documents: '/requirements' };
const BROKER_EMPTY_CTA = { label: 'Open requirements', href: '/requirements' };

export default async function BrokerDashboardPage() {
  const ctx = await requireBroker();
  const dashboard = await getBrokerDashboard();
  const firstName = ctx.name?.split(' ')[0] ?? 'there';

  return (
    <>
      <PortalPageHeader
        eyebrow="Broker workspace"
        title={`Welcome back, ${firstName}`}
        subline="Your incoming queue across every charterer — enquiries to shortlist, fixtures in progress, and decisions waiting on you."
        actions={<PortalButton href="/requirements">Open the queue</PortalButton>}
      />
      <div className={styles.grid}>
        <div className={styles.col}>
          <ActiveEnquiries
            enquiries={dashboard.activeEnquiries}
            enquiryHrefBase="/requirements"
            emptyCta={BROKER_EMPTY_CTA}
          />
          <FixtureTimeline
            fixtures={dashboard.timeline}
            renderFixtureActions={(fixture) => (
              <FixtureCloseActions
                fixtureId={fixture.id}
                status={fixture.status}
                subjects={fixture.subjects}
                screeningStatus={fixture.screening.status}
              />
            )}
          />
        </div>
        <div className={styles.col}>
          <PendingActions actions={dashboard.pendingActions} hrefs={BROKER_HREFS} />
          <BrokerCopilot />
        </div>
      </div>
    </>
  );
}
