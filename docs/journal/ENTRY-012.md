# ENTRY-012 — Landing logo animation parity with OR Studio

**Date:** 2026-06-16
**Type:** Fix (UI polish)
**Version:** Unreleased patch
**Branch:** `feat/voice-copilot`

## Summary

The landing nav logo animation now follows the OR Studio choreography more closely without copying the OR Studio mark. The previous FixtureLog implementation simplified the source asset into three strokes: a circle and two upper angled legs. That missed the actual FixtureLog monogram logic: two separated incomplete capital M shapes, one upright and one flipped.

## What changed

- Rebuilt `src/components/landing/AnimatedLogo/logoPaths.ts` around the real FixtureLog geometry: circle plus two separated incomplete capital-M strokes, one upright and one flipped.
- Updated `AnimatedLogo` to use an OR Studio-style two-layer motion pattern: delayed completed-mark reveal plus stroke-draw paths.
- Kept the reveal implementation on `motion.path` only so the existing landing tests continue to mock the same Motion primitives.
- Tuned the landing nav logo stroke width from the first thick draft down to `2.2` so the small nav rendering reads finer and closer to the source asset.
- Added global ESLint ignores for generated/vendor output so the required full lint command checks source files instead of `.next`, coverage reports, and local virtualenv files.

## Incidents opened and resolved

- `private-incident-log/INCIDENT-P12-animated-logo-motion-g-mock.md` — fixed the `motion.g` mock regression and complexity violation.
- `private-incident-log/INCIDENT-LINT-generated-artifacts.md` — fixed full ESLint scanning generated/vendor artifacts.

## Files touched

- `src/components/landing/AnimatedLogo/AnimatedLogo.tsx`
- `src/components/landing/AnimatedLogo/AnimatedLogo.types.ts`
- `src/components/landing/AnimatedLogo/logoPaths.ts`
- `src/components/landing/LandingNav/LandingNav.tsx`
- `eslint.config.mjs`
- `private-incident-log/private-incident-index.md`
- `CHANGELOG.md`
- `docs/pull-requests/PR-1.4.1.md`

## Validation

- `npx eslint src/components/landing/AnimatedLogo/AnimatedLogo.tsx src/components/landing/AnimatedLogo/logoPaths.ts src/components/landing/AnimatedLogo/AnimatedLogo.types.ts src/components/landing/LandingNav/LandingNav.tsx` — passed.
- `npx vitest run src/app/page.test.tsx` — 13 tests passed.
- `npx tsc -p tsconfig.build.json --noEmit` — passed.
- `npx eslint . --ext .ts,.tsx` — passed with zero errors and six existing Prisma seed warnings.
- `npx next build --no-lint` — passed.
- Playwright inline SVG render used to inspect the rebuilt paths when the sandbox blocked local port binding.
