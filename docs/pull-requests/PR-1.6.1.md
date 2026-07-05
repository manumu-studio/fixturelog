# PR 1.6.1 — Broker Review Signals Demo Polish

## Summary

Adds meeting-ready broker review signals to the existing dashboard. The change makes screening and
weather risk visible before a broker moves a fixture to `FIXED`, while preserving the deterministic
status and screening gates.

## What Changed

- Added broker pending actions for pre-`FIXED` screening warnings.
- Added broker pending actions for marginal or non-workable weather windows.
- Added a compact "Broker review signals" strip to fixture cards.
- Updated living docs and package metadata to `1.6.1`.

## Safety Boundaries

- No live AIS, live sanctions API, RAG, voice wiring, schema migration, or new legal/compliance
  decision path.
- The copilot and UI still only explain stored evidence.
- The backend remains the authority for write blocking.

## Verification

```bash
npx vitest run src/lib/services/portal/broker-queries.test.ts
npm run typecheck
npm run lint
npm run build
```

## Meeting Demo

1. Open `/dashboard`.
2. Use the `ON_SUBS` fixture with marginal weather and open subjects.
3. Point to "Needs your decision" and "Broker review signals".
4. Explain that the broker owns the decision, while FixtureLog surfaces the evidence before the
   fixture is fixed or recapped.
