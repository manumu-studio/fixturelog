// Unit tests for resolveActor — AppUser provisioning + broker resolution branches.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthenticatedUser } from './require-session';

const { mockServerEnv } = vi.hoisted(() => ({ mockServerEnv: { NODE_ENV: 'test' } }));

vi.mock('@/lib/env.server', () => ({ serverEnv: mockServerEnv }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    appUser: { upsert: vi.fn(), update: vi.fn() },
    broker: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

import { resolveActor } from './provision-actor';
import { prisma } from '@/lib/prisma';

const USER: AuthenticatedUser = { externalId: 'ext-1', email: 'broker@example.com', name: 'Broker A' };

beforeEach(() => {
  vi.clearAllMocks();
  mockServerEnv.NODE_ENV = 'test';
});

describe('resolveActor', () => {
  it('returns the existing broker when the AppUser is already linked', async () => {
    vi.mocked(prisma.appUser.upsert).mockResolvedValue({ id: 'u1', brokerId: 'b1' } as never);

    const result = await resolveActor(USER);

    expect(result).toEqual({ ok: true, brokerId: 'b1', appUserId: 'u1' });
    expect(prisma.broker.findFirst).not.toHaveBeenCalled();
  });

  it('links the AppUser to a broker matched by email', async () => {
    vi.mocked(prisma.appUser.upsert).mockResolvedValue({ id: 'u1', brokerId: null } as never);
    vi.mocked(prisma.broker.findFirst).mockResolvedValue({ id: 'b2' } as never);

    const result = await resolveActor(USER);

    expect(result).toEqual({ ok: true, brokerId: 'b2', appUserId: 'u1' });
    expect(prisma.appUser.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { brokerId: 'b2' } });
    expect(prisma.broker.create).not.toHaveBeenCalled();
  });

  it('auto-creates a broker in dev/demo when no broker matches', async () => {
    vi.mocked(prisma.appUser.upsert).mockResolvedValue({ id: 'u1', brokerId: null } as never);
    vi.mocked(prisma.broker.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.broker.create).mockResolvedValue({ id: 'b3' } as never);

    const result = await resolveActor(USER);

    expect(result).toEqual({ ok: true, brokerId: 'b3', appUserId: 'u1' });
    expect(prisma.broker.create).toHaveBeenCalled();
  });

  it('refuses with 403 in production when no broker matches', async () => {
    mockServerEnv.NODE_ENV = 'production';
    vi.mocked(prisma.appUser.upsert).mockResolvedValue({ id: 'u1', brokerId: null } as never);
    vi.mocked(prisma.broker.findFirst).mockResolvedValue(null);

    const result = await resolveActor(USER);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
    expect(prisma.broker.create).not.toHaveBeenCalled();
  });
});
