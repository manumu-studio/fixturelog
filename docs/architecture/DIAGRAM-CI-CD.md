# CI/CD Pipeline

How FixtureLog moves from pull request to verified deployable build.

FixtureLog uses the Learning Speaking App pattern: parallel GitHub Actions jobs for fast feedback, Node 20, Prisma generation, security audit, coverage, bundle budget, smoke check, and E2E with a real Postgres service.

```mermaid
flowchart TB
  PR[Pull request or push to main]

  PR --> LT[lint-typecheck job]
  PR --> TC[test-coverage job]
  PR --> BB[build-bundle job]

  LT --> LT1[npm ci]
  LT1 --> LT2[npm audit high]
  LT2 --> LT3[npm audit high omit dev]
  LT3 --> LT4[prisma generate]
  LT4 --> LT5[npm run typecheck]
  LT5 --> LT6[npm run lint]

  TC --> TC1[npm ci]
  TC1 --> TC2[prisma generate]
  TC2 --> TC3[npm run test:coverage]
  TC3 --> TC4[upload coverage]

  BB --> BB1[npm ci]
  BB1 --> BB2[prisma generate]
  BB2 --> BB3[npm run build]
  BB3 --> BB4[parse First Load JS]
  BB4 --> BB5[fail if shared JS exceeds budget]
  BB5 --> BB6[npm start]
  BB6 --> BB7[GET /api/health smoke check]

  LT6 --> E2E[e2e job]
  TC4 --> E2E
  BB7 --> E2E

  E2E --> PG[(Postgres 16 service)]
  E2E --> E1[npm ci]
  E1 --> E2[install Playwright Chromium]
  E2 --> E3[prisma generate]
  E3 --> E4[prisma migrate deploy]
  E4 --> E5[prisma db seed]
  E5 --> E6[npx playwright test]
  E6 --> ART[upload Playwright report on failure]

  E6 --> PASS[CI pass]
  PASS --> VERCEL[Vercel preview or production deploy]
  VERCEL --> NEON[(Neon Postgres)]
```

## What to Say in the Interview

- "The pipeline is split into parallel jobs so slow E2E does not block fast lint/type/build feedback."
- "The build job does more than compile. It checks bundle size and starts the production server for a health smoke test."
- "E2E uses a real Postgres service, applies migrations, seeds data, and then runs Playwright. That proves the app works with the same database contract it uses in production."
- "Auth secrets are placeholder values in CI; production secrets live in Vercel."
- "Vercel owns deployment. GitHub Actions owns verification."

## Design Decisions

- Node 20 is pinned for consistent Next.js, Prisma, Vitest, and Playwright behavior.
- `prisma generate` runs in every job that touches generated Prisma types.
- The health endpoint stays public so deploy smoke checks do not need auth.
- Bundle size is parsed from `next build` output to catch accidental client-side bloat.
- Failed E2E uploads the Playwright report so failures can be inspected without rerunning locally.
