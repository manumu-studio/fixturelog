// Unit tests for PATCH /api/fixtures/:id/status — full transition + subject-gate coverage
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fixture: { findUnique: vi.fn(), update: vi.fn() },
    fixtureStatusChange: { create: vi.fn() },
    requirement: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Note: evaluateTransition is NOT mocked — pure function runs for real.
import { PATCH } from './route';
import { prisma } from '@/lib/prisma';

const FIXTURE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';
const BROKER_ID = 'clxxxxxxxxxxxxxxxxxxxxxx04';
const REQUIREMENT_ID = 'clxxxxxxxxxxxxxxxxxxxxxx20';

function makeFixtureStub(
  status: string,
  subjects: { status: string }[],
  requirementId: string | null = null,
) {
  return {
    id: FIXTURE_ID,
    status,
    requirementId,
    vesselId: 'clxxxxxxxxxxxxxxxxxxxxxx02',
    chartererId: 'clxxxxxxxxxxxxxxxxxxxxxx03',
    brokerId: BROKER_ID,
    regionId: 'clxxxxxxxxxxxxxxxxxxxxxx05',
    workscopeId: 'clxxxxxxxxxxxxxxxxxxxxxx06',
    charterType: 'SPOT',
    agreedDayRate: 10000,
    currency: 'USD',
    mobilizationFee: null,
    demobilizationFee: null,
    durationDays: null,
    deliveryPort: null,
    redeliveryPort: null,
    commencement: null,
    charterPartyForm: 'SUPPLYTIME_2017',
    subjectsSummary: null,
    fixedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    subjects,
  };
}

function makePatchRequest(body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(async (cb) => cb(prisma as never));
});

describe('PATCH /api/fixtures/:id/status', () => {
  it('DRAFT → NEGOTIATING succeeds (200) and writes audit record', async () => {
    const updatedFixture = { ...makeFixtureStub('NEGOTIATING', []), subjects: undefined };
    const auditRecord = {
      id: 'clxxxxxxxxxxxxxxxxxxxxxx99',
      fixtureId: FIXTURE_ID,
      fromStatus: 'DRAFT',
      toStatus: 'NEGOTIATING',
      actor: BROKER_ID,
      notes: null,
      createdAt: new Date(),
    };

    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('DRAFT', []) as never,
    );
    vi.mocked(prisma.fixture.update).mockResolvedValue(updatedFixture as never);
    vi.mocked(prisma.fixtureStatusChange.create).mockResolvedValue(auditRecord as never);

    const res = await PATCH(
      makePatchRequest({ toStatus: 'NEGOTIATING', actor: BROKER_ID }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );
    const json = await res.json() as { data: { status: string }; transition: { fromStatus: string } };

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('NEGOTIATING');
    expect(json.transition.fromStatus).toBe('DRAFT');
    expect(prisma.fixtureStatusChange.create).toHaveBeenCalled();
  });

  it('DRAFT → FIXED is illegal (400) with reason containing "not allowed"', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('DRAFT', []) as never,
    );

    const res = await PATCH(
      makePatchRequest({ toStatus: 'FIXED', actor: BROKER_ID }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );
    const json = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/not allowed/i);
    expect(prisma.fixture.update).not.toHaveBeenCalled();
  });

  it('ON_SUBS → FIXED with all subjects LIFTED/WAIVED succeeds; fixedAt stamped; requirement updated (status only)', async () => {
    const fixedFixture = { ...makeFixtureStub('FIXED', [], REQUIREMENT_ID), fixedAt: new Date(), subjects: undefined };
    const auditRecord = {
      id: 'clxxxxxxxxxxxxxxxxxxxxxx99',
      fixtureId: FIXTURE_ID,
      fromStatus: 'ON_SUBS',
      toStatus: 'FIXED',
      actor: BROKER_ID,
      notes: null,
      createdAt: new Date(),
    };

    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('ON_SUBS', [{ status: 'LIFTED' }, { status: 'WAIVED' }], REQUIREMENT_ID) as never,
    );
    vi.mocked(prisma.fixture.update).mockResolvedValue(fixedFixture as never);
    vi.mocked(prisma.fixtureStatusChange.create).mockResolvedValue(auditRecord as never);
    vi.mocked(prisma.requirement.update).mockResolvedValue({ id: REQUIREMENT_ID, status: 'FIXED' } as never);

    const res = await PATCH(
      makePatchRequest({ toStatus: 'FIXED', actor: BROKER_ID }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );
    const json = await res.json() as { data: { fixedAt: string | null } };

    expect(res.status).toBe(200);
    expect(json.data.fixedAt).not.toBeNull();
    expect(prisma.fixture.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FIXED', fixedAt: expect.any(Date) }) }),
    );
    expect(prisma.requirement.update).toHaveBeenCalledWith({
      where: { id: REQUIREMENT_ID },
      data: { status: 'FIXED' },
    });
    // Verify fixedAt is NOT written to requirement
    expect(prisma.requirement.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fixedAt: expect.anything() }) }),
    );
  });

  it('ON_SUBS → FIXED with a PENDING subject returns 400; no fixture write or requirement write', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('ON_SUBS', [{ status: 'LIFTED' }, { status: 'PENDING' }]) as never,
    );

    const res = await PATCH(
      makePatchRequest({ toStatus: 'FIXED', actor: BROKER_ID }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );
    const json = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/unresolved/i);
    expect(prisma.fixture.update).not.toHaveBeenCalled();
    expect(prisma.requirement.update).not.toHaveBeenCalled();
  });

  it('ON_SUBS → FIXED with no subjects returns 400 ("no subjects to lift")', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('ON_SUBS', []) as never,
    );

    const res = await PATCH(
      makePatchRequest({ toStatus: 'FIXED', actor: BROKER_ID }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );
    const json = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/no subjects/i);
    expect(prisma.fixture.update).not.toHaveBeenCalled();
  });

  it('COMPLETED → NEGOTIATING (terminal state) returns 400', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('COMPLETED', []) as never,
    );

    const res = await PATCH(
      makePatchRequest({ toStatus: 'NEGOTIATING', actor: BROKER_ID }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );
    const json = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/terminal/i);
    expect(prisma.fixture.update).not.toHaveBeenCalled();
  });

  it('returns 400 when actor field is missing', async () => {
    const res = await PATCH(
      makePatchRequest({ toStatus: 'NEGOTIATING' }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect(json.details).toBeDefined();
  });

  it('returns 404 when fixture does not exist', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(null);

    const res = await PATCH(
      makePatchRequest({ toStatus: 'NEGOTIATING', actor: BROKER_ID }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Fixture not found');
  });

  it('FIXED → COMPLETED succeeds and COMPLETED → anything returns 400', async () => {
    const completedFixture = { ...makeFixtureStub('COMPLETED', []), subjects: undefined };
    const auditRecord = {
      id: 'clxxxxxxxxxxxxxxxxxxxxxx99',
      fixtureId: FIXTURE_ID,
      fromStatus: 'FIXED',
      toStatus: 'COMPLETED',
      actor: BROKER_ID,
      notes: null,
      createdAt: new Date(),
    };

    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('FIXED', []) as never,
    );
    vi.mocked(prisma.fixture.update).mockResolvedValue(completedFixture as never);
    vi.mocked(prisma.fixtureStatusChange.create).mockResolvedValue(auditRecord as never);

    const res = await PATCH(
      makePatchRequest({ toStatus: 'COMPLETED', actor: BROKER_ID }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );

    expect(res.status).toBe(200);

    // Now attempt from COMPLETED → anything
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(
      makeFixtureStub('COMPLETED', []) as never,
    );

    const res2 = await PATCH(
      makePatchRequest({ toStatus: 'FIXED', actor: BROKER_ID }),
      { params: Promise.resolve({ id: FIXTURE_ID }) },
    );
    const json2 = await res2.json() as { error: string };

    expect(res2.status).toBe(400);
    expect(json2.error).toMatch(/terminal/i);
  });
});
