// Unit tests for POST /api/fixtures/:id/recap
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fixture: { findUnique: vi.fn() },
    recap: { create: vi.fn() },
  },
}));

// Note: formatRecap is NOT mocked — pure function runs for real.
import { POST } from './route';
import { prisma } from '@/lib/prisma';

const FIXTURE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';

function makeFixtureStub(status: string, recaps: { version: number }[] = []) {
  return {
    id: FIXTURE_ID,
    status,
    requirementId: null,
    vesselId: 'clxxxxxxxxxxxxxxxxxxxxxx02',
    chartererId: 'clxxxxxxxxxxxxxxxxxxxxxx03',
    brokerId: 'clxxxxxxxxxxxxxxxxxxxxxx04',
    regionId: 'clxxxxxxxxxxxxxxxxxxxxxx05',
    workscopeId: 'clxxxxxxxxxxxxxxxxxxxxxx06',
    charterType: 'SPOT',
    agreedDayRate: 12000,
    currency: 'GBP',
    mobilizationFee: null,
    demobilizationFee: null,
    durationDays: 30,
    deliveryPort: 'Aberdeen',
    redeliveryPort: 'Aberdeen',
    commencement: new Date('2026-07-01'),
    charterPartyForm: 'SUPPLYTIME_2017',
    subjectsSummary: null,
    fixedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    vessel: {
      id: 'clxxxxxxxxxxxxxxxxxxxxxx02',
      name: 'North Star',
      vesselType: 'PSV',
      owner: { id: 'o1', name: 'North Owners Ltd' },
    },
    charterer: { id: 'clxxxxxxxxxxxxxxxxxxxxxx03', name: 'ChartererCo' },
    region: { id: 'clxxxxxxxxxxxxxxxxxxxxxx05', name: 'North Sea' },
    workscope: { id: 'clxxxxxxxxxxxxxxxxxxxxxx06', name: 'Drilling Support' },
    broker: { id: 'clxxxxxxxxxxxxxxxxxxxxxx04', name: 'John Doe' },
    recaps,
  };
}

const RECAP_STUB = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxx30',
  fixtureId: FIXTURE_ID,
  version: 1,
  generatedMarkdown: '# Fixture Recap',
  generatedText: 'FIXTURE RECAP',
  mainTerms: {},
  approvedByBrokerId: null,
  sentAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/fixtures/:id/recap', () => {
  it('generates a recap for a FIXED fixture with version 1', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('FIXED') as never,
    );
    vi.mocked(prisma.recap.create).mockResolvedValue(RECAP_STUB as never);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/recap`, {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as {
      data: { version: number; generatedMarkdown: string; generatedText: string; mainTerms: unknown };
    };

    expect(res.status).toBe(201);
    expect(json.data.version).toBe(1);
    expect(json.data.generatedMarkdown).toBeDefined();
    expect(json.data.generatedText).toBeDefined();
    expect(json.data.mainTerms).toBeDefined();
    expect(prisma.recap.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 1 }),
      }),
    );
  });

  it('returns 409 for a NEGOTIATING fixture', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('NEGOTIATING') as never,
    );

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/recap`, {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(409);
    expect(json.error).toBe('Recap can only be generated for FIXED or COMPLETED fixtures');
  });

  it('returns 404 when fixture does not exist', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/recap`, {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Fixture not found');
  });

  it('version equals 2 when fixture already has one recap', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('FIXED', [{ version: 1 }]) as never,
    );
    vi.mocked(prisma.recap.create).mockResolvedValue({ ...RECAP_STUB, version: 2 } as never);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/recap`, {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: FIXTURE_ID }) });

    expect(res.status).toBe(201);
    expect(prisma.recap.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 2 }),
      }),
    );
  });

  it('generates a recap for a COMPLETED fixture', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('COMPLETED') as never,
    );
    vi.mocked(prisma.recap.create).mockResolvedValue(RECAP_STUB as never);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/recap`, {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: FIXTURE_ID }) });

    expect(res.status).toBe(201);
  });
});
