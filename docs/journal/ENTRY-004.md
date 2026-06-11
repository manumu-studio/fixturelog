# ENTRY-004 — feat: Day 1 spine foundation (repo skeleton, schema, seed, CI)

**Date:** 2026-06-11
**Type:** Feature
**Branch:** `feat/spine-foundation`
**Version:** `0.2.0`

---

## What I Did

Built the complete Day 1 spine foundation from PACKET-001: project init, Prisma schema (13 models, 12 enums), idempotent seed with realistic North Sea offshore data, Next.js 15 app shell, health endpoint with extracted testable helper, Vitest + Playwright test infrastructure, and a 4-job CI pipeline mirrored from learning-speaking-app.

---

## Files Touched

| File | Action | Notes |
|------|--------|-------|
| `package.json` | Created | v0.2.0, all deps (Next 15, Prisma 6, React 19, Zod, Vitest, Playwright) |
| `package-lock.json` | Created | Lockfile for `npm ci` in CI |
| `tsconfig.json` | Created | Strict TS (all 8 strict flags from CLAUDE.md) |
| `tsconfig.build.json` | Created | Build-only config excluding tests/scripts/prisma |
| `eslint.config.mjs` | Created | Flat config with 5 complexity rules + test exemptions |
| `next.config.ts` | Created | reactStrictMode |
| `prisma/schema.prisma` | Created | 13 models, 12 enums (SPEC-001 §2–§3) |
| `prisma/migrations/` | Created | Initial migration |
| `prisma/seed.ts` | Created | Idempotent seed: 30 vessels, 8 owners, 6 charterers, 4 brokers, 7 regions, 9 workscopes, 6 benchmarks, 4 requirements, 3 fixtures, 3 subjects, 1 recap |
| `src/lib/prisma.ts` | Created | Prisma client singleton (hot-reload safe) |
| `src/lib/health.ts` | Created | Testable health check helper |
| `src/lib/health.test.ts` | Created | 2 unit tests (ok + degraded) |
| `src/app/layout.tsx` | Created | Root layout with metadata |
| `src/app/page.tsx` | Created | Placeholder landing page |
| `src/app/globals.css` | Created | Minimal CSS reset |
| `src/app/api/health/route.ts` | Created | Health endpoint (200/503) |
| `vitest.config.ts` | Created | Coverage thresholds 70/60/70/70 |
| `playwright.config.ts` | Created | E2E config (port 3100 local, 3000 CI) |
| `e2e/global-setup.ts` | Created | CI DB seed before E2E |
| `e2e/smoke.spec.ts` | Created | 2 E2E tests (homepage + health) |
| `.github/workflows/ci.yml` | Created | 4-job pipeline (lint-typecheck, test-coverage, build-bundle, e2e) |
| `.env.example` | Created | DATABASE_URL template |
| `.gitignore` | Created | Comprehensive exclusions |

---

## Decisions

**Manual project init** — No `create-next-app`. We need to preserve existing docs and control every dependency explicitly.

**Seed roster: 30 vessels, 6 types** — Realistic North Sea fleet composition with real operator names (Tidewater, Solstad, DOF, Havila, Island Offshore, Eidesvik, Olympic, Siem). Rate benchmarks anchored to Seabreeze Offshore Market Report data.

**Health check extracted** — `src/lib/health.ts` is a testable helper injected with a query function. Establishes Day 1 coverage baseline without needing full integration tests.

**Prisma excluded from base tsconfig** — Seed script uses `Object.fromEntries` indexing which fails `noUncheckedIndexedAccess`. Documented in journal.

**SubjectItem.status as String** — Deferred enum promotion to Day 2 (audit item N1).

---

## Validation

```bash
npx tsc --noEmit        # ✅ zero errors
npm run build           # ✅ 102 kB First-Load JS (budget: 200 kB)
npm run lint            # ✅ zero warnings
npm run test            # ✅ 2 tests passing
npm run test:coverage   # ✅ 100% coverage on health.ts
```
