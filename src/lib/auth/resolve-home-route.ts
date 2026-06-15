// resolve-home-route.ts — decide where an authenticated identity lands: charterers go to
// /portal, brokers to /requirements. A linked charterer/broker wins; otherwise an email
// matching a broker is a broker, and everyone else defaults to the portal (where
// requireCharterer provisions them). Server-only (reads the DB).
import 'server-only';
import { prisma } from '@/lib/prisma';
import type { AuthenticatedUser } from './require-session';
import type { HomeRoute } from './resolve-role';

export async function resolveHomeRoute(user: AuthenticatedUser): Promise<HomeRoute> {
  const appUser = await prisma.appUser.findUnique({
    where: { externalId: user.externalId },
    select: { brokerId: true, chartererId: true },
  });
  if (appUser !== null && appUser.chartererId !== null) return '/portal';
  if (appUser !== null && appUser.brokerId !== null) return '/dashboard';

  if (user.email !== null) {
    const broker = await prisma.broker.findFirst({
      where: { email: user.email },
      select: { id: true },
    });
    if (broker !== null) return '/dashboard';
  }
  return '/portal';
}
