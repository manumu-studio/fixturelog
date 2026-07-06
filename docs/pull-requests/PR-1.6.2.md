# PR 1.6.2 — Interview Demo Surface Restoration

## Summary

Restores the public FixtureLog demo to the full offshore workflow landing and polishes the broker
requirement/charterer pages, while preserving the v1.6 Broker Review Signals story.

## What Changed

- Restored `/` to the product landing: marine hero, proof metrics, feature showcase, fleet teaser,
  workflow steps, tech stack, CTA footer, and role-aware auth CTAs.
- Reworked `/requirements` and `/requirements/[id]` with portal cards, metrics, responsive tables,
  status/screening badges, and a shortlist detail view that explains matching evidence without
  implying clearance.
- Reworked `/charterers`, `/charterers/[id]`, and `/charterers/new` into a polished broker client
  book with metrics, profile details, activity tables, and a styled registration form.
- Fixed restored-landing mobile overflow and refreshed desktop/mobile landing screenshots.
- Updated stale Playwright landing/smoke checks that still expected the superseded locked build page.
- Hardened `.gitignore` so a local `node_modules` symlink used by clean worktrees cannot be staged.
- Redirected unknown browser routes to `/` so visitors return to the public domain landing.
- Synced living docs and package metadata to `1.6.2`.

## Safety Boundaries

- No schema migration, new sanctions source, live AIS, RAG, voice wiring, legal advice, autonomous
  clearing, or public broker-copilot exposure.
- Matching, screening, and weather remain evidence for broker review; the backend remains the only
  authority for write blocking.
- The limited public assistant endpoint remains available behind its existing route, but it is no
  longer the live `/` surface.
- API endpoints keep explicit JSON `401`/`403`/`404` semantics for fetch clients; the redirect
  fallback is for browser page navigation.

## Verification

```bash
npm run typecheck
npm run lint
npm run test -- src/app/page.test.tsx src/app/not-found.test.tsx src/middleware.test.ts
npx playwright test e2e/landing.spec.ts e2e/smoke.spec.ts
npx playwright test
npm run build
```

## Deployment Notes

Deploy and open `/` first. It should show the offshore workflow landing, not the locked assistant
build page. Then sign in as a broker and verify `/requirements`, a requirement detail, and
`/charterers` render with portal styling, screening badges, and the review-gate copy.
