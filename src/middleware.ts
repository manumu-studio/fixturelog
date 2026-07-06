// middleware.ts — applies baseline security headers and sends unknown browser routes home.
// Auth gating lives at the (app) route-group layout and the API handlers (see
// require-session.ts); middleware is intentionally edge-safe — it must NOT
// import server-only/env.server, which cannot run in the edge runtime.
import { NextResponse, type NextRequest } from 'next/server';

// Baseline hardening headers. No CSP here: a strict policy would need per-page nonces and
// could break Leaflet tiles / Next inline runtime, so that is deferred to a dedicated pass.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

const BROWSER_ROUTES = [
  /^\/$/,
  /^\/page2$/,
  /^\/auth\/error$/,
  /^\/dashboard$/,
  /^\/map$/,
  /^\/requirements(?:\/[^/]+)?$/,
  /^\/charterers(?:\/new|\/[^/]+)?$/,
  /^\/portal(?:\/(?:enquiries(?:\/new|\/[^/]+)?|fixtures|documents|fleet))?$/,
] as const;

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function isPublicAssetPath(pathname: string): boolean {
  return pathname.startsWith('/assets/') || pathname.includes('.');
}

function isKnownBrowserRoute(pathname: string): boolean {
  return BROWSER_ROUTES.some((route) => route.test(pathname));
}

function shouldRedirectToLanding(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return false;
  if (isPublicAssetPath(pathname)) return false;
  return !isKnownBrowserRoute(pathname);
}

export function middleware(request: NextRequest): NextResponse {
  if (shouldRedirectToLanding(request)) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  // Run on everything except Auth.js endpoints and static assets.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
