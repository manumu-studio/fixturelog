// provision-actor.ts — maps an authenticated OIDC user to a business Broker actor.
// First access provisions an AppUser; the broker is linked by matching email, else
// (dev/demo) auto-created, else (production) the caller is refused with 403. Write
// routes must use the returned brokerId rather than trusting request-body fields.
import 'server-only';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverEnv } from '@/lib/env.server';
import type { AuthenticatedUser } from './require-session';

export type ActorResult =
  | { ok: true; brokerId: string; appUserId: string }
  | { ok: false; response: NextResponse };

function notConfigured(): ActorResult {
  return {
    ok: false,
    response: NextResponse.json(
      { error: 'No broker mapping for this account. Contact an administrator.' },
      { status: 403 },
    ),
  };
}

export async function resolveActor(user: AuthenticatedUser): Promise<ActorResult> {
  // 1. Find or create the AppUser for this stable OIDC identity.
  const appUser = await prisma.appUser.upsert({
    where: { externalId: user.externalId },
    update: {},
    create: { externalId: user.externalId, email: user.email, name: user.name },
  });

  // 2. Already linked to a broker.
  if (appUser.brokerId !== null) {
    return { ok: true, brokerId: appUser.brokerId, appUserId: appUser.id };
  }

  // 3. Link by matching broker email.
  const brokerByEmail =
    user.email !== null ? await prisma.broker.findFirst({ where: { email: user.email } }) : null;
  if (brokerByEmail !== null) {
    await prisma.appUser.update({ where: { id: appUser.id }, data: { brokerId: brokerByEmail.id } });
    return { ok: true, brokerId: brokerByEmail.id, appUserId: appUser.id };
  }

  // 4. No broker match: production refuses; dev/demo auto-provisions a broker.
  if (serverEnv.NODE_ENV === 'production') {
    return notConfigured();
  }

  const createdBroker = await prisma.broker.create({
    data: {
      name: user.name ?? user.email ?? 'Demo Broker',
      email: user.email ?? `${user.externalId}@demo.local`,
    },
  });
  await prisma.appUser.update({ where: { id: appUser.id }, data: { brokerId: createdBroker.id } });
  return { ok: true, brokerId: createdBroker.id, appUserId: appUser.id };
}
