# PR-0.1.0: Spine Foundation

## Summary

Establishes the FixtureLog project skeleton: Next.js 15 app with strict TypeScript, full Prisma schema (13 models, 12 enums), idempotent seed with realistic offshore broking data, health endpoint with unit tests, Vitest + Playwright test infrastructure, and a 4-job CI pipeline.

## What was built

- **Repo skeleton:** package.json, strict tsconfig, ESLint flat config with complexity caps, Next.js 15 config
- **Data model:** Complete Prisma schema per SPEC-001 sections 2-3 with initial migration
- **Seed data:** 30 vessels, 8 owners, 6 charterers, 4 brokers, 7 regions, 9 workscopes, 6 rate benchmarks, 4 requirements, 3 fixtures (NEGOTIATING/ON_SUBS/FIXED), subject items, recap
- **App shell:** Root layout + placeholder page + health endpoint
- **Testing:** Vitest (coverage thresholds 70/60/70/70) + Playwright (E2E smoke)
- **CI:** 4-job GitHub Actions (lint-typecheck, test-coverage, build-bundle, e2e)

## Architecture decisions applied

- [ADR-0002](../decisions/ADR-0002-data-and-integration-strategy.md) — seeded Postgres, honesty labelling, Open-Meteo deferred to Day 4
- [ADR-0003](../decisions/ADR-0003-application-architecture.md) — Next.js full-stack, service layer pattern, Vercel + Neon deploy target

## Testing

- Unit tests: `src/lib/health.test.ts` (2 tests — ok + degraded)
- E2E: `e2e/smoke.spec.ts` (2 tests — homepage loads, health endpoint 200)
- Coverage baseline: health.ts at 100% (establishes threshold enforcement)

## How to verify

```bash
npm install
cp .env.example .env  # Edit with Neon DATABASE_URL
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev            # Visit http://localhost:3000
npm run test:coverage  # Unit tests + coverage
npm run test:e2e       # E2E smoke tests
```

## Deployment notes

- Requires Neon Postgres with `DATABASE_URL` env var
- Vercel deploys automatically from main (preview deploys on PR)
- CI requires `package-lock.json` and `prisma/migrations/` to be committed
