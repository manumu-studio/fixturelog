# Journal Entry 013 — Sanctions / Operator-Risk Screening Gate

**Date:** 2026-06-20
**Type:** Feature
**Version:** 1.5.0

## Summary

Implemented the first vertical sanctions/operator-risk slice from the Stage 3 packet: additive screening data structures, a local normalized fixture adapter, deterministic classification, a 24-hour TTL, a shared pre-`FIXED` gate, compact broker-facing badges, and copilot evidence/refusal boundaries.

## Rationale

Stage 0.1 and the Stage 1 cross-check collapsed the research chain to one buildable gap: sanctions/operator-risk screening. The feature must be deterministic, provenance-carrying, and non-overridable for true `BLOCKED` results. The implementation starts with local fixture data rather than yente/direct government ingestion so the demo is stable while preserving the adapter seam for later sources.

## Key Decisions

- `ScreeningResult` is the authoritative audit trail; denormalized latest-status fields are cache/provenance only.
- `ON_SUBS → FIXED` now composes the existing subject-lift gate with the screening gate.
- True `BLOCKED` results cannot be broker-cleared; only review/escalate/cannot-proceed behavior is allowed.
- Copilot can explain stored screening evidence but cannot perform legal analysis, external lookups, clearing, or overrides.

## Files Touched

- `prisma/schema.prisma` and `prisma/migrations/20260620160000_sanctions_operator_risk/migration.sql`
- `src/lib/services/sanctions-screening/*`
- `src/app/api/fixtures/[id]/status/route.ts`
- `src/lib/services/copilot/tools/advance-fixture-status.tool.ts`
- `src/app/api/requirements/route.ts`
- Portal validators, mappers, dashboard/list/timeline/close-action UI, copilot prompt and summary
- README, CHANGELOG, PR documentation, language log

## Verification

- `npx vitest run src/lib/services/sanctions-screening/sanctions-screening.test.ts 'src/app/api/fixtures/[id]/status/route.test.ts' src/lib/services/copilot/tools/advance-fixture-status.tool.test.ts src/lib/services/portal/broker-queries.test.ts`
- `npm run typecheck`
- `npm run lint`

## Deferred

- Live yente/direct-government ingestion.
- Match-time shortlist screening trigger.
- Fixture-create screening trigger.
- Full compliance case workflow beyond minimal `ScreeningReview`.
- AIS/dark-fleet behavior and beneficial-ownership traversal.
