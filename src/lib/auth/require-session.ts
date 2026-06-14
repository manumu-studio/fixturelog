// require-session.ts — server-only session guards for protected pages and API routes.
// Reads identity from auth() only (never parses cookies directly) and exposes the
// minimal user fields the domain layer needs.
import 'server-only';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/features/auth/auth';

export type AuthenticatedUser = {
  externalId: string;
  email: string | null;
  name: string | null;
};

// Coerce the session user (whose optional fields may be undefined under
// exactOptionalPropertyTypes) into the minimal, fully-resolved domain shape.
function toAuthenticatedUser(user: Session['user']): AuthenticatedUser {
  return {
    externalId: user.externalId,
    email: user.email ?? null,
    name: user.name ?? null,
  };
}

/** Page guard: returns the user, or redirects anonymous visitors to the public landing. */
export async function requireSession(): Promise<AuthenticatedUser> {
  const session = await auth();
  if (!session?.user) {
    redirect('/');
  }
  return toAuthenticatedUser(session.user);
}

/** API guard: returns the user, or a 401 JSON response for anonymous callers. */
export async function requireApiSession(): Promise<
  { ok: true; user: AuthenticatedUser } | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true, user: toAuthenticatedUser(session.user) };
}
