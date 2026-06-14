// Federated sign-out: clears FixtureLog auth cookies and redirects through the shared
// IdP logout endpoint so both FixtureLog and the auth-server session end together.
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { serverEnv } from '@/lib/env.server';

const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
];

const AUTH_LOGOUT_URL = `${serverEnv.AUTH_ISSUER_URL}/oauth/logout`;

export async function GET() {
  const cookieStore = await cookies();
  let idToken: string | undefined;

  // Decode the session cookie to recover the OIDC id_token for id_token_hint.
  for (const cookieName of SESSION_COOKIE_NAMES) {
    const sessionCookie = cookieStore.get(cookieName);
    if (!sessionCookie?.value) {
      continue;
    }
    try {
      const decoded = await decode({
        token: sessionCookie.value,
        secret: serverEnv.NEXTAUTH_SECRET,
        salt: cookieName,
      });
      idToken = typeof decoded?.idToken === 'string' ? decoded.idToken : undefined;
      break;
    } catch {
      // Try the other cookie name if decode fails.
    }
  }

  const logoutUrl = new URL(AUTH_LOGOUT_URL);
  if (idToken) {
    logoutUrl.searchParams.set('id_token_hint', idToken);
  } else {
    // Fallback so the provider can still resolve the client when no id_token is present.
    logoutUrl.searchParams.set('client_id', serverEnv.AUTH_CLIENT_ID);
  }
  logoutUrl.searchParams.set('post_logout_redirect_uri', serverEnv.APP_URL);

  const response = NextResponse.redirect(logoutUrl.toString());

  const cookiesToClear = [
    ...SESSION_COOKIE_NAMES,
    'authjs.callback-url',
    '__Secure-authjs.callback-url',
    'authjs.csrf-token',
    '__Secure-authjs.csrf-token',
  ];
  for (const cookieName of cookiesToClear) {
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
      secure: cookieName.startsWith('__Secure-'),
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return response;
}
