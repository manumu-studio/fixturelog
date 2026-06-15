// broker-queries.test.ts — covers broker-wide dashboard aggregation.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    requirement: { findMany: vi.fn(), count: vi.fn() },
    fixture: { findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { getBrokerDashboard } from './broker-queries';
import type { FixtureRow, RequirementRow } from './portal-mappers';

const createdAt = new Date('2026-06-15T09:00:00.000Z');
const startDate = new Date('2026-07-01T00:00:00.000Z');
const laterDue = new Date('2026-07-07T00:00:00.000Z');
const earlierDue = new Date('2026-07-03T00:00:00.000Z');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBrokerDashboard', () => {
  it('builds broker actions and counts from open enquiries and fixtures', async () => {
    const requirements: RequirementRow[] = [
      {
        id: 'req-1',
        status: 'ENQUIRY',
        vesselTypeNeeded: 'PSV',
        charterType: 'SPOT',
        startDate,
        endDate: null,
        durationDays: 12,
        dayRateBudget: 82000,
        notes: null,
        createdAt,
        region: { name: 'North Sea', code: 'NORTH_SEA' },
        workscope: { name: 'Platform supply' },
      },
    ];
    const fixtures: FixtureRow[] = [
      {
        id: 'fixture-1',
        status: 'FIXED',
        agreedDayRate: 56798,
        currency: 'GBP',
        commencement: startDate,
        durationDays: 21,
        vessel: { name: 'Island Challenger', vesselType: 'AHTS' },
        region: { name: 'North Sea' },
        subjects: [
          { id: 'subject-1', label: 'Client approval', status: 'PENDING', dueAt: laterDue, owner: 'Client' },
          { id: 'subject-2', label: 'Port clearance', status: 'PENDING', dueAt: earlierDue, owner: 'Broker' },
          { id: 'subject-3', label: 'Stem agreed', status: 'LIFTED', dueAt: null, owner: null },
        ],
        weatherSnapshots: [],
      },
    ];

    vi.mocked(prisma.requirement.findMany).mockResolvedValue(requirements as never);
    vi.mocked(prisma.fixture.findMany).mockResolvedValue(fixtures as never);
    vi.mocked(prisma.requirement.count).mockResolvedValue(4);

    const dashboard = await getBrokerDashboard();

    expect(dashboard.counts).toEqual({ enquiries: 4, fixtures: 1, openSubjects: 2 });
    expect(dashboard.activeEnquiries).toHaveLength(1);
    expect(dashboard.timeline).toHaveLength(1);
    expect(dashboard.pendingActions).toEqual([
      {
        id: 'enq-req-1',
        kind: 'REVIEW_SHORTLIST',
        label: 'Shortlist vessels for the PSV enquiry in North Sea',
        enquiryId: 'req-1',
        fixtureId: null,
        dueAt: null,
      },
      {
        id: 'subj-fixture-1',
        kind: 'RESOLVE_SUBJECTS',
        label: 'Chase 2 open subjects on Island Challenger',
        enquiryId: null,
        fixtureId: 'fixture-1',
        dueAt: earlierDue.toISOString(),
      },
      {
        id: 'recap-fixture-1',
        kind: 'REVIEW_RECAP',
        label: 'Confirm the recap for Island Challenger',
        enquiryId: null,
        fixtureId: 'fixture-1',
        dueAt: null,
      },
    ]);
  });
});
