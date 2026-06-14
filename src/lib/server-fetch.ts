// server-fetch.ts — server-side fetch to internal route handlers that forwards the
// incoming session cookie. Without this, a Server Component's fetch to its own gated
// /api route carries no session and would receive 401 even for authenticated users.
import 'server-only';
import { headers } from 'next/headers';
import { getRequestOrigin } from './server-origin';

export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  const [origin, headerStore] = await Promise.all([getRequestOrigin(), headers()]);

  const requestHeaders = new Headers(init?.headers);
  const cookie = headerStore.get('cookie');
  if (cookie !== null && cookie !== '') {
    requestHeaders.set('cookie', cookie);
  }

  return fetch(`${origin}${path}`, { cache: 'no-store', ...init, headers: requestHeaders });
}
