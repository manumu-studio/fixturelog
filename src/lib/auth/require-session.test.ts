// Unit tests for the require-session guards (authenticated + anonymous paths).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';

vi.mock('@/features/auth/auth', () => ({ auth: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { requireSession, requireApiSession } from './require-session';
import { auth } from '@/features/auth/auth';
import { redirect } from 'next/navigation';

function sessionWith(user: Partial<Session['user']>): Session {
  return {
    user: { externalId: 'ext-1', email: 'broker@example.com', name: 'Broker A', image: null, ...user },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireSession', () => {
  it('returns the minimal user when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(sessionWith({}));

    const user = await requireSession();

    expect(user).toEqual({ externalId: 'ext-1', email: 'broker@example.com', name: 'Broker A' });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('coerces undefined email/name to null', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { externalId: 'ext-2' },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });

    const user = await requireSession();

    expect(user).toEqual({ externalId: 'ext-2', email: null, name: null });
  });

  it('redirects anonymous visitors to the public landing', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(requireSession()).rejects.toThrow('REDIRECT:/');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});

describe('requireApiSession', () => {
  it('returns ok + user when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(sessionWith({ externalId: 'ext-9' }));

    const result = await requireApiSession();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.externalId).toBe('ext-9');
    }
  });

  it('returns a 401 JSON response when anonymous', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const result = await requireApiSession();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json() as { error: string };
      expect(body.error).toBe('Unauthorized');
    }
  });
});
