# ENTRY-008 — Auth Integration (PACKET-008)

- **Date:** 2026-06-14
- **Type:** Feature
- **Version:** 1.2.0
- **Branch:** feat/auth-integration

## Summary

FixtureLog changed from a fully public workflow demo into an authenticated broker workspace. Sign-in uses the shared ManuMuStudio OIDC provider (Auth.js / NextAuth v5 beta) — no local password store. Operational pages and all domain APIs now require a session; the landing stays public and drives sign-in. Write routes derive the acting broker from the session rather than the request body, closing an impersonation gap.

## What changed

- **Auth module** (`src/features/auth/`): NextAuth config (provider `manumustudio`, JWT sessions, federated sign-out), `useSession`, and `signInAction`/`signUpAction` server actions.
- **Env split** (`src/lib/env.ts`, `env.server.ts`, `env.server.schema.ts`): client-safe vs `server-only` secrets, with a production placeholder guard.
- **Guards** (`src/lib/auth/require-session.ts`): `requireSession()` (page redirect to `/`) and `requireApiSession()` (401 JSON). Operational pages moved into `src/app/(app)/` (URLs unchanged) with a session-checking layout.
- **API gating**: all 21 domain handlers gated; `/`, `/api/auth/*`, `/api/health` public. `src/lib/server-fetch.ts` forwards the session cookie so server components can call their own gated APIs.
- **Actor model**: `AppUser` Prisma model (`externalId` → `Broker`), migration `auth_integration`, and `resolveActor()` provisioning/broker resolution. `POST /api/fixtures` and `PATCH /api/fixtures/[id]/status` now take the broker/actor from the session.
- **Landing**: `AuthCta` server component (anon → Sign in/Create account; authed → Go to Workspace); false "no account required" copy removed.
- **Middleware**: `src/middleware.ts` adds baseline security headers (edge-safe, excludes `/api/auth/*`).

## Key decisions

- **Layout/handler gating, not middleware auth** — follows the LSA pattern; the auth config imports `server-only` and can't run in the edge runtime. Middleware is headers-only.
- **Cookie-forwarding `serverFetch`** — gating the APIs would 401 server-component fetches (which don't forward cookies by default); forwarding the cookie was required for authenticated pages to work in production.
- **Session-derived actor** — removed `brokerId`/`actor` from the request bodies entirely (Zod strips them) so impersonation is impossible by construction.
- **Test isolation** — vitest aliases `server-only` (stub) and `@/features/auth/auth` (test double) because next-auth's internals can't be imported under vitest; auth logic is covered directly by `require-session`/`provision-actor`/`AuthCta` tests.
- **E2E bypass wired into Playwright** — `webServer.env` sets `E2E_TEST_USER=true` so gated routes stay reachable; inert when `NODE_ENV=production`.

## Verification

`npm run typecheck` ✓ · `npm run lint` ✓ (0 errors) · `npm run test` ✓ (279/279, 35 files) · coverage ✓ (stmts 81.6 / br 77.7 / fn 77.1 / lines 81.6) · `npm run build` ✓ · `npm run test:e2e` ✓ (7/7) · `npm audit` ✓ (0 vulns, all + prod-only).

## Notes

- The `auth_integration` migration was applied to the dev `neondb`; the deployed `auth.manumustudio.com` issuer + FixtureLog `OAuthClient` were registered ahead of the packet.
- Runtime AI Broker Copilot remains unbuilt; auth is its prerequisite (SPEC-002).
