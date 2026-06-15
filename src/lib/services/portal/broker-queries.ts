// broker-queries.ts — broker-wide dashboard aggregate. Same DashboardData shape as the
// charterer dashboard, but NOT charterer-scoped: it is the brokerage's incoming queue across
// every charterer. Reuses the portal mappers + selects.
import 'server-only';
import type { FixtureStatus, RequirementStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { toEnquirySummary, toFixtureSummary } from './portal-mappers';
import { ENQUIRY_INCLUDE, FIXTURE_INCLUDE } from './portal-queries';
import type {
  Dashboard, EnquirySummary, FixtureSummary, PendingAction,
} from '@/lib/validators/portal.validators';

const ACTIVE_STATUSES: RequirementStatus[] = ['ENQUIRY', 'SHORTLISTED', 'NEGOTIATING', 'ON_SUBS'];
const TIMELINE_STATUSES: FixtureStatus[] = ['NEGOTIATING', 'ON_SUBS', 'FIXED'];
const QUEUE_LIMIT = 50;

function earliestDue(subjects: FixtureSummary['subjects']): string | null {
  const due = subjects
    .filter((s) => s.status === 'PENDING')
    .map((s) => s.dueAt)
    .filter((d): d is string => d !== null)
    .sort();
  return due[0] ?? null;
}

// Broker-oriented decisions derived from current statuses (run a match, chase subjects,
// confirm a recap), reusing the shared PendingAction kinds.
function deriveBrokerActions(
  enquiries: EnquirySummary[],
  fixtures: FixtureSummary[],
): PendingAction[] {
  const actions: PendingAction[] = [];
  for (const e of enquiries) {
    if (e.status === 'ENQUIRY') {
      actions.push({
        id: `enq-${e.id}`,
        kind: 'REVIEW_SHORTLIST',
        label: `Shortlist vessels for the ${e.vesselTypeNeeded} enquiry in ${e.regionName}`,
        enquiryId: e.id,
        fixtureId: null,
        dueAt: null,
      });
    }
  }
  for (const f of fixtures) {
    const pending = f.subjects.filter((s) => s.status === 'PENDING');
    if (pending.length > 0) {
      actions.push({
        id: `subj-${f.id}`,
        kind: 'RESOLVE_SUBJECTS',
        label: `Chase ${pending.length} open subject${pending.length > 1 ? 's' : ''} on ${f.vesselName}`,
        enquiryId: null,
        fixtureId: f.id,
        dueAt: earliestDue(f.subjects),
      });
    }
    if (f.status === 'FIXED') {
      actions.push({
        id: `recap-${f.id}`,
        kind: 'REVIEW_RECAP',
        label: `Confirm the recap for ${f.vesselName}`,
        enquiryId: null,
        fixtureId: f.id,
        dueAt: null,
      });
    }
  }
  return actions;
}

export async function getBrokerDashboard(): Promise<Dashboard> {
  const [requirements, fixtures, enquiryCount] = await Promise.all([
    prisma.requirement.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      include: ENQUIRY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: QUEUE_LIMIT,
    }),
    prisma.fixture.findMany({
      where: { status: { in: TIMELINE_STATUSES } },
      include: FIXTURE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: QUEUE_LIMIT,
    }),
    prisma.requirement.count(),
  ]);

  const activeEnquiries = requirements.map(toEnquirySummary);
  const timeline = fixtures.map(toFixtureSummary);
  const openSubjects = timeline.reduce(
    (n, f) => n + f.subjects.filter((s) => s.status === 'PENDING').length,
    0,
  );

  return {
    activeEnquiries,
    pendingActions: deriveBrokerActions(activeEnquiries, timeline),
    timeline,
    counts: { enquiries: enquiryCount, fixtures: timeline.length, openSubjects },
  };
}
