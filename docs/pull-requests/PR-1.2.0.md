# PR-1.2.0 — Auth Integration (PACKET-008)

**Branch:** `feat/auth-integration` → `main`
**Version:** 1.2.0
**Type:** Feature

## Summary

Adds authentication to FixtureLog via the shared ManuMuStudio OIDC provider (Auth.js / NextAuth v5 beta). Operational pages and domain APIs now require a session; the landing stays public and offers real sign-in / create-account / go-to-workspace CTAs. Write routes resolve the acting broker from the session, preventing impersonation.

## What was built

- **Auth module** — `src/features/auth/` (NextAuth config, `useSession`, sign-in/up server actions).
- **Env split** — client-safe `env.ts` vs `server-only` `env.server.ts` (+ schema with production guard).
- **Route protection** — `src/app/(app)/` authenticated route group (URLs unchanged) + `requireSession` / `requireApiSession` (`src/lib/auth/require-session.ts`). All 21 domain APIs gated; `/`, `/api/auth/*`, `/api/health` public.
- **Cookie-forwarding `serverFetch`** — `src/lib/server-fetch.ts` so server components reach gated APIs as the signed-in user.
- **Actor model** — `AppUser` Prisma model + migration `auth_integration`; `resolveActor()` provisioning; `POST /api/fixtures` and `PATCH …/status` take broker/actor from the session.
- **Landing auth** — `AuthCta` server component; corrected "no account required" copy.
- **Security headers** — `src/middleware.ts` (edge-safe, excludes `/api/auth/*`).

## Architecture decisions

- Auth gating at layout + handler level (LSA pattern), not edge middleware (auth config is `server-only`).
- `serverFetch` forwards the session cookie — server-component fetches don't carry cookies by default, so gated APIs would otherwise 401 authenticated users.
- Session-derived actor: `brokerId`/`actor` removed from request bodies (Zod strips them) — impersonation impossible by construction.
- Vitest aliases `server-only` (stub) + `@/features/auth/auth` (double) so handlers test without loading next-auth.

## Testing

| Gate | Result |
|---|---|
| `npm run typecheck` | ✓ |
| `npm run lint` | ✓ (0 errors) |
| `npm run test` | ✓ 279/279 (35 files) |
| coverage | ✓ stmts 81.6 / br 77.7 / fn 77.1 / lines 81.6 |
| `npm run build` | ✓ |
| `npm run test:e2e` | ✓ 7/7 |
| `npm audit` (all + prod) | ✓ 0 vulnerabilities |

New tests include impersonation-prevention cases (body `brokerId`/`actor` ignored), `require-session`, `provision-actor`, and `AuthCta`.

## How to verify locally

1. Set the `AUTH_*` / `NEXTAUTH_*` vars in `.env` (see `.env.example`).
2. `npx prisma migrate dev` (applies `auth_integration`).
3. `npm run dev`, visit `/` → Sign in → complete OIDC at `auth.manumustudio.com` → land on `/requirements`.
4. Anonymous: `/map`, `/charterers`, `/requirements` redirect to `/`; protected APIs return 401 JSON; `/api/health` stays public.

## Deployment notes

- Vercel already has all 8 auth env vars; the production issuer (`auth.manumustudio.com`) and FixtureLog `OAuthClient` (openid/email/profile) are registered.
- The `auth_integration` migration must run on deploy (additive: `AppUser` table + `Broker` relation).
- Production refuses writes for an authenticated user with no broker mapping (403) — pre-seed broker email or extend provisioning before opening to external brokers.
