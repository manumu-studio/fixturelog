// Vitest test double for `@/features/auth/auth`. The real module imports next-auth,
// whose internals import `next/server` in a form vitest cannot resolve. Aliasing it
// here lets route handlers and require-session run as an authenticated user without
// loading next-auth. Auth gating logic itself is covered by require-session.test.ts,
// which overrides this module with its own vi.mock.
import type { Session } from 'next-auth';

export async function auth(): Promise<Session | null> {
  return {
    user: {
      externalId: 'test-external-id',
      email: 'test@fixturelog.local',
      name: 'Test Broker',
      image: null,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export const signIn = async (): Promise<void> => undefined;
export const signOut = async (): Promise<void> => undefined;
export const handlers = { GET: async (): Promise<Response> => new Response(null), POST: async (): Promise<Response> => new Response(null) };
