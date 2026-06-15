// Unit tests for PATCH /api/fixtures/:id/subjects/:subjectId
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subjectItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Broker-only mutation: gate at the boundary so handler tests run as an authenticated broker.
vi.mock('@/lib/auth/require-broker', () => ({ requireBrokerApi: vi.fn() }));

import { PATCH } from './route';
import { prisma } from '@/lib/prisma';
import { requireBrokerApi } from '@/lib/auth/require-broker';
import { NextRequest } from 'next/server';

const FIXTURE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';
const SUBJECT_ID = 'clxxxxxxxxxxxxxxxxxxxxxx10';

const SUBJECT_STUB = {
  id: SUBJECT_ID,
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
  vi.mocked(requireBrokerApi).mockResolvedValue({
    ok: true,
    ctx: { brokerId: 'br-1', appUserId: 'au-1', email: null, name: null },
  });
});

describe('PATCH /api/fixtures/:id/subjects/:subjectId', () => {
  it('lifts a subject by setting status to LIFTED', async () => {
    vi.mocked(prisma.subjectItem.findUnique).mockResolvedValue(SUBJECT_STUB);
    vi.mocked(prisma.subjectItem.update).mockResolvedValue({ ...SUBJECT_STUB, status: 'LIFTED' as const });

    const req = new NextRequest(
      `http://localhost/api/fixtures/${FIXTURE_ID}/subjects/${SUBJECT_ID}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LIFTED' }),
      },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: FIXTURE_ID, subjectId: SUBJECT_ID }) });
    const json = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('LIFTED');
  });

  it('returns 400 for empty body (at least one field required)', async () => {
    const req = new NextRequest(
      `http://localhost/api/fixtures/${FIXTURE_ID}/subjects/${SUBJECT_ID}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: FIXTURE_ID, subjectId: SUBJECT_ID }) });
    const json = await res.json() as { error: string; details: unknown[] };

    expect(res.status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect(json.details).toBeDefined();
  });

  it('returns 404 when subject does not exist', async () => {
    vi.mocked(prisma.subjectItem.findUnique).mockResolvedValue(null);

    const req = new NextRequest(
      `http://localhost/api/fixtures/${FIXTURE_ID}/subjects/${SUBJECT_ID}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LIFTED' }),
      },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: FIXTURE_ID, subjectId: SUBJECT_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Subject not found for this fixture');
  });

  it('returns 404 when subject belongs to a different fixture', async () => {
    vi.mocked(prisma.subjectItem.findUnique).mockResolvedValue({
      ...SUBJECT_STUB,
      fixtureId: 'clxxxxxxxxxxxxxxxxxxxxxx99',
    });

    const req = new NextRequest(
      `http://localhost/api/fixtures/${FIXTURE_ID}/subjects/${SUBJECT_ID}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LIFTED' }),
      },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: FIXTURE_ID, subjectId: SUBJECT_ID }) });
    const json = await res.json() as { error: string };

    expect(res.status).toBe(404);
    expect(json.error).toBe('Subject not found for this fixture');
  });
});
