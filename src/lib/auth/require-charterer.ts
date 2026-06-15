// require-charterer.ts — server-only guards that turn an authenticated session into a
// charterer (client) context. Brokers are bounced to their workspace, anonymous
// visitors to the public landing, and unmapped clients to an onboarding notice.
// `chartererId` is derived from the provisioned AppUser only — never from a body or
// query param — so every portal read/write is scoped to the session's own charterer.
import 'server-only';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverEnv } from '@/lib/env.server';
import { findOrCreateAppUser } from './app-user-provisioning';
import {
  requireSession,
  requireApiSession,
  type AuthenticatedUser,
} from './require-session';

export type ChartererContext = {
  chartererId: string;
  appUserId: string;
  email: string | null;
  name: string | null;
};

// Where an unmapped client is sent: the public landing with an onboarding notice.
// (Dev/demo auto-links a seeded charterer, so this only fires in production.)
export const ACCESS_NOT_CONFIGURED_ROUTE = '/?notice=access-not-configured';

// Broker sessions hitting the portal are bounced to the broker home (the broker
// dashboard).
const BROKER_HOME = '/dashboard';

// Dev/demo auto-link target: the seeded charterer with a full story (enquiries + an
// ON_SUBS fixture + a FIXED fixture + recap). Falls back to the first charterer.
const DEMO_CHARTERER_NAME = 'Equinor ASA';

type ChartererResolution =
  | { kind: 'client'; ctx: ChartererContext }
  | { kind: 'broker' }
  | { kind: 'unmapped' };

function clientResolution(
  appUserId: string,
  chartererId: string,
  user: AuthenticatedUser,
): ChartererResolution {
  return {
    kind: 'client',
    ctx: { chartererId, appUserId, email: user.email, name: user.name },
  };
}

async function linkCharterer(
  appUserId: string,
  chartererId: string,
  user: AuthenticatedUser,
): Promise<ChartererResolution> {
  await prisma.appUser.update({
    where: { id: appUserId },
    data: { chartererId, role: 'CLIENT' },
  });
  return clientResolution(appUserId, chartererId, user);
}

// Decide, and durably provision, what an authenticated identity is in the portal.
async function resolveChartererContext(user: AuthenticatedUser): Promise<ChartererResolution> {
  // 1. Ensure an AppUser exists for this stable OIDC identity.
  const appUser = await findOrCreateAppUser(user);

  // 2. Already a broker, or 3. already a linked client.
  if (appUser.brokerId !== null) {
    return { kind: 'broker' };
  }
  if (appUser.chartererId !== null) {
    return clientResolution(appUser.id, appUser.chartererId, user);
  }

  // 4. Unmapped: an email that matches a broker belongs in the broker workspace;
  //    an email that matches a charterer contact links this identity as that client.
  if (user.email !== null) {
    const brokerByEmail = await prisma.broker.findFirst({ where: { email: user.email } });
    if (brokerByEmail !== null) {
      return { kind: 'broker' };
    }
    const chartererByEmail = await prisma.charterer.findFirst({
      where: { contactEmail: user.email },
    });
    if (chartererByEmail !== null) {
      return linkCharterer(appUser.id, chartererByEmail.id, user);
    }
  }

  // 5. No match. Dev/demo auto-links the demo charterer (by name, else the first one).
  if (serverEnv.NODE_ENV !== 'production') {
    const demoCharterer =
      (await prisma.charterer.findFirst({ where: { name: DEMO_CHARTERER_NAME } })) ??
      (await prisma.charterer.findFirst({ orderBy: { createdAt: 'asc' } }));
    if (demoCharterer !== null) {
      return linkCharterer(appUser.id, demoCharterer.id, user);
    }
  }

  // 6. Genuinely unmapped client (production, no charterer record to link).
  return { kind: 'unmapped' };
}

/**
 * Page guard for `/portal/*`. Returns the charterer context, or redirects:
 * broker -> /requirements, anonymous -> /, unmapped client -> onboarding notice.
 */
export async function requireCharterer(): Promise<ChartererContext> {
  const user = await requireSession(); // redirects anonymous visitors to '/'
  const resolution = await resolveChartererContext(user);
  switch (resolution.kind) {
    case 'client':
      return resolution.ctx;
    case 'broker':
      redirect(BROKER_HOME);
    // falls through to never — redirect() throws
    case 'unmapped':
      redirect(ACCESS_NOT_CONFIGURED_ROUTE);
  }
}

/**
 * API guard for `/api/portal/*`. Returns the charterer context, or a JSON error:
 * 401 anonymous, 403 broker, 403 unmapped client.
 */
export async function requireChartererApi(): Promise<
  { ok: true; ctx: ChartererContext } | { ok: false; response: NextResponse }
> {
  const session = await requireApiSession(); // 401 JSON for anonymous callers
  if (!session.ok) {
    return { ok: false, response: session.response };
  }
  const resolution = await resolveChartererContext(session.user);
  switch (resolution.kind) {
    case 'client':
      return { ok: true, ctx: resolution.ctx };
    case 'broker':
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Forbidden: this is a broker account.' },
          { status: 403 },
        ),
      };
    case 'unmapped':
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'This account is not linked to a charterer. Contact your broker.' },
          { status: 403 },
        ),
      };
  }
}
