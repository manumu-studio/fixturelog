# PR-0.2.0 — Core Vertical Slice (routes, services, subject workflow, UI)

**Branch:** `feat/vertical-slice` → `main`
**Version:** `0.2.0`
**Date:** 2026-06-12
**Status:** ✅ Ready to merge

---

## Summary

First demoable vertical slice. Adds 14 API routes, a pure service layer (FixtureStatusPolicy + RecapFormatter), Zod validation at every route boundary, and two server-component UI pages. The centrepiece is the **subject-lift workflow**: a broker can add subjects to an ON_SUBS fixture, lift or waive each one, and only then transition the fixture to FIXED — enforced at the service layer with a full audit trail.

---

## What Was Built

### API Routes (14 dynamic routes, all new)

| Method | Route                                     | Description                                             |
| ------ | ----------------------------------------- | ------------------------------------------------------- |
| GET    | `/api/charterers`                         | List all charterers                                     |
| POST   | `/api/charterers`                         | Register a charterer (incl. contact fields)             |
| GET    | `/api/charterers/[id]`                    | Charterer detail                                        |
| GET    | `/api/charterers/[id]/requirements`       | Requirements linked to a charterer                      |
| GET    | `/api/charterers/[id]/fixtures`           | Fixtures linked to a charterer                          |
| GET    | `/api/vessels`                            | List vessels (filterable by type, region, availability) |
| GET    | `/api/vessels/[id]`                       | Vessel detail                                           |
| GET    | `/api/fixtures`                           | List fixtures                                           |
| POST   | `/api/fixtures`                           | Create a fixture                                        |
| GET    | `/api/fixtures/[id]`                      | Fixture detail                                          |
| PATCH  | `/api/fixtures/[id]/status`               | Transition fixture status (subject-gated)               |
| POST   | `/api/fixtures/[id]/recap`                | Generate and persist a recap                            |
| POST   | `/api/fixtures/[id]/subjects`             | Add a subject to a fixture                              |
| PATCH  | `/api/fixtures/[id]/subjects/[subjectId]` | Update subject status (LIFTED / WAIVED)                 |

The pre-existing `/api/health` route is unchanged.

### Services

- **`FixtureStatusPolicy`** — pure TypeScript class. Validates every status transition against the canonical enum (`DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED`). Enforces the subject gate: `ON_SUBS → FIXED` requires at least one subject, every subject `LIFTED` or `WAIVED`. On a successful transition, writes a `FixtureStatusChange` audit row and stamps `Fixture.fixedAt` if transitioning to FIXED.
- **`RecapFormatter`** — pure TypeScript class. Produces a deterministic SUPPLYTIME 2017 recap in both Markdown and plain text from the fixture's structured terms. No runtime LLM.

### Validators (4 Zod modules)

`src/lib/validators/charterer.ts`, `vessel.ts`, `fixture.ts`, `subject.ts` — every route parses request input through these schemas before any database call.

### UI Pages (Next.js 15 server components)

- `/charterers` — lists all charterers with name and contact info.
- `/charterers/[id]` — shows charterer detail, linked requirements, and linked fixtures.

### Schema Changes (one non-destructive migration)

- `SubjectItemStatus` Postgres enum (`PENDING`, `LIFTED`, `WAIVED`) — replaces the previous plain string field.
- `FixtureStatusChange` model — immutable audit record per transition (actor, fromStatus, toStatus, indexed on `fixtureId`, cascades on delete).
- `Charterer` contact columns — `contactName`, `contactEmail`, `contactPhone` (all optional, existing rows unaffected).

---

## Architecture Decisions

| Decision                                             | Rationale                                                                                                                                                                                                                                     |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FixtureStatusChange` audit model                    | Every status change is an immutable event. A single `status` column loses history; an audit table lets you reconstruct the full timeline and query who changed what and when.                                                                 |
| Subject-gated `ON_SUBS → FIXED` in the service layer | The domain rule is: "fixed" means all conditions are resolved. Enforcing this in a pure service (not in a route handler) keeps the logic testable, reusable, and decoupled from HTTP.                                                         |
| `fixedAt` on Fixture, not on Requirement             | `fixedAt` is a Fixture event. The Requirement moves to `status: FIXED` to signal the deal is done, but no timestamp column exists on Requirement — no schema change needed there.                                                             |
| Charterer contact fields as optional columns         | Additive migration. No data loss, no breaking change, no seed rewrite required beyond populating the new fields.                                                                                                                              |
| `SubjectItemStatus` as a Postgres enum               | Enforces valid values at the database level. More reliable than a check constraint on a string column; consistent with how FixtureStatus and RequirementStatus are modelled.                                                                  |
| Pure services with no framework imports              | Both `FixtureStatusPolicy` and `RecapFormatter` are instantiated with plain `new`. No Next.js or Prisma imports inside the class logic — only the caller passes a Prisma transaction. This makes them trivially testable and future-portable. |
| Zod at all route boundaries                          | Resolves carry-forward W2 from PACKET-001. Every `.json()` call is `.parse()`-ed through a typed Zod schema before reaching the database.                                                                                                     |

---

## Testing

| File                                   | Tests                  |
| -------------------------------------- | ---------------------- |
| `fixture-status-policy.test.ts`        | 33                     |
| `recap-formatter.test.ts`              | 10                     |
| `charterers/route.test.ts`             | 14                     |
| `vessels/route.test.ts`                | 7                      |
| `fixtures/[id]/subjects/route.test.ts` | 9                      |
| `fixtures/route.test.ts`               | 24                     |
| `health.test.ts` (pre-existing)        | 2                      |
| **Total**                              | **99 across 15 files** |

**Coverage (thresholds: 70% statements / 60% branches / 70% functions / 70% lines):**

| Metric     | Result   |
| ---------- | -------- |
| Statements | 95.3% ✅ |
| Branches   | 82.8% ✅ |
| Functions  | 95.5% ✅ |
| Lines      | 95.3% ✅ |

---

## Deployment Notes

1. Run the migration before starting the server:
   ```bash
   npx prisma migrate deploy
   ```
2. Re-seed to populate Charterer contact fields:
   ```bash
   npx prisma db seed
   ```
3. Requires Node.js 20+ (`engines` field and `.nvmrc` now enforce this).
4. No new environment variables required.

---

## Testing Checklist

- [ ] `npm run typecheck` passes (zero errors)
- [ ] `npm run lint` passes (zero errors)
- [ ] `npm run test` passes (99 tests)
- [ ] `npm run test:coverage` meets all four thresholds
- [ ] `npm run build` succeeds (First Load JS shared ≤ 200 kB)
- [ ] `npx prisma migrate deploy` completes without error on a clean database
- [ ] `GET /api/charterers` returns the seeded charterer list
- [ ] `POST /api/fixtures/[id]/status` with `toStatus: "FIXED"` and no subjects returns HTTP 400
- [ ] After adding and lifting a subject, the same PATCH returns HTTP 200 with `status: "FIXED"`
- [ ] `Fixture.fixedAt` is set; linked `Requirement.status` is `FIXED`
- [ ] `POST /api/fixtures/[id]/recap` returns a recap with a version number

## Validation

```bash
npx tsc --noEmit              # ✅ 0 errors
npm run lint                  # ✅ 0 errors
npm run test                  # ✅ 99/99 passing
npm run test:coverage         # ✅ 95.3% / 82.8% / 95.5% / 95.3%
npm run build                 # ✅ First Load JS shared 102 kB
npm audit --audit-level=high  # ✅ clean (moderate postcss advisory accepted)
```
