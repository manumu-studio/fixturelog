# PR-0.4.0 — Requirement Matching (FixtureMatcher engine, CRUD routes, shortlist UI)

**Branch:** `feat/matching` → `main`
**Version:** `0.4.0`
**Date:** 2026-06-12
**Status:** ✅ Ready to merge

---

## Summary

Introduces the technical centerpiece of FixtureLog: a pure deterministic vessel-to-requirement matching engine, the full requirement API surface (CRUD + match endpoint), and two server-component UI pages (requirement list + shortlist detail with per-factor score breakdown). A broker can now create a requirement at `ENQUIRY` status, POST to the match endpoint, and receive a ranked shortlist of vessels with individual distance / rateFit / capabilityMargin scores — and the requirement transitions to `SHORTLISTED`.

---

## What Was Built

### Utilities (2 new pure modules)

| Module | Description |
|--------|-------------|
| `src/lib/utils/haversine.ts` | Great-circle distance in nautical miles — pure function, no DB dependency |
| `src/lib/utils/dp-class.ts` | DP class rank (NONE < DP1 < DP2 < DP3), meets-minimum check, and headroom helpers |

### Services

- **`FixtureMatcher`** (`src/lib/services/fixture-matcher.ts`) — pure two-stage matching engine. Takes plain objects, returns plain objects; no database calls inside the service. Stage 1 applies hard filters (vessel type, availability, region, deck area, bollard pull, DP class); Stage 2 computes a weighted composite score (distance 0.40 / rateFit 0.35 / capabilityMargin 0.25, tunable). Distance is normalised against the max distance in the passing candidate set. rateFit is budget vs. regional benchmark. capabilityMargin is DP headroom above the requirement minimum. Tie-break: vessel name ascending. `DEFAULT_WEIGHTS` exported for reuse.

### Validators (1 new Zod module)

- `src/lib/validators/requirement.validators.ts` — Zod schemas for: requirement create body, list query params (status, limit, offset), and match-request weights. The weights schema applies a `.refine()` guard ensuring `distance + rateFit + capabilityMargin === 1.0`; violations return HTTP 400 with `"Weights must sum to 1.0"`.

### API Routes (4 new API endpoints)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/requirements` | Create a requirement (status defaults to `ENQUIRY`) |
| GET | `/api/requirements` | List requirements (filterable by status, paginated) |
| GET | `/api/requirements/[id]` | Requirement detail |
| POST | `/api/requirements/[id]/match` | Run matching engine; returns ranked shortlist + per-factor breakdown; transitions `ENQUIRY → SHORTLISTED` on first call |

### UI Pages (2 new server components)

| Route | Description |
|-------|-------------|
| `/requirements` | Requirement list with status badges (Next.js 15 server component) |
| `/requirements/[id]` | Shortlist detail — ranked candidates with per-factor score breakdown (`distance`, `rateFit`, `capabilityMargin`) |

`ShortlistView.tsx` is extracted as a presentational component to keep the page file under the 150-line target.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Pure functions throughout | The matcher takes plain objects and returns plain objects — no DB calls inside the matcher. All I/O happens in the route handler. Same pattern as `FixtureStatusPolicy` and `RecapFormatter`. Makes the service trivially unit-testable and future-portable. |
| Haversine in the service layer | Great-circle distance in nautical miles, computed in TypeScript. PostGIS is deferred to a post-MVP stretch (SPEC-001, ADR-0002); at 30-vessel scale, Haversine in-process is correct, fast, and independently testable. |
| rateFit as budget-vs-benchmark (known limitation) | The schema has no per-vessel day-rate column. `rateFit` compares the requirement's `dayRateBudget` against the regional rate benchmark for the vessel type. Every candidate from the same `(vesselType, region)` cohort receives the same `rateFit` score. This is a documented limitation; per-vessel rate data would require a schema extension. |
| Neutral 0.5 for absent budget/benchmark | Missing data contributes a neutral score — never inflating or deflating a candidate's composite. Prevents candidates from being artificially ranked up or down due to data gaps. |
| Distance normalised against max in candidate set | Relative scoring within the shortlist is more meaningful than absolute values. Formula: `score = 1 − (dist / maxDist)`. The closest vessel scores 1.0; others scale down from there. |
| `MatchResponse.status` is the actual post-operation `RequirementStatus` | The endpoint never hard-codes `'SHORTLISTED'`. It returns the requirement status after the operation — which means re-matching a `SHORTLISTED` requirement correctly returns `'SHORTLISTED'` without a redundant transition. |
| `ENQUIRY → SHORTLISTED` on first match only | The status transition fires only when `requirement.status === 'ENQUIRY'`. Subsequent calls on any later status run scoring and return results without touching status. |
| `ShortlistView` presentational component extracted | Keeps the page file under the per-file line limit (300 lines / 150-line average target) while preserving the 4-file component pattern. |
| No Prisma migration | `Requirement`, `Region`, and `RateBenchmark` all existed in the PACKET-002 schema. No schema changes were needed for this packet. |

---

## Testing

### Test files added this packet

| File | Tests |
|------|-------|
| `src/lib/utils/haversine.test.ts` | 6 |
| `src/lib/utils/dp-class.test.ts` | 20 |
| `src/lib/services/fixture-matcher.test.ts` | 51 |
| `src/app/api/requirements/route.test.ts` | 10 |
| `src/app/api/requirements/[id]/match/route.test.ts` | 9 |
| Shortlist UI (`/requirements` + `/requirements/[id]`) | 2 |
| **Total added this packet** | **98** |

**Total suite: 197 tests** (99 PACKET-002 base + 98 added).

### Coverage (thresholds: 70% statements / 60% branches / 70% functions / 70% lines)

| Metric | Result |
|--------|--------|
| Statements | 94.76% ✅ |
| Branches | 84.52% ✅ |
| Functions | 92.68% ✅ |
| Lines | 94.76% ✅ |

---

## Deployment Notes

1. **No migration needed** — this packet introduces no schema changes. `npx prisma migrate deploy` is a no-op.
2. No new environment variables required.
3. Requires Node.js 20+ (unchanged from PACKET-002).
4. Re-seeding is not required for the new routes; existing seed data includes `Requirement`, `Region`, and `RateBenchmark` rows.

---

## Testing Checklist

- [ ] `npm run typecheck` passes (zero errors)
- [ ] `npm run lint` passes (zero errors)
- [ ] `npm run test` passes (197 tests)
- [ ] `npm run test:coverage` meets all four thresholds (94.76% / 84.52% / 92.68% / 94.76%)
- [ ] `npm run build` succeeds — First Load JS for `/requirements` pages ≤ 200 kB
- [ ] `POST /api/requirements` creates a requirement with `status: "ENQUIRY"`
- [ ] `POST /api/requirements/[id]/match` returns ranked shortlist with per-factor `factors` breakdown
- [ ] First match transitions status to `SHORTLISTED`; re-match returns `SHORTLISTED` without re-transitioning
- [ ] Custom weights accepted; `weightsUsed` reflected in response
- [ ] Invalid weights (sum ≠ 1.0) returns HTTP 400 `"Weights must sum to 1.0"`
- [ ] `GET /requirements` returns HTTP 200
- [ ] `GET /requirements/[id]` returns HTTP 200

## Validation

```bash
npm run typecheck          # ✅ 0 errors
npm run lint               # ✅ 0 errors
npm run test               # ✅ 197/197 passing
npm run test:coverage      # ✅ 94.76% / 84.52% / 92.68% / 94.76%
npm run build              # ✅ First Load JS 106 kB (/requirements pages, 102 kB shared baseline)
```
