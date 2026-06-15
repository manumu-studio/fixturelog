// GET /api/auth/post-login — single post-login hop that routes by role: charterer ->
// /portal, broker -> /dashboard. The OIDC sign-in actions redirect here so each role lands
// on the correct home without the landing having to know the role. Redirects are built from
// the request origin (not a configured base) so they work on any host/port (dev, e2e, prod).
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/features/auth/auth';
import { resolveHomeRoute } from '@/lib/auth/resolve-home-route';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  const home = await resolveHomeRoute({
    externalId: session.user.externalId,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  });
  return NextResponse.redirect(new URL(home, request.url));
}
