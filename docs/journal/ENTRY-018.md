# Journal Entry 018 — Interview Demo Surface Restoration

**Date:** 2026-07-06
**Type:** Demo restoration / UI polish
**Version:** 1.6.2

## Summary

Restored FixtureLog's public first screen from the locked assistant-build page back to the full
offshore workflow landing. The broker requirement and charterer pages that looked raw beside the
portal now use the portal design kit, so the interview demo opens with the actual offshore workflow
and then continues into polished broker review surfaces.

## Rationale

The locked assistant page was useful while the public demo was being refined, but it hid the strongest
SSY interview story: enquiry to shortlist, screening and weather evidence, broker review, fixture, and
recap. This patch restores that story without undoing the newer sanctions/operator-risk and Broker
Review Signals work on `main`.

## Key Decisions

- Keep the public `/` route as the offshore workflow landing, not the under-construction assistant page.
- Preserve screening badges and review-signal language from v1.5/v1.6.
- Frame matching and screening as evidence for a human broker review, not as vessel clearance or legal
  advice.
- Redirect unknown browser routes to `/`; keep API routes on explicit JSON status codes.
- Avoid unrelated voice, auth, config, or worker changes from the older dirty branch.

## Files Touched

- `src/app/page.tsx`, `src/app/page.module.css`, `src/app/page.test.tsx`
- `src/app/not-found.tsx`, `src/app/not-found.test.tsx`, `src/middleware.ts`,
  `src/middleware.test.ts`
- `.gitignore`
- `src/components/landing/FeatureShowcase/`
- `src/components/landing/CtaFooter/`, `src/components/landing/LandingFooter/`
- `src/app/(app)/requirements/`
- `src/app/(app)/charterers/`
- `e2e/landing.spec.ts`, `e2e/smoke.spec.ts`
- `public/assets/landing/landing-desktop-1440.png`
- `public/assets/landing/landing-mobile-390.png`
- `docs/incidents/INCIDENT-P001-stale-landing-e2e.md`,
  `docs/incidents/INCIDENT_REGISTRY.md`
- `README.md`, `CHANGELOG.md`, `docs/roadmap/ROADMAP.md`,
  `docs/architecture/PROJECT-CONTEXT.md`, `docs/architecture/DATABASE-NEON-TABLE-MAP.md`,
  `docs/architecture/API-TO-NEON-TABLE-MAP.md`,
  `docs/architecture/COMPANY-WORKFLOW-CHARTERER-ENQUIRY.md`, `package.json`, `package-lock.json`

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test -- src/app/page.test.tsx`
- `npm run test -- src/app/not-found.test.tsx src/middleware.test.ts`
- `npx playwright test e2e/landing.spec.ts e2e/smoke.spec.ts`
- `npx playwright test`
- `npm run build`

## Follow-up Fix

After PR creation, Husky `pre-push` exposed two local-checkout issues:

- Stale Playwright landing/smoke assertions still expected the superseded locked build copy.
- The clean worktree needed dependency/env symlinks for local hooks; `.gitignore` now ignores a
  `node_modules` symlink as well as a real dependency directory.
- Added `docs/architecture/DATABASE-NEON-TABLE-MAP.md` as a meeting-prep view of the Neon tables.
- Added `docs/architecture/API-TO-NEON-TABLE-MAP.md` to show how each API route reaches Neon.
- Added ASCII diagram fallbacks and a company workflow guide from charterer enquiry to recap.
- Hid the live voice copilot card from the broker dashboard UI; the existing backend route and component files
  remain untouched for now.

## Demo Line

"FixtureLog does not clear vessels. It gives the broker a shortlist, stored screening evidence,
weather context, and review signals before the broker owns the decision."
