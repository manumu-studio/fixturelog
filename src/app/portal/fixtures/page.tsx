// portal/fixtures/page.tsx — My Fixtures: the session charterer's fixtures with status,
// subjects, and weather verdict. Read-only (no transitions from the portal in this packet).
import { requireCharterer } from '@/lib/auth/require-charterer';
import { listFixtures } from '@/lib/services/portal/portal-queries';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { FixtureTimeline } from '@/components/portal/FixtureTimeline';

export default async function MyFixturesPage() {
  const ctx = await requireCharterer();
  const fixtures = await listFixtures(ctx.chartererId);

  return (
    <>
      <PortalPageHeader
        eyebrow="Operations"
        title="My fixtures"
        subline="Your active and historic fixtures, with open subjects and the latest weather verdict."
      />
      <FixtureTimeline
        fixtures={fixtures}
        emptyMessage="Once one of your enquiries is fixed, it will appear here with its subjects and weather."
      />
    </>
  );
}
