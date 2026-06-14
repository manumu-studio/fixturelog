// middleware.ts — applies baseline security headers to all non-auth, non-static responses.
// Auth gating lives at the (app) route-group layout and the API handlers (see
// require-session.ts); middleware is intentionally header-only and edge-safe — it must NOT
// import server-only/env.server, which cannot run in the edge runtime.
import { NextResponse } from 'next/server';

// Baseline hardening headers. No CSP here: a strict policy would need per-page nonces and
// could break Leaflet tiles / Next inline runtime, so that is deferred to a dedicated pass.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

export function middleware(): NextResponse {
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  // Run on everything except Auth.js endpoints and static assets.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
