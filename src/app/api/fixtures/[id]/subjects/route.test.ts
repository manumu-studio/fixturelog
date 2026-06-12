// Unit tests for POST /api/fixtures/:id/subjects
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fixture: {
      findUnique: vi.fn(),
    },
    subjectItem: {
      create: vi.fn(),
    },
  },
}));

import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const FIXTURE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';
const SUBJECT_STUB = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxx10',
  fixtureId: FIXTURE_ID,
  label: 'Financing subject',
  status: 'PENDING' as const,
  dueAt: null,
  owner: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/fixtures/:id/subjects', () => {
  it('creates a subject with default PENDING status', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue({
      id: FIXTURE_ID,
      requirementId: null,
      vesselId: 'clxxxxxxxxxxxxxxxxxxxxxx02',
      chartererId: 'clxxxxxxxxxxxxxxxxxxxxxx03',
      brokerId: 'clxxxxxxxxxxxxxxxxxxxxxx04',
      regionId: 'clxxxxxxxxxxxxxxxxxxxxxx05',
      workscopeId: 'clxxxxxxxxxxxxxxxxxxxxxx06',
      charterType: 'SPOT',
      status: 'ON_SUBS',
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
    });
    vi.mocked(prisma.subjectItem.create).mockResolvedValue(SUBJECT_STUB);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Financing subject' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { data: { status: string } };

    expect(res.status).toBe(201);
    expect(json.data.status).toBe('PENDING');
  });

  it('creates a subject with explicit status LIFTED', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue({ id: FIXTURE_ID } as never);
    vi.mocked(prisma.subjectItem.create).mockResolvedValue({ ...SUBJECT_STUB, status: 'LIFTED' as const });

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Board approval', status: 'LIFTED' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { data: { status: string } };

    expect(res.status).toBe(201);
    expect(json.data.status).toBe('LIFTED');
  });

  it('returns 400 when label is missing', async () => {
    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect(json.details).toBeDefined();
  });

  it('returns 404 when fixture does not exist', async () => {
    vi.mocked(prisma.fixture.findUnique).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/fixtures/${FIXTURE_ID}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Some subject' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: FIXTURE_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Fixture not found');
  });

  it('returns 400 for invalid fixture ID format', async () => {
    const req = new NextRequest('http://localhost/api/fixtures/not-a-cuid/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Some subject' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'not-a-cuid' }) });
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid fixture ID');
    expect(json.details).toBeDefined();
  });
});
