# PR 1.1.0 — Public Landing Page

**Branch:** feat/public-landing → main
**Version:** 1.1.0
**Date:** 2026-06-14

---

## Summary

Adds a polished public landing page for FixtureLog. The page makes the offshore fixture workflow demo legible to any visitor — without requiring sign-in — through an animated marine-chart hero canvas, four alternating feature sections, a four-step workflow connector, tech badges, and a final CTA band linking to real public routes.

Design direction: Helical Bio Explorer motion pattern (primary animation reference) + SSY-inspired maritime editorial skin (navy/cyan palette, display-serif Fraunces, editorial spacing). SSY is a style reference only — no SSY brand assets, logos, or trademark treatments.

---

## What changed

### New files

- `src/components/landing/LandingNav/` — scroll-aware fixed nav (4-file component pattern)
- `src/components/landing/LandingHero/` — full-bleed hero with staggered copy entrance and marine canvas
- `src/components/landing/MarineTrafficCanvas/` — procedural canvas (vessel tracks, port nodes, laycan arcs, cyan ribbon)
- `src/components/landing/FeatureShowcase/` — four alternating `whileInView` feature sections
- `src/components/landing/HowItWorks/` — scroll-drawn four-step workflow connector
- `src/components/landing/TechBadges/` — staggered technology badges
- `src/components/landing/CtaFooter/` — final CTA band (Requirements, Map, Add Charterer, Health)
- `src/components/landing/LandingFooter/` — portfolio disclaimer + navigation footer
- `src/lib/constants/landing-copy.ts` — single source of truth for all landing copy
- `public/assets/landing/landing-desktop-1440.png` — landing screenshot (desktop)
- `public/assets/landing/landing-mobile-390.png` — landing screenshot (mobile)
- `e2e/landing.spec.ts` — 3 E2E tests
- `docs/journal/ENTRY-007.md`
- `docs/pull-requests/PR-1.1.0.md` (this file)

### Modified files

- `src/app/page.tsx` — replaced plain nav list with composed landing page
- `src/app/globals.css` — landing CSS design tokens (palette, motion durations, typography, spacing)
- `src/app/layout.tsx` — Fraunces + Geist fonts via `next/font`
- `src/app/page.test.tsx` — 15 unit tests (landing structure, copy, links, no-auth guarantees)
- `package.json` — `motion@^12` added; version 1.1.0
- `package-lock.json` — synced with 1.1.0
- `src/lib/constants/landing-copy.ts` — proof-strip unit test count corrected from `250+` to `264`
- `CHANGELOG.md` — 1.1.0 entry
- `README.md` — status, structure tree, test counts, design note, roadmap section
- `docs/architecture/PROJECT-CONTEXT.md` — landing and auth planning rows updated
- `docs/roadmap/ROADMAP.md` — landing shipped; auth integration as the next planned milestone
- `docs/AI-USAGE.md` — no-runtime-AI confirmed at v1.1.0
- `CONTEXT.md` — working state updated to v1.1.0

---

## What did NOT change

- No auth integration. No `next-auth`, Auth.js, OAuth provider, `AppUser` model, `/api/auth/*` routes, session provider, middleware, or protected route group was added.
- No Prisma schema changes. No migration.
- No runtime AI. The landing uses `motion@^12` for animation; no LLM or ML model is invoked.
- No SSY branding, logos, trademark treatment, or licensed fonts. SSY is an editorial style reference; the internal CSS pattern report (`docs/research/SSY-GLOBAL-LANDING-CSS-PATTERN-REPORT.md`) was the design input.
- No changes to existing domain API routes or service layer behavior.
- No changes to `src/app/charterers/`, `src/app/requirements/`, or `src/lib/server-origin.ts`.

---

## Verification

### Commands and results

```bash
# Type check
PATH="/Users/manumurillo/.nvm/versions/node/v20.20.2/bin:$PATH" npm run typecheck
# → 0 errors

# Lint
PATH="/Users/manumurillo/.nvm/versions/node/v20.20.2/bin:$PATH" npm run lint
# → 0 errors

# Unit tests
PATH="/Users/manumurillo/.nvm/versions/node/v20.20.2/bin:$PATH" npm run test -- src/app/page.test.tsx
# → 15 tests passed

# Full unit suite
PATH="/Users/manumurillo/.nvm/versions/node/v20.20.2/bin:$PATH" npm run test
# → 264 tests passed across 31 files

# E2E landing spec
PATH="/Users/manumurillo/.nvm/versions/node/v20.20.2/bin:$PATH" npm run test:e2e -- e2e/landing.spec.ts
# → 3 tests passed

# Production build
PATH="/Users/manumurillo/.nvm/versions/node/v20.20.2/bin:$PATH" npm run build
# → Build successful
```

### Auth guard check

```bash
rg -n "next-auth|NextAuth|signIn|SessionProvider|middleware|AppUser" src prisma package.json
# → No new auth implementation found
```

### SSY reference check

```bash
rg -n "SSY" src README.md docs/architecture/PROJECT-CONTEXT.md docs/roadmap/ROADMAP.md docs/pull-requests/PR-1.1.0.md
# → Only safe style-reference / disclaimer language found; no affiliation claim
```

---

## Screenshots

- Desktop (1440px): `public/assets/landing/landing-desktop-1440.png`
- Mobile (390px): `public/assets/landing/landing-mobile-390.png`

Screenshots captured after `next build` + `next start` to avoid Turbopack canvas timing differences during Playwright capture.

---

## Deployment notes

- Public landing deploys without any provider registration. All CTAs link to public routes already in production.
- `motion@^12` is a runtime dependency; it ships in the client bundle. Bundle budget (< 200 kB shared First Load JS) was verified during the build.
- Auth CTAs remain placeholder/disabled until the auth-integration work wires them to a real OAuth provider.
- No new environment variables. No Prisma migration required.

---

## No-auth guarantee

This PR contains zero authentication implementation. The "Sign in coming next" label on the landing is a disabled `<button>` element with no `onClick`, no `signIn()` call, no auth import, and no session check. The auth-integration work (v1.2.0) owns all authentication.
