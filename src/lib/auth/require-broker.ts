// require-broker.ts — server-only broker session guards (page + API). Turns an authenticated
// session into a broker context, bouncing charterers to the portal and anonymous visitors to
// the landing; the API guard returns 401 for anonymous and 403 for charterer callers. brokerId
// comes from the provisioned AppUser only (via resolveActor), never from a body or query param.
import 'server-only';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, requireApiSession, type AuthenticatedUser } from './require-session';
import { resolveActor } from './provision-actor';
import { ACCESS_NOT_CONFIGURED_ROUTE } from './require-charterer';

export type BrokerContext = {
  brokerId: string;
  appUserId: string;
  email: string | null;
  name: string | null;
};

// True when the identity is already a charterer (linked or role CLIENT) — such a session
// belongs in the portal, never the broker workspace.
async function isCharterer(externalId: string): Promise<boolean> {
  const appUser = await prisma.appUser.findUnique({
    where: { externalId },
    select: { chartererId: true, role: true },
  });
  return appUser !== null && (appUser.chartererId !== null || appUser.role === 'CLIENT');
}

/**
 * Page guard for the broker workspace. Returns the broker context, or redirects:
 * charterer -> /portal, anonymous -> /, unprovisioned (prod) -> onboarding notice.
 */
export async function requireBroker(): Promise<BrokerContext> {
  const user = await requireSession(); // redirects anonymous visitors to '/'
  if (await isCharterer(user.externalId)) {
    redirect('/portal');
  }
  const actor = await resolveActor(user);
  if (!actor.ok) {
    redirect(ACCESS_NOT_CONFIGURED_ROUTE);
  }
  return { brokerId: actor.brokerId, appUserId: actor.appUserId, email: user.email, name: user.name };
}

/**
 * API guard for broker-only routes. Returns the broker context, or a JSON error:
 * 401 anonymous, 403 charterer or unprovisioned.
 */
export async function requireBrokerApi(): Promise<
  { ok: true; ctx: BrokerContext } | { ok: false; response: NextResponse }
> {
  const session = await requireApiSession(); // 401 JSON for anonymous callers
  if (!session.ok) {
    return { ok: false, response: session.response };
  }
  const user: AuthenticatedUser = session.user;
  if (await isCharterer(user.externalId)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden: this is a charterer account.' },
        { status: 403 },
      ),
    };
  }
  const actor = await resolveActor(user);
  if (!actor.ok) {
    return { ok: false, response: actor.response };
  }
  return {
    ok: true,
    ctx: { brokerId: actor.brokerId, appUserId: actor.appUserId, email: user.email, name: user.name },
  };
}
