// NextAuth (Auth.js v5) config for the ManuMuStudio OAuth/OIDC provider.
// Server-only: imports env.server, so it must NEVER be re-exported through the client barrel.
import NextAuth from 'next-auth';
import type { Session } from 'next-auth';
import { serverEnv } from '@/lib/env.server';
import { OidcProfileSchema } from '@/lib/schemas/auth-profile.schema';

const nextAuth = NextAuth({
  trustHost: true,
  secret: serverEnv.NEXTAUTH_SECRET,
  providers: [
    {
      id: 'manumustudio',
      name: 'ManuMuStudio',
      type: 'oauth',
      // Must match the "iss" claim signed by the auth server (trailing slash).
      issuer: `${serverEnv.AUTH_ISSUER_URL}/`,
      authorization: {
        url: `${serverEnv.AUTH_ISSUER_URL}/oauth/authorize`,
        params: { scope: 'openid email profile' },
      },
      token: `${serverEnv.AUTH_ISSUER_URL}/oauth/token`,
      userinfo: `${serverEnv.AUTH_ISSUER_URL}/oauth/userinfo`,
      clientId: serverEnv.AUTH_CLIENT_ID,
      clientSecret: serverEnv.AUTH_CLIENT_SECRET,
      checks: ['pkce', 'state'],
      profile(rawProfile: Record<string, unknown>) {
        const parsed = OidcProfileSchema.parse(rawProfile);
        return {
          id: parsed.sub,
          name: parsed.name ?? parsed.email ?? null,
          email: parsed.email ?? null,
          image: parsed.picture ?? null,
        };
      },
    },
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (profile && typeof profile === 'object' && 'sub' in profile) {
        const parsed = OidcProfileSchema.parse(profile);
        token.externalId = parsed.sub;
        token.email = parsed.email ?? null;
        token.name = parsed.name ?? null;
      }
      // Retain the OIDC id_token so federated logout can send id_token_hint.
      if (account?.id_token) {
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.externalId === 'string') {
        session.user.externalId = token.externalId;
      }
      return session;
    },
  },
  debug: serverEnv.NODE_ENV === 'development',
});

export const { handlers, signIn, signOut } = nextAuth;

// Synthetic session for Playwright E2E (never in production).
function e2eBypassSession(): Session {
  return {
    user: {
      externalId: 'e2e-test-external-id',
      email: 'e2e@test.local',
      name: 'E2E Test User',
      image: null,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// NextAuth v5 beta does not expose a clean zero-argument `auth()` type (the exported
// `auth` is overloaded for route handlers and middleware). We only ever call it with zero
// args. A type guard narrows it without an `as` cast; runtime behavior is unchanged.
type ZeroArgAuth = () => Promise<Session | null>;
function isZeroArgAuth(fn: unknown): fn is ZeroArgAuth {
  return typeof fn === 'function';
}

/** Server-side session accessor. Use in server components and API route handlers. */
export async function auth(): Promise<Session | null> {
  if (process.env.E2E_TEST_USER === 'true' && serverEnv.NODE_ENV !== 'production') {
    return e2eBypassSession();
  }
  if (isZeroArgAuth(nextAuth.auth)) {
    return nextAuth.auth();
  }
  throw new Error('NextAuth auth() is not available');
}
