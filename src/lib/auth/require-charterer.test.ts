// Unit tests for the charterer guards: client (linked + email match), broker
// (linked + email match), unmapped (page + API, production), dev auto-link, anonymous.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';

vi.mock('@/features/auth/auth', () => ({ auth: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock('@/lib/env.server', () => ({ serverEnv: { NODE_ENV: 'test' } }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    appUser: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    broker: { findFirst: vi.fn() },
    charterer: { findFirst: vi.fn() },
  },
}));

import {
  requireCharterer,
  requireChartererApi,
  ACCESS_NOT_CONFIGURED_ROUTE,
} from './require-charterer';
import { auth } from '@/features/auth/auth';
import { prisma } from '@/lib/prisma';
import { serverEnv } from '@/lib/env.server';

// Loose mock view of the methods this module touches (tests use `as` deliberately).
const db = prisma as unknown as {
  appUser: {
    upsert: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  broker: { findFirst: ReturnType<typeof vi.fn> };
  charterer: { findFirst: ReturnType<typeof vi.fn> };
};
const env = serverEnv as unknown as { NODE_ENV: string };

function session(user: Partial<Session['user']> = {}): Session {
  return {
    user: {
      externalId: 'ext-1',
      email: 'client@charterer.example',
      name: 'Client A',
      image: null,
      ...user,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

function appUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'au-1',
    externalId: 'ext-1',
    email: 'client@charterer.example',
    name: 'Client A',
    brokerId: null,
    chartererId: null,
    role: 'BROKER',
    ...overrides,
  };
}

function externalIdRaceError(): Error & { code: string; meta: { target: string[] } } {
  return Object.assign(new Error('Unique constraint failed on the fields: (`externalId`)'), {
    code: 'P2002',
    meta: { target: ['externalId'] },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  env.NODE_ENV = 'test';
  db.appUser.update.mockResolvedValue(appUser());
  db.appUser.findUnique.mockResolvedValue(null);
  db.broker.findFirst.mockResolvedValue(null);
  db.charterer.findFirst.mockResolvedValue(null);
});

describe('requireCharterer (page guard)', () => {
  it('resolves an already-linked charterer to a CLIENT context', async () => {
    vi.mocked(auth).mockResolvedValue(session());
    db.appUser.upsert.mockResolvedValue(appUser({ chartererId: 'ch-1' }));

    const ctx = await requireCharterer();

    expect(ctx.chartererId).toBe('ch-1');
    expect(ctx.appUserId).toBe('au-1');
    expect(db.appUser.update).not.toHaveBeenCalled();
  });

  it('links an unmapped identity whose email matches a charterer contact', async () => {
    vi.mocked(auth).mockResolvedValue(session());
    db.appUser.upsert.mockResolvedValue(appUser());
    db.charterer.findFirst.mockImplementation((args: { where?: { contactEmail?: string } }) =>
      Promise.resolve(args?.where?.contactEmail ? { id: 'ch-2' } : null),
    );

    const ctx = await requireCharterer();

    expect(ctx.chartererId).toBe('ch-2');
    expect(db.appUser.update).toHaveBeenCalledWith({
      where: { id: 'au-1' },
      data: { chartererId: 'ch-2', role: 'CLIENT' },
    });
  });

  it('recovers when a concurrent request already created the AppUser', async () => {
    vi.mocked(auth).mockResolvedValue(session());
    db.appUser.upsert.mockRejectedValue(externalIdRaceError());
    db.appUser.findUnique.mockResolvedValue(appUser({ chartererId: 'ch-race' }));

    const ctx = await requireCharterer();

    expect(ctx.chartererId).toBe('ch-race');
    expect(db.appUser.findUnique).toHaveBeenCalledWith({
      where: { externalId: 'ext-1' },
    });
  });

  it('auto-links the first seeded charterer in dev/demo when nothing matches', async () => {
    vi.mocked(auth).mockResolvedValue(session({ email: 'unknown@nowhere.example' }));
    db.appUser.upsert.mockResolvedValue(appUser({ email: 'unknown@nowhere.example' }));
    db.charterer.findFirst.mockImplementation((args: { where?: { contactEmail?: string } }) =>
      Promise.resolve(args?.where?.contactEmail ? null : { id: 'demo-1' }),
    );

    const ctx = await requireCharterer();

    expect(ctx.chartererId).toBe('demo-1');
  });

  it('redirects a broker-linked identity to the broker dashboard', async () => {
    vi.mocked(auth).mockResolvedValue(session({ email: 'broker@fixturelog.demo' }));
    db.appUser.upsert.mockResolvedValue(appUser({ brokerId: 'br-1' }));

    await expect(requireCharterer()).rejects.toThrow('REDIRECT:/dashboard');
  });

  it('redirects an unmapped client to the onboarding notice in production', async () => {
    env.NODE_ENV = 'production';
    vi.mocked(auth).mockResolvedValue(session());
    db.appUser.upsert.mockResolvedValue(appUser());

    await expect(requireCharterer()).rejects.toThrow(`REDIRECT:${ACCESS_NOT_CONFIGURED_ROUTE}`);
  });

  it('redirects anonymous visitors to the public landing', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(requireCharterer()).rejects.toThrow('REDIRECT:/');
  });
});

describe('requireChartererApi (API guard)', () => {
  it('returns ok + ctx for a linked charterer', async () => {
    vi.mocked(auth).mockResolvedValue(session());
    db.appUser.upsert.mockResolvedValue(appUser({ chartererId: 'ch-1' }));

    const res = await requireChartererApi();

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.ctx.chartererId).toBe('ch-1');
    }
  });

  it('returns 403 for a broker email', async () => {
    vi.mocked(auth).mockResolvedValue(session({ email: 'broker@fixturelog.demo' }));
    db.appUser.upsert.mockResolvedValue(appUser({ email: 'broker@fixturelog.demo' }));
    db.broker.findFirst.mockResolvedValue({ id: 'br-9' });

    const res = await requireChartererApi();

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(403);
    }
  });

  it('returns 403 for an unmapped client in production', async () => {
    env.NODE_ENV = 'production';
    vi.mocked(auth).mockResolvedValue(session());
    db.appUser.upsert.mockResolvedValue(appUser());

    const res = await requireChartererApi();

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(403);
    }
  });

  it('returns 401 for anonymous callers', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const res = await requireChartererApi();

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(401);
    }
  });
});
