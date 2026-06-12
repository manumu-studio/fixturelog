# Entry 3

**Date:** 2026-06-12
**Type:** Feature
**Branch:** `feat/matching`
**Version:** `0.4.0`
**Packet:** `PACKET-003 — Requirement Matching`
**PR:** `PR-0.4.0`

## Summary

Built the technical centerpiece of FixtureLog: the FixtureMatcher engine and the full requirement-matching workflow. Starting from the PACKET-002 foundation (14 API routes, `FixtureStatusPolicy`, `RecapFormatter`), this packet added two utility modules (haversine, dp-class), a pure deterministic matching service, Zod validators for the requirement API surface, four new API routes (requirement CRUD + match endpoint), and two server-component UI pages (requirement list + shortlist detail with per-factor breakdown). The result is a demoable flow: broker creates a requirement at `ENQUIRY`, runs the match endpoint, and sees a ranked shortlist with individual distance / rateFit / capabilityMargin scores and a status transition to `SHORTLISTED`.

## Key Decisions

- **Haversine over PostGIS** — great-circle distance is computed in the service layer using a pure TypeScript haversine function (nautical miles). PostGIS was explicitly deferred out of core (SPEC-001 §scope tiering; ADR-0002). At 30-vessel scale, Haversine in-process is correct, fast, and independently testable — no spatial-DB complexity introduced.

- **Pure deterministic matcher** — `FixtureMatcher` takes plain objects and returns plain objects; no database calls inside the matcher. All I/O (fetch vessels, fetch benchmark, persist status) happens in the route handler. This keeps the matcher fully unit-testable in isolation and matches the `FixtureStatusPolicy`/`RecapFormatter` design pattern already established.

- **Two-stage design** — hard filters first (vessel type, availability, region, min deck area, min bollard pull, DP class), then weighted composite scoring for the passing set. Only candidates that clear all hard filters receive a score. The filter-then-score pattern is more efficient and produces a tighter shortlist.

- **rateFit is uniform across cohort (known limitation)** — the schema has no per-vessel day-rate column. `rateFit` is calculated as the charter budget vs. the regional rate benchmark for that vessel type. Every candidate from the same `(vesselType, region)` cohort therefore receives an identical `rateFit` score. This is documented as a known limitation; per-vessel rate data would require a schema extension (post-MVP).

- **Neutral 0.5 when budget or benchmark is absent** — if the requirement has no `dayRateBudget` or no benchmark exists for the cohort, `rateFit` defaults to 0.5. Missing data never inflates or deflates the score; it contributes neutrally to the composite.

- **Distance normalised against max in candidate set** — after hard filtering, each candidate's distance to the requirement's region port is normalised against the maximum distance among all passing candidates. Score = 1 − (dist / maxDist). This gives relative distance scoring within the shortlist rather than an absolute number, which is more meaningful when the shortlist size varies.

- **Tie-break by vessel name ascending** — when two candidates have equal composite scores, they are sorted by vessel name (A → Z) for deterministic output. No random sort.

- **`MatchResponse.status` is the actual post-operation `RequirementStatus`** — the match endpoint returns the requirement's status after the operation, not a hard-coded string. This means re-matching a `SHORTLISTED` requirement returns `'SHORTLISTED'` (actual DB value), and the handler never hard-codes `'SHORTLISTED'` as a response field.

- **`ENQUIRY → SHORTLISTED` on first match only** — the status transition fires only when the current status is `ENQUIRY`. Subsequent match calls on a `SHORTLISTED` (or any later-status) requirement run the scoring algorithm and return results without re-transitioning. This prevents spurious audit events.

- **Tunable weights, Zod-validated to sum 1.0** — callers may supply `{ distance, rateFit, capabilityMargin }` weights in the POST body. The validator uses a Zod `.refine()` guard: if the three values do not sum to exactly 1.0 (± floating-point tolerance), the request is rejected with HTTP 400 `"Weights must sum to 1.0"`. The default weights are distance 0.40 / rateFit 0.35 / capabilityMargin 0.25.

- **`ShortlistView` presentational component extracted** — the shortlist detail page (`/requirements/[id]`) had enough render logic to push the page file toward the 150-line target. `ShortlistView.tsx` was extracted as a presentational server component, keeping both files well under the complexity limit.

- **No Prisma migration** — `Requirement`, `Region`, and `RateBenchmark` all existed in the PACKET-002 schema. PACKET-003 required no schema changes; `npx prisma migrate deploy` is a no-op for this packet.

- **No incidents** — no incident files were filed during PACKET-003. The preflight gate (TASK-021) passed cleanly.

## Algorithm Details

**Stage 1 — Hard filters (all must pass):**
1. `vessel.vesselType === requirement.vesselTypeNeeded`
2. Vessel availability date ≤ requirement start date (if both present)
3. Vessel region matches requirement region
4. `vessel.deckAreaM2 >= requirement.minDeckAreaM2` (if minDeckAreaM2 set)
5. `vessel.bollardPull >= requirement.minBollardPull` (if minBollardPull set)
6. DP class meets or exceeds required minimum (`NONE < DP1 < DP2 < DP3`)

**Stage 2 — Weighted composite score (0–100):**
- **distance** (default weight 0.40): `(1 − dist / maxDist) × 100`. Normalised against the max distance in the passing candidate set.
- **rateFit** (default weight 0.35): budget-vs-regional-benchmark interpolation, clamped to [0, 1]. Formula: `((budget - minRate) / (maxRate - minRate)) × 100`, clamped to 0–100. Uniform across cohort (see rationale above). Defaults to 0.5 × 100 = 50 when budget or benchmark is absent, or when `minRate === maxRate`.
- **capabilityMargin** (default weight 0.25): DP class headroom above the requirement minimum, normalised against the maximum possible headroom in the candidate set. Rewards vessels that exceed the minimum DP requirement by a wider margin.

Final score = `distance × wDist + rateFit × wRateFit + capabilityMargin × wCap`. Tie-break: vessel name ascending.

**`ENQUIRY → SHORTLISTED` transition:** fired once, on the first successful match call, when `requirement.status === 'ENQUIRY'`. The `MatchResponse.status` field always reflects the actual post-operation requirement status.

## Files Created

**Utilities**

- `src/lib/utils/haversine.ts` — great-circle distance in nautical miles (pure function)
- `src/lib/utils/haversine.test.ts` — 6 tests
- `src/lib/utils/dp-class.ts` — DP class rank, meets-minimum, and headroom helpers (`NONE < DP1 < DP2 < DP3`)
- `src/lib/utils/dp-class.test.ts` — 20 tests

**Services**

- `src/lib/services/fixture-matcher.ts` — two-stage matching engine; `DEFAULT_WEIGHTS` (distance 0.40 / rateFit 0.35 / capabilityMargin 0.25)
- `src/lib/services/fixture-matcher.types.ts` — types for matcher input/output
- `src/lib/services/fixture-matcher.test.ts` — 51 tests

**Validators**

- `src/lib/validators/requirement.validators.ts` — Zod schemas: requirement create body, list query params, match-request weights (sum-to-1.0 refine)

**Route Handlers**

- `src/app/api/requirements/route.ts` — POST create, GET list
- `src/app/api/requirements/route.test.ts` — 10 tests
- `src/app/api/requirements/[id]/route.ts` — GET detail
- `src/app/api/requirements/[id]/route.test.ts` (part of requirement CRUD tests)
- `src/app/api/requirements/[id]/match/route.ts` — POST match
- `src/app/api/requirements/[id]/match/route.test.ts` — 9 tests

**UI Pages**

- `src/app/requirements/page.tsx` — requirement list (Next.js 15 server component)
- `src/app/requirements/[id]/page.tsx` — shortlist detail (Next.js 15 server component)
- `src/app/requirements/[id]/ShortlistView.tsx` — presentational shortlist component with per-factor breakdown

## Validation

| Gate                                                | Result                                                          |
| --------------------------------------------------- | --------------------------------------------------------------- |
| `npm run typecheck`                                 | ✅ 0 errors                                                     |
| `npm run lint`                                      | ✅ 0 errors                                                     |
| `npm run test`                                      | ✅ 197 tests across all files (99 base + 98 added this packet)  |
| Coverage: statements / branches / functions / lines | ✅ 94.76% / 84.52% / 92.68% / 94.76% (thresholds 70/60/70/70)  |
| `npm run build` — First Load JS `/requirements`     | ✅ 106 kB (102 kB shared baseline; budget < 200 kB)             |
| Golden path: create → match → SHORTLISTED           | ✅ 30 candidates, 8 passed hard filters, per-factor breakdown   |
| Re-match on SHORTLISTED returns actual status       | ✅ `SHORTLISTED` (no re-transition)                             |
| Custom weights (`weightsUsed` reflected)            | ✅ Rank order shifts as expected                                 |
| Invalid weights (sum ≠ 1.0) → 400                  | ✅ `"Weights must sum to 1.0"`                                  |
| `/requirements` → HTTP 200                          | ✅                                                              |
| `/requirements/[id]` → HTTP 200                     | ✅                                                              |

## Next Step

Begin `PACKET-004 — Weather & E2E`: integrate Open-Meteo Marine weather window, add Playwright E2E tests for the full requirement → match → fixture → recap flow, and prepare for deployment to Vercel + Neon.
