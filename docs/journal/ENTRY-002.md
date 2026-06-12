# Entry 2

**Date:** 2026-06-12
**Type:** Feature
**Branch:** `feat/vertical-slice`
**Version:** `0.3.0`
**Packet:** `PACKET-002 — Core Vertical Slice`
**PR:** `PR-0.2.0`

## Summary

Built the first demoable vertical slice of FixtureLog. Starting from the spine foundation (schema, seed, CI, health endpoint), this packet added the full API surface, a pure service layer with domain rules, Zod validation at every route boundary, and two server-component UI pages. The result is a runnable application where a broker can register a charterer, browse vessels, create a fixture, work it through the subject-lift workflow, and generate a recap.

## Key Decisions

- **FixtureStatusChange audit model:** every status transition on a Fixture writes an immutable `FixtureStatusChange` row (actor, fromStatus, toStatus, createdAt) so the full history is queryable. The model is indexed on `fixtureId` and cascades on delete.

- **Subject-gated ON_SUBS → FIXED transition:** the `FixtureStatusPolicy` service enforces that `ON_SUBS → FIXED` is only allowed when at least one SubjectItem exists on the fixture and every subject has status `LIFTED` or `WAIVED`. Any attempt without subjects, or with unresolved subjects, returns a 400 with a count of outstanding items. This is the core domain rule the entire API surface is designed to exercise.

- **`fixedAt` stamped on Fixture, not Requirement:** when the transition to FIXED succeeds, `Fixture.fixedAt` is set to the current timestamp. The linked Requirement is moved to `status: FIXED` only — there is no `fixedAt` column on the Requirement model and none was added.

- **Charterer contact fields on existing model:** `contactName`, `contactEmail`, and `contactPhone` were added as optional columns to the `Charterer` table via a non-destructive migration. Existing rows and seed data are unaffected.

- **Non-destructive enum migration:** `SubjectItemStatus` was introduced as a Postgres enum (`PENDING`, `LIFTED`, `WAIVED`) to replace the plain string field on `SubjectItem.status`. The migration is additive; no data was dropped.

- **Pure service layer:** `FixtureStatusPolicy` and `RecapFormatter` are pure TypeScript classes with no framework imports. They can be instantiated and tested in isolation with Vitest, which is why the unit test suite grew from 2 to 99 tests.

- **Zod at every route boundary:** all four validator modules (`charterer`, `vessel`, `fixture`, `subject`) define `z.object()` schemas that are `.parse()`-ed before any database call. This resolved carry-forward W2 from PACKET-001.

- **Charterer-first UI entry point:** the two server-component pages (`/charterers` and `/charterers/[id]`) were chosen as the entry point because the charterer → requirement → fixture flow maps directly to the broking workflow. Both pages are Next.js 15 server components fetching from the route handlers.

- **Node 20 pin:** `package.json` `engines` field set to `>=20.0.0` and `.nvmrc` pinned to `20.20.2` to resolve the Vitest/Vite ESM startup incident from PACKET-001. The CI matrix already used Node 20; this makes the requirement explicit.

## Carry-Forwards Resolved

| ID  | Description                                               | Resolution                                                            |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| N1  | `SubjectItemStatus` was a plain string, not a Prisma enum | Migrated to a proper Postgres enum in the PACKET-002 schema migration |
| N3  | Prisma client import not marked server-only               | Added `import 'server-only'` to `src/lib/prisma.ts`                   |
| N4  | `vitest.config.ts` had no `environmentMatchGlobs`         | N/A — the real fix was pinning Node 20; no config change was needed   |
| W1  | CI used `npx tsc` instead of `npm run typecheck`          | Already resolved in PACKET-001 CI config                              |
| W2  | No Zod validation at route boundaries                     | All 14 route handlers parse request bodies through Zod schemas        |

## Incidents Resolved

| Incident                                                                                      | Resolution                                                                                      |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `INCIDENT-P01-vitest-esm-startup` — Vitest/Vite ESM startup failure on Node 18                | Resolved by pinning Node 20 via `package.json` engines and `.nvmrc`                             |
| `INCIDENT-P01-npm-audit-critical-dev` — `happy-dom` triggered high-severity npm audit failure | Resolved by removing unused `happy-dom` dev dependency; audit now clean at `--audit-level=high` |

## Files Created

**Services**

- `src/lib/services/fixture-status-policy.ts` — `FixtureStatusPolicy` class (subject-gated status transitions, audit row writes)
- `src/lib/services/recap-formatter.ts` — `RecapFormatter` class (deterministic SUPPLYTIME 2017 Markdown + plain text output)

**Validators**

- `src/lib/validators/charterer.ts`
- `src/lib/validators/vessel.ts`
- `src/lib/validators/fixture.ts`
- `src/lib/validators/subject.ts`

**Route Handlers**

- `src/app/api/charterers/route.ts` — GET list, POST create
- `src/app/api/charterers/[id]/route.ts` — GET detail
- `src/app/api/charterers/[id]/requirements/route.ts` — GET requirements for a charterer
- `src/app/api/charterers/[id]/fixtures/route.ts` — GET fixtures for a charterer
- `src/app/api/vessels/route.ts` — GET list (with filters)
- `src/app/api/vessels/[id]/route.ts` — GET detail
- `src/app/api/fixtures/route.ts` — GET list, POST create
- `src/app/api/fixtures/[id]/route.ts` — GET detail
- `src/app/api/fixtures/[id]/status/route.ts` — PATCH status transition
- `src/app/api/fixtures/[id]/recap/route.ts` — POST generate recap
- `src/app/api/fixtures/[id]/subjects/route.ts` — POST add subject
- `src/app/api/fixtures/[id]/subjects/[subjectId]/route.ts` — PATCH update subject status

**UI Pages**

- `src/app/charterers/page.tsx` — Charterer list (Next.js 15 server component)
- `src/app/charterers/[id]/page.tsx` — Charterer detail (Next.js 15 server component)

**Tests**

- `src/lib/services/fixture-status-policy.test.ts` — 33 tests
- `src/lib/services/recap-formatter.test.ts` — 10 tests
- `src/app/api/charterers/route.test.ts` — 14 tests
- `src/app/api/vessels/route.test.ts` — 7 tests
- `src/app/api/fixtures/[id]/subjects/route.test.ts` — 9 tests
- `src/app/api/fixtures/route.test.ts` — 24 tests

**Schema & Migrations**

- `prisma/migrations/20260612150000_vertical_slice_subjects_audit_contact/` — adds `SubjectItemStatus` enum, `FixtureStatusChange` audit model, and Charterer contact columns

## Files Modified

- `prisma/schema.prisma` — `SubjectItemStatus` enum, `FixtureStatusChange` model, `Charterer` contact columns, `SubjectItem.status` field updated
- `prisma/seed.ts` — updated to seed Charterer contact fields
- `src/lib/prisma.ts` — added `import 'server-only'`
- `vitest.config.ts` — coverage config updated to include `src/app/api/**`
- `package.json` — version bumped to 0.3.0; `engines` field added
- `.nvmrc` — pinned to `20.20.2`
- `README.md`, `CHANGELOG.md`, `CONTEXT.md`, `docs/architecture/PROJECT-CONTEXT.md`, `docs/roadmap/ROADMAP.md`

## Validation

| Gate                                                | Result                                                        |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `npm run typecheck`                                 | ✅ 0 errors                                                   |
| `npm run lint`                                      | ✅ 0 errors                                                   |
| `npm run test`                                      | ✅ 99 tests across 15 files                                   |
| Coverage: statements / branches / functions / lines | ✅ 95.3% / 82.8% / 95.5% / 95.3% (thresholds 70/60/70/70)     |
| `npm run build` — First Load JS shared              | ✅ 102 kB (budget < 200 kB)                                   |
| `npm audit --audit-level=high`                      | ✅ Clean (accepted moderate postcss/Next.js advisory remains) |

## Next Step

Begin `PACKET-003 — Matching`: implement `FixtureMatcher` pure service (hard filters + weighted 0–100 score), the `/api/requirements` route with matching results, and the vessel-matching UI panel.
