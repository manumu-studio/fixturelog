// portal/page.tsx — charterer dashboard. Server component: resolves the session charterer
// and renders the scoped aggregate (active enquiries, pending actions, fixture timeline).
import { requireCharterer } from '@/lib/auth/require-charterer';
import { getDashboard } from '@/lib/services/portal/portal-queries';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { PortalButton } from '@/components/portal/PortalButton';
import { ActiveEnquiries } from '@/components/portal/ActiveEnquiries';
import { PendingActions } from '@/components/portal/PendingActions';
import { FixtureTimeline } from '@/components/portal/FixtureTimeline';
import styles from './page.module.css';

export default async function PortalDashboardPage() {
  const ctx = await requireCharterer();
  const dashboard = await getDashboard(ctx.chartererId);
  const firstName = ctx.name?.split(' ')[0] ?? 'there';

  return (
    <>
      <PortalPageHeader
        eyebrow="Your portal"
        title={`Welcome back, ${firstName}`}
        subline="What you've requested, what's happening now, and what needs your decision."
        actions={<PortalButton href="/portal/enquiries/new">Create enquiry</PortalButton>}
      />
      <div className={styles.grid}>
        <div className={styles.col}>
          <ActiveEnquiries enquiries={dashboard.activeEnquiries} />
          <FixtureTimeline fixtures={dashboard.timeline} />
        </div>
        <div className={styles.col}>
          <PendingActions actions={dashboard.pendingActions} />
        </div>
      </div>
    </>
  );
}
