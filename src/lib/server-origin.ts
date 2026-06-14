// Builds the current request origin for server-side fetches to local route handlers.

import 'server-only';
import { headers } from 'next/headers';

function inferProtocol(host: string): string {
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]')) {
    return 'http';
  }

  return 'https';
}

export async function getRequestOrigin(): Promise<string> {
  const headerStore = await headers();
  const forwardedHost = headerStore.get('x-forwarded-host');
  const host = forwardedHost ?? headerStore.get('host');

  if (host == null || host.trim() === '') {
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  }

  const protocol = headerStore.get('x-forwarded-proto') ?? inferProtocol(host);

  return `${protocol}://${host}`;
}
