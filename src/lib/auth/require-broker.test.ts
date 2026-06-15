// Unit tests for the broker guards (mirror of require-charterer): broker -> context,
// charterer -> redirect/403, anonymous -> redirect/401, unprovisioned -> onboarding/403.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';

vi.mock('@/features/auth/auth', () => ({ auth: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock('@/lib/env.server', () => ({ serverEnv: { NODE_ENV: 'test' } }));
vi.mock('@/lib/prisma', () => ({ prisma: { appUser: { findUnique: vi.fn() } } }));
vi.mock('./provision-actor', () => ({ resolveActor: vi.fn() }));

import { requireBroker, requireBrokerApi } from './require-broker';
import { auth } from '@/features/auth/auth';
import { prisma } from '@/lib/prisma';
import { resolveActor } from './provision-actor';
import { NextResponse } from 'next/server';

const db = prisma as unknown as { appUser: { findUnique: ReturnType<typeof vi.fn> } };

function session(user: Partial<Session['user']> = {}): Session {
  return {
    user: {
      externalId: 'ext-1',
      email: 'broker@fixturelog.demo',
      name: 'Broker A',
      image: null,
      ...user,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.appUser.findUnique.mockResolvedValue(null);
  vi.mocked(resolveActor).mockResolvedValue({ ok: true, brokerId: 'br-1', appUserId: 'au-1' });
});

describe('requireBroker (page guard)', () => {
  it('returns a broker context for a broker session', async () => {
    vi.mocked(auth).mockResolvedValue(session());

    const ctx = await requireBroker();

    expect(ctx.brokerId).toBe('br-1');
    expect(ctx.appUserId).toBe('au-1');
  });

  it('redirects a charterer session to the portal', async () => {
    vi.mocked(auth).mockResolvedValue(session());
    db.appUser.findUnique.mockResolvedValue({ chartererId: 'ch-1', role: 'CLIENT' });

    await expect(requireBroker()).rejects.toThrow('REDIRECT:/portal');
  });

  it('redirects anonymous visitors to the landing', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(requireBroker()).rejects.toThrow('REDIRECT:/');
  });

  it('redirects an unprovisioned broker to the onboarding notice', async () => {
    vi.mocked(auth).mockResolvedValue(session());
    vi.mocked(resolveActor).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'x' }, { status: 403 }),
    });

    await expect(requireBroker()).rejects.toThrow('REDIRECT:/?notice=access-not-configured');
  });
});

describe('requireBrokerApi (API guard)', () => {
  it('returns ok + ctx for a broker', async () => {
    vi.mocked(auth).mockResolvedValue(session());

    const res = await requireBrokerApi();

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.ctx.brokerId).toBe('br-1');
    }
  });

  it('returns 403 for a charterer', async () => {
    vi.mocked(auth).mockResolvedValue(session());
    db.appUser.findUnique.mockResolvedValue({ chartererId: 'ch-1', role: 'CLIENT' });

    const res = await requireBrokerApi();

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(403);
    }
  });

  it('returns 401 for anonymous callers', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const res = await requireBrokerApi();

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(401);
    }
  });
});
