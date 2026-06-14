# Journal Entry 007 — Public Landing Page

**Date:** 2026-06-14
**Type:** Feature
**Version:** 1.1.0
**Branch:** feat/public-landing
**Packet:** PACKET-007

---

## Summary

Built a polished public landing page for FixtureLog that explains the offshore fixture workflow demo clearly before auth exists. The page is interview-ready: a visitor understands within one screen that FixtureLog is an offshore fixture workflow tool, then scrolls through the exact capabilities that are already live.

---

## Why

- Ship the product story before auth. The MVP was feature-complete but the `/` route was a plain nav list with no context.
- Explain the demo clearly to interview reviewers without requiring sign-in.
- Demonstrate portfolio-quality frontend work (animation, responsive design, component architecture) alongside the backend/service layer.
- Keep auth as a clean, separate security packet (PACKET-008) — mixing auth UI into a landing packet would risk scope creep and incomplete testing.

---

## Design decisions

### Hybrid direction: Helical motion (primary) + SSY editorial skin (secondary)

The clearest design brief for this packet was: don't invent a new motion language — port the Helical Bio Explorer animation pattern into FixtureLog's domain, then re-skin it with SSY's editorial vocabulary.

- **Helical Bio Explorer** (primary): frame loop architecture, reduced-motion branch, CTA hover/intensity response, staggered entrance timing, `whileInView` reveal rhythm, scroll-aware nav, and `HowItWorks` scroll-drawn connector. These mechanics are preserved structurally.
- **SSY editorial skin** (secondary): display-serif Fraunces + Geist sans, deep navy `#000061`, cyan `#00e2fd`, full-width grid rhythm, generous section spacing, pill CTAs, and maritime-commercial copy tone. Informed by a CSS pattern audit of the SSY Global public homepage saved at `docs/research/SSY-GLOBAL-LANDING-CSS-PATTERN-REPORT.md`.

SSY is a style reference only. No SSY brand assets, logos, trademarks, or licensed fonts were used.

### `motion@^12` dependency decision

`motion@^12` was added (not skipped) because the Helical reference already uses `motion/react-client` and the required behavior — staggered entrance, `whileInView`, scroll-driven connector, badge stagger — would require significant IntersectionObserver boilerplate to replicate in raw CSS/JS without material quality loss. The dependency is isolated to landing components; the canvas itself uses raw `requestAnimationFrame`.

### Auth split into PACKET-008

The landing includes a disabled "Sign in coming next" `<button>` teaser with no auth behavior. PACKET-008 owns: OAuth/OIDC provider registration, Auth.js/NextAuth integration, `/api/auth/*` routes, protected route groups, session-aware shell, and `AppUser`/actor identity model. This split keeps PACKET-007 hermetically frontend-only with zero auth risk surface.

### `MarineTrafficCanvas` re-theme

The Helical `HeroCanvas` animation architecture (particle system, frame loop, reduced-motion branch) was ported and re-themed. Helix/cell particles became: vessel dots with drift tracks, port node circles, route/laycan arc curves, and a cyan ribbon. The SSY cyan wave signature was adapted as a marine route ribbon — not copied as a brand element.

---

## Files created / modified

**New components (4-file pattern):**
- `src/components/landing/LandingNav/` — scroll-aware fixed nav (transparent → blurred/surfaced on scroll)
- `src/components/landing/LandingHero/` — full-bleed hero, staggered copy entrance, utility links, auth teaser
- `src/components/landing/MarineTrafficCanvas/` — procedural canvas: vessel tracks, port nodes, laycan arcs, cyan ribbon
- `src/components/landing/FeatureShowcase/` — four alternating `whileInView` feature rows
- `src/components/landing/HowItWorks/` — four-step scroll-drawn workflow connector
- `src/components/landing/TechBadges/` — staggered technology badge grid
- `src/components/landing/CtaFooter/` — final CTA band with real public demo links
- `src/components/landing/LandingFooter/` — portfolio disclaimer + nav footer

**New constants / assets:**
- `src/lib/constants/landing-copy.ts` — all landing copy (nav, hero, proof strip, features, steps, badges, CTA, footer)
- `public/assets/landing/landing-desktop-1440.png` — landing screenshot (desktop 1440px)
- `public/assets/landing/landing-mobile-390.png` — landing screenshot (mobile 390px)

**Modified:**
- `src/app/page.tsx` — replaced plain nav list with composed landing page
- `src/app/globals.css` — added landing design tokens (palette, motion durations, typography, spacing units)
- `src/app/layout.tsx` — added Fraunces + Geist fonts via `next/font`
- `src/app/page.test.tsx` — 15 unit tests for landing structure, copy, links, and no-auth guarantees
- `e2e/landing.spec.ts` — 3 E2E tests (desktop render, mobile render, canvas non-blank)
- `package.json` — `motion@^12` added; version bumped to 1.1.0
- `package-lock.json` — synced with 1.1.0

**Docs (this packet):**
- `docs/journal/ENTRY-007.md` (this file)
- `docs/pull-requests/PR-1.1.0.md`
- `CHANGELOG.md` — 1.1.0 entry added
- `README.md` — status, structure, counts, design note updated
- `docs/architecture/PROJECT-CONTEXT.md` — landing and auth planning updated
- `docs/roadmap/ROADMAP.md` — landing shipped; PACKET-008 auth next
- `docs/AI-USAGE.md` — no-runtime-AI confirmed at v1.1.0
- `CONTEXT.md` — working state updated

---

## Decisions

- PACKET-007 = public landing only.
- PACKET-008 owns auth integration (OAuth, NextAuth, protected routes, `AppUser`).
- Helical motion pattern is the primary animation source; SSY editorial is the visual skin.
- SSY CSS pattern report is an internal design input — not a brand affiliation.
- `motion@^12` added deliberately (not skipped) because re-implementing `whileInView` + stagger in raw JS would cost more in complexity than the dependency saves.
- Runtime AI remains planned, not built.
- Proof-strip unit test count corrected from stale `250+` to `264` during documentation closeout.

---

## Verification

All gates passed at packet close:

```
npm run typecheck   → 0 errors
npm run lint        → 0 errors
npm run test        → 264 passed (31 files)
npm run test:e2e    → (landing.spec.ts + 3 others) all passing
npm run build       → build successful
```

Screenshot-timing note: landing screenshots were captured after `next build` + `next start` rather than the Turbopack dev server to avoid canvas rendering timing differences in the Playwright capture.
