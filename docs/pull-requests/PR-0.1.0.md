# PR-0.1.0 — Spine foundation (schema, seed, CI, test infra)

**Branch:** `feat/spine-foundation` → `main`
**Version:** `0.1.0`
**Date:** 2026-06-11
**Status:** ✅ Ready to merge

---

## Summary

Establishes the full FixtureLog project foundation: Next.js 15 app with strict TypeScript, Prisma schema (13 models, 12 enums) matching SPEC-001 §2–§3, idempotent seed with realistic North Sea offshore data, health endpoint with unit tests, Vitest + Playwright test infrastructure, and a 4-job CI pipeline.

Also includes the research and specification phase artifacts: project blueprint, two ADRs, and the locked MVP build spec (SPEC-001).

## Files Changed

| File                                   | Action  | Notes                                                                                                            |
| -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `package.json`                         | Created | v0.2.0, Next 15 + Prisma 6 + React 19 + Zod + Vitest + Playwright                                                |
| `tsconfig.json`, `tsconfig.build.json` | Created | Strict TS (8 strict flags), build-only excludes tests/scripts                                                    |
| `eslint.config.mjs`                    | Created | Flat config, complexity caps (max-lines 300, max-depth 3, etc.)                                                  |
| `next.config.ts`                       | Created | reactStrictMode                                                                                                  |
| `prisma/schema.prisma`                 | Created | 13 models, 12 enums — full offshore broking data model                                                           |
| `prisma/migrations/`                   | Created | Initial migration                                                                                                |
| `prisma/seed.ts`                       | Created | 30 vessels, 8 owners, 6 charterers, 4 brokers, 7 regions, 9 workscopes, 6 benchmarks, 4 requirements, 3 fixtures |
| `src/lib/prisma.ts`                    | Created | Prisma singleton (hot-reload safe)                                                                               |
| `src/lib/health.ts` + test             | Created | Testable health check helper + 2 unit tests                                                                      |
| `src/app/`                             | Created | Root layout, placeholder page, globals.css, health endpoint                                                      |
| `vitest.config.ts`                     | Created | Coverage thresholds 70/60/70/70                                                                                  |
| `playwright.config.ts`                 | Created | E2E (port 3100 local, 3000 CI)                                                                                   |
| `e2e/`                                 | Created | Global setup + 2 smoke tests                                                                                     |
| `.github/workflows/ci.yml`             | Created | 4-job pipeline                                                                                                   |
| `docs/specs/SPEC-001-mvp-build.md`     | Created | Locked MVP build specification                                                                                   |
| `docs/decisions/ADR-0002-*.md`         | Created | Data & integration strategy                                                                                      |
| `docs/decisions/ADR-0003-*.md`         | Created | Application architecture                                                                                         |
| `docs/roadmap/ROADMAP.md`              | Created | 5-day build roadmap                                                                                              |

## Architecture Decisions

| Decision                                       | Why                                                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Next.js 15 full-stack (not separate API + SPA) | Single deploy unit, App Router + Route Handlers, matches Vercel target                             |
| Prisma 6 + Neon Postgres                       | Type-safe ORM with migration workflow, Neon for serverless-friendly Postgres                       |
| Seeded data with honesty labelling             | All position snapshots marked `source: SEEDED`, `confidence: MEDIUM` — never presented as live AIS |
| 4-job parallel CI                              | Fast feedback: lint+typecheck, tests+coverage, build+bundle, e2e (gated behind first 3)            |
| Manual init (no create-next-app)               | Preserves existing documentation, controls every dependency                                        |

## Testing Checklist

- [ ] `npm run typecheck` passes (zero errors)
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm run test` passes (2 unit tests)
- [ ] `npm run build` succeeds (102 kB First-Load JS, under 200 kB budget)
- [ ] `npx prisma db seed` populates 30 vessels + full data set
- [ ] `GET /api/health` returns `{"status":"ok"}` with HTTP 200
- [ ] E2E smoke tests pass (homepage + health endpoint)

## Deployment Notes

- Requires Neon Postgres with `DATABASE_URL` in `.env`
- Requires Node.js 20+ (Vitest 3 + Vite 7 need it)
- CI requires `package-lock.json` and `prisma/migrations/` committed
- Vercel deploys from main (preview deploys on PR)

## Validation

```bash
npx tsc --noEmit        # ✅ zero errors
npm run build           # ✅ 102 kB shared JS
npm run lint            # ✅ clean
npm run test            # ✅ 2/2 passing
```
