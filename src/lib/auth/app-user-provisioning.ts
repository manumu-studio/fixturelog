// app-user-provisioning.ts — concurrency-safe AppUser creation for OIDC identities.
// Auth callback, page guards, and API guards may race on first login; a unique-race is
// recovered by re-reading the row created by the winning request.
import 'server-only';
import type { AppUser } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { AuthenticatedUser } from './require-session';

function targetIncludesExternalId(target: unknown): boolean {
  if (Array.isArray(target)) {
    return target.some((field) => field === 'externalId');
  }
  return typeof target === 'string' && target.includes('externalId');
}

function isExternalIdUniqueRace(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const code = Reflect.get(error, 'code');
  const meta = Reflect.get(error, 'meta');
  const target =
    typeof meta === 'object' && meta !== null ? Reflect.get(meta, 'target') : undefined;
  return code === 'P2002' && targetIncludesExternalId(target);
}

export async function findOrCreateAppUser(user: AuthenticatedUser): Promise<AppUser> {
  try {
    return await prisma.appUser.upsert({
      where: { externalId: user.externalId },
      update: {},
      create: { externalId: user.externalId, email: user.email, name: user.name },
    });
  } catch (error) {
    if (!isExternalIdUniqueRace(error)) {
      throw error;
    }
    const appUser = await prisma.appUser.findUnique({ where: { externalId: user.externalId } });
    if (appUser === null) {
      throw error;
    }
    return appUser;
  }
}
