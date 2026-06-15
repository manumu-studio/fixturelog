// portal-queries.test.ts — covers charterer-scoped portal service functions.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    requirement: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
    fixture: { findMany: vi.fn() },
    recap: { findMany: vi.fn() },
    region: { findUnique: vi.fn() },
    workscope: { findUnique: vi.fn() },
  },
}));

vi.mock('./portal-shortlist', () => ({
  computeShortlist: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { computeShortlist } from './portal-shortlist';
import {
  createEnquiry,
  getDashboard,
  getEnquiryDetail,
  listDocuments,
  type CreateEnquiryResult,
} from './portal-queries';
import type { FixtureRow, RecapRow, RequirementRow } from './portal-mappers';
import type { PortalEnquiryCreateInput, ShortlistEntry } from '@/lib/validators/portal.validators';

const createdAt = new Date('2026-06-15T09:00:00.000Z');
const startDate = new Date('2026-07-01T00:00:00.000Z');
const dueAt = new Date('2026-07-04T00:00:00.000Z');

const requirement: RequirementRow = {
  id: 'req-1',
  status: 'SHORTLISTED',
  vesselTypeNeeded: 'AHTS',
  charterType: 'SPOT',
  startDate,
  endDate: null,
  durationDays: 14,
  dayRateBudget: 55000,
  notes: null,
  createdAt,
  region: { name: 'North Sea', code: 'NORTH_SEA' },
  workscope: { name: 'Anchor handling' },
};

const fixture: FixtureRow = {
  id: 'fixture-1',
  status: 'FIXED',
  agreedDayRate: 56798,
  currency: 'GBP',
  commencement: startDate,
  durationDays: 21,
  vessel: { name: 'Island Challenger', vesselType: 'AHTS' },
  region: { name: 'North Sea' },
  subjects: [{ id: 'subject-1', label: 'Client approval', status: 'PENDING', dueAt, owner: 'Client' }],
  weatherSnapshots: [{ workabilityVerdict: 'WORKABLE', fetchedAt: createdAt }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('portal query services', () => {
  it('builds a charterer dashboard from scoped enquiries and fixtures', async () => {
    vi.mocked(prisma.requirement.findMany).mockResolvedValue([requirement] as never);
    vi.mocked(prisma.fixture.findMany).mockResolvedValue([fixture] as never);
    vi.mocked(prisma.requirement.count).mockResolvedValue(3);

    const dashboard = await getDashboard('charterer-1');

    expect(prisma.requirement.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { chartererId: 'charterer-1' },
    }));
    expect(dashboard.counts).toEqual({ enquiries: 3, fixtures: 1, openSubjects: 1 });
    expect(dashboard.pendingActions.map((a) => a.kind)).toEqual([
      'REVIEW_SHORTLIST',
      'RESOLVE_SUBJECTS',
      'REVIEW_RECAP',
    ]);
  });

  it('returns recap documents for the session charterer fixtures', async () => {
    const recap: RecapRow = {
      id: 'recap-1',
      version: 1,
      approvedByBrokerId: null,
      createdAt,
      generatedMarkdown: '# Recap',
      generatedText: 'Recap text',
      fixture: { vessel: { name: 'Skandi Vega' } },
      fixtureId: 'fixture-2',
    };
    vi.mocked(prisma.recap.findMany).mockResolvedValue([recap] as never);

    const docs = await listDocuments('charterer-1');

    expect(prisma.recap.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { fixture: { chartererId: 'charterer-1' } },
    }));
    expect(docs).toEqual([
      {
        id: 'recap-1',
        fixtureId: 'fixture-2',
        vesselName: 'Skandi Vega',
        version: 1,
        isFinal: false,
        createdAt: createdAt.toISOString(),
        generatedMarkdown: '# Recap',
        generatedText: 'Recap text',
      },
    ]);
  });

  it('returns enquiry detail with a computed shortlist', async () => {
    const detailRow = {
      ...requirement,
      region: { ...requirement.region, centerLat: 57.1, centerLng: -2.1 },
    };
    const shortlist: ShortlistEntry[] = [
      {
        vesselId: 'vessel-1',
        vesselName: 'Island Challenger',
        vesselType: 'AHTS',
        dpClass: 'DP3',
        deckAreaM2: 620,
        bollardPullT: 300,
        status: 'OPEN',
        imageUrl: '/assets/vessels/real/island-challenger.jpg',
        score: 95,
        rank: 1,
        factors: { distance: 98, rateFit: 90, capabilityMargin: 96 },
      },
    ];
    vi.mocked(prisma.requirement.findFirst).mockResolvedValue(detailRow as never);
    vi.mocked(computeShortlist).mockResolvedValue(shortlist);

    const detail = await getEnquiryDetail('charterer-1', 'req-1');

    expect(detail?.enquiry.id).toBe('req-1');
    expect(detail?.shortlist).toEqual(shortlist);
  });

  it('returns null for another charterer enquiry', async () => {
    vi.mocked(prisma.requirement.findFirst).mockResolvedValue(null);

    await expect(getEnquiryDetail('charterer-1', 'req-foreign')).resolves.toBeNull();
    expect(computeShortlist).not.toHaveBeenCalled();
  });

  it('creates enquiries from session-owned region and workscope ids', async () => {
    const input: PortalEnquiryCreateInput = {
      vesselTypeNeeded: 'PSV',
      regionCode: 'NORTH_SEA',
      workscopeCode: 'SUPPLY',
      startDate,
      charterType: 'SPOT',
      durationDays: 10,
      dayRateBudget: 82000,
    };
    vi.mocked(prisma.region.findUnique).mockResolvedValue({ id: 'region-1' });
    vi.mocked(prisma.workscope.findUnique).mockResolvedValue({ id: 'workscope-1' });
    vi.mocked(prisma.requirement.create).mockResolvedValue(requirement as never);

    const result = await createEnquiry('charterer-1', input);

    expect(result).toEqual<CreateEnquiryResult>({ ok: true, enquiry: expect.objectContaining({ id: 'req-1' }) });
    expect(prisma.requirement.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        chartererId: 'charterer-1',
        regionId: 'region-1',
        workscopeId: 'workscope-1',
        sourceChannel: 'Portal',
      }),
    }));
  });

  it('rejects unknown region or workscope codes before creating', async () => {
    const input: PortalEnquiryCreateInput = {
      vesselTypeNeeded: 'PSV',
      regionCode: 'NORTH_SEA',
      workscopeCode: 'SUPPLY',
      startDate,
      charterType: 'SPOT',
    };
    vi.mocked(prisma.region.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.workscope.findUnique).mockResolvedValue({ id: 'workscope-1' });

    await expect(createEnquiry('charterer-1', input)).resolves.toEqual({ ok: false, reason: 'region' });
    expect(prisma.requirement.create).not.toHaveBeenCalled();

    vi.mocked(prisma.region.findUnique).mockResolvedValue({ id: 'region-1' });
    vi.mocked(prisma.workscope.findUnique).mockResolvedValue(null);

    await expect(createEnquiry('charterer-1', input)).resolves.toEqual({ ok: false, reason: 'workscope' });
    expect(prisma.requirement.create).not.toHaveBeenCalled();
  });
});
