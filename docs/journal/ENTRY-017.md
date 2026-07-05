# Journal Entry 017 — Broker Review Signals Demo Polish

**Date:** 2026-07-05
**Type:** Demo polish
**Version:** 1.6.1

## Summary

Made the research-backed alert story visible in the broker dashboard without expanding scope. The
dashboard now surfaces broker review signals for stored screening evidence and non-workable weather
windows before a fixture is fixed.

## Rationale

The research chain pointed to a narrow, credible product claim: the copilot and dashboard should
help the broker notice evidence-backed risk before the deal becomes hard to unwind. The product
already had deterministic sanctions/operator-risk screening and weather verdicts; the missing piece
was a meeting-ready surface that makes those signals obvious.

## Key Decisions

- Keep the feature as broker-assist review signals, not autonomous AI decisions.
- Reuse existing `ScreeningResult` caches and weather snapshots; no new source or migration.
- Add pending-action rows so the broker can see what needs review before `FIXED`.
- Add a compact fixture-card signal strip so the evidence is visible in the main demo flow.

## Files Touched

- `src/lib/services/portal/broker-queries.ts`
- `src/lib/services/portal/broker-queries.test.ts`
- `src/components/portal/FixtureTimeline/FixtureTimeline.tsx`
- `src/components/portal/FixtureTimeline/FixtureTimeline.module.css`
- `README.md`
- `CHANGELOG.md`
- `docs/pull-requests/PR-1.6.1.md`

## Verification

- Targeted broker dashboard test added for screening + weather review actions.
- Full verification recorded in the PR doc.

## Demo Line

"The system does not decide whether to fix. It surfaces evidence-backed signals before the broker
moves from on-subs to fixed or finalizes the recap."
