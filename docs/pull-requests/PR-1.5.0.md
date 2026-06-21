# PR 1.5.0 — Sanctions / Operator-Risk Screening Gate

## Summary

Adds the first deterministic sanctions/operator-risk screening slice for FixtureLog. The implementation screens parties with local normalized fixture data, stores immutable `ScreeningResult` evidence, updates provenance cache fields for badges, and blocks `ON_SUBS → FIXED` when screening is true `BLOCKED`, stale, unresolved, or unavailable.

## What Changed

- Added additive Prisma entities/enums for `Operator`, `ScreeningResult`, `ScreeningReview`, `ScreeningStatus`, `ScreeningSubjectType`, and `ScreeningReviewAction`.
- Added `Vessel.flagState`, nullable operator links, and provenance cache fields on screenable parties.
- Added `src/lib/services/sanctions-screening/` with Zod-parsed local fixture records, deterministic classification, TTL freshness, gate evaluation, and true-`BLOCKED` review protection.
- Wired the screening gate into both the status API route and copilot status executor.
- Added charterer screening on broker requirement creation.
- Added compact screening badges to broker requirement/dashboard/fixture surfaces and inline close-action warnings.
- Extended copilot grounding and prompt rules for stored screening evidence and refusal boundaries.

## Safety Boundaries

- No `CLEAN_FIXED` status was introduced.
- No live yente, direct government ingestion, AIS, voice/RAG, legal advice, autonomous compliance clearing, or broker override for true `BLOCKED`.
- `ScreeningResult` remains the source of truth; denormalized fields are cache/provenance only.

## Verification

```bash
npx vitest run src/lib/services/sanctions-screening/sanctions-screening.test.ts 'src/app/api/fixtures/[id]/status/route.test.ts' src/lib/services/copilot/tools/advance-fixture-status.tool.test.ts src/lib/services/portal/broker-queries.test.ts
npm run typecheck
npm run lint
```

All passed. `npm run lint` emitted only the existing Next.js `next lint` deprecation/workspace-root warnings.

## Follow-Up

- Add shortlist and fixture-create screening triggers.
- Add a richer review/case surface if the demo needs compliance workflow beyond the hard gate.
- Replace or supplement the local fixture adapter with yente/direct government ingestion after licensing/source decisions are complete.
