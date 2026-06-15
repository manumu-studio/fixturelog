# Roadmap — FixtureLog

> **Status: v1.3.0 — two-sided product (2026-06-15).** All five MVP packages, the PACKET-007 landing, PACKET-008 auth, and **PACKET-009 (charterer Client Portal `/portal` + broker Dashboard `/dashboard`)** are shipped. Both authenticated homes are role-gated on the `AppUser` identity (Broker → `/dashboard`, Charterer → `/portal`); the landing stays public. 343 unit tests across 52 files; coverage is above the 70/60/70/70 gate; 7 E2E across 4 specs; production build + `npm audit` green. Configured for Vercel + Neon deploy. **The runtime AI Broker Copilot is dropped** — the two-sided portal/dashboard is the product direction. Next: deepen the two-sided workflow and harden role isolation.

## Phase 0: Research & Foundation (current) — v0.0.0
- [x] Inspect repo, confirm empty
- [x] Clean + synthesize domain research (`docs/research/`)
- [x] Technical-decision research (APIs, stack, deployment)
- [x] Glossary + role-context research
- [x] Methodology scaffolding (ADR-0001, PROJECT-CONTEXT, journal, incidents, roadmap, changelog, context)
- [x] ADR-0002: ratify data strategy (seeded + Open-Meteo)
- [x] First spec: lock MVP scope + canonical status enum

## Phase 1: Project Spec & Decisions — v0.1.0 (COMPLETE — 2026-06-11)
Resolved by `docs/decisions/ADR-0002-data-and-integration-strategy.md`, `docs/decisions/ADR-0003-application-architecture.md`, and `docs/specs/SPEC-001-mvp-build.md`.
- [x] Reconcile data model — canonical status enums locked (SPEC-001): Fixture `DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED` + `FAILED`; Requirement `ENQUIRY → SHORTLISTED → NEGOTIATING → ON_SUBS → FIXED` + `LOST` (`ENQUIRY` lives on the Requirement, not the Fixture)
- [x] Decide architecture — Next.js full-stack (App Router + Route Handlers, Node runtime + Prisma) with a service layer (FixtureMatcher, RecapFormatter, WeatherEnricher, FixtureStatusPolicy); single Vercel deploy (ADR-0003). Separate Node/Express API + React SPA rejected.
- [x] Decide PostGIS / Python service / AISStream inclusion — all DEFERRED out of core: PostGIS + AISStream.io are stretch, Python FastAPI excluded from MVP (TypeScript-only) (ADR-0002, SPEC-001 §scope tiering)
- [x] First implementation work package + task files — scope locked in SPEC-001; build sequencing begins in Phase 2

## Phase 2: MVP Build — "Offshore Fixture Board + Recap Generator + Weather Window"

### Spine Foundation — v0.2.0 (COMPLETE — 2026-06-11)
- [x] Repo + CI skeleton; Neon Postgres; Prisma schema (13 models, 12 enums) + migration; idempotent seed (30 vessels + full data set)
- [x] Next.js 15 app shell + health endpoint with unit tests
- [x] Vitest (coverage thresholds 70/60/70/70) + Playwright (E2E smoke)
- [x] 4-job CI pipeline (lint-typecheck, test-coverage, build-bundle, e2e) with dual npm audit + bundle budget

### Core Vertical Slice — v0.3.0 (COMPLETE — 2026-06-12)
- [x] Route Handlers: 14 dynamic API routes covering charterers, vessels, fixtures, subjects, and recap; Zod validation at every boundary
- [x] Fixture status workflow: subject-gated `ON_SUBS → FIXED` enforced by `FixtureStatusPolicy`; `FixtureStatusChange` audit trail; `Fixture.fixedAt` stamped on FIXED
- [x] RecapFormatter pure service — deterministic SUPPLYTIME 2017 Markdown + plain text; no runtime LLM
- [x] Charterer UI: `/charterers` list and `/charterers/[id]` detail pages (Next.js 15 server components)
- [x] Schema additions: `SubjectItemStatus` enum, `FixtureStatusChange` model, Charterer contact columns (non-destructive migration)
- [x] 99 unit tests; 95.3% statement coverage; 0 TypeScript errors; 0 lint errors; 102 kB First Load JS

### Requirement Matching — v0.4.0 (COMPLETE — 2026-06-12)
- [x] FixtureMatcher pure service — two-stage (hard filters + weighted composite score); haversine distance + dp-class utilities; heavily unit-tested
- [x] Requirement CRUD: `POST /api/requirements`, `GET /api/requirements`, `GET /api/requirements/[id]`
- [x] `POST /api/requirements/[id]/match` — ranked shortlist with per-factor breakdown; `ENQUIRY → SHORTLISTED` transition; tunable weights (0.40/0.35/0.25) with sum-to-1.0 Zod validation
- [x] Shortlist UI: `/requirements` list page + `/requirements/[id]` detail page with per-factor score breakdown (server components)
- [x] 98 unit tests added; 197 total; 94.76% statement coverage; 0 TypeScript errors; 0 lint errors; 106 kB First Load JS

### Weather Enrichment + Happy-Path E2E — v0.5.0 (COMPLETE — 2026-06-12)
- [x] Open-Meteo Marine weather proxy: `GET /api/weather/marine` with 5-minute in-memory TTL cache, SSRF-safe validated coordinates, `current`-conditions source
- [x] `computeVerdict()` pure function — workability verdict (`WORKABLE` / `MARGINAL` / `NOT_WORKABLE`) from North Sea thresholds
- [x] `WeatherEnricher` service — Open-Meteo fetch + TTL cache; no database writes
- [x] `POST /api/fixtures/:id/weather` — persists a fixture-linked `WeatherSnapshot`; `fixtureId: null` for ad-hoc proxy lookups
- [x] `GET /api/fixtures/:id` now includes `weatherSnapshots` (additive, non-breaking)
- [x] 2 seeded `WeatherSnapshot` rows for hermetic testing
- [x] `e2e/happy-path.spec.ts` — first full-workflow broker E2E covering requirement → match → fixture → weather → subject-lift gate → `ON_SUBS → FIXED` → recap; hermetic (zero live Open-Meteo calls)
- [x] 239 unit tests (42 added this packet); 94.92% statement coverage; 0 TypeScript errors; 0 lint errors; 102 kB First Load JS
- **Future concern:** rate limiting on the weather proxy — Open-Meteo has undocumented limits; a per-IP rate limiter or backoff strategy should be added before production traffic exposure (not an in-code TODO)

### Map + Deploy + Polish — v1.0.0 ✅ COMPLETE (2026-06-13)
- [x] Regional Leaflet map at `/map`: color-coded `CircleMarker` per vessel, popup with name, type, owner, status, port, source, and confidence; `SEEDED` label
- [x] `GET /api/vessels/positions` — lightweight latest-position-per-vessel endpoint with Zod validators
- [x] Real landing page at `/` replacing the Next.js default
- [x] Vercel + Neon deploy configuration: `NEXT_PUBLIC_APP_URL`, `postinstall: prisma generate`, Leaflet deps
- [x] `e2e/map.spec.ts` — hermetic map E2E; OSM tile requests aborted
- [x] Documentation closeout: `docs/GLOSSARY.md`, `docs/AI-USAGE.md`, comprehensive `README.md`, `CHANGELOG.md` v1.0.0
- [x] 250 unit tests; 4 E2E specs; 103 kB shared First Load JS; 0 TypeScript errors; 0 lint errors
- **Known gap (deferred):** port markers (SPEC-001 §4.8) — no standalone `Port` model with coordinates; ports are string fields on `PositionSnapshot`. Future: derive port locations from `PositionSnapshot.portName` + lat/lng or a static map.

### Public Landing — v1.1.0 ✅ COMPLETE (2026-06-14)
- [x] Public landing page at `/` with animated marine-chart hero canvas (vessel tracks, port nodes, laycan arcs, cyan ribbon)
- [x] Helical Bio Explorer motion pattern (primary) + SSY editorial skin (navy/cyan, Fraunces serif) — hybrid design direction
- [x] Landing components: `LandingNav`, `LandingHero`, `MarineTrafficCanvas`, `FeatureShowcase`, `HowItWorks`, `TechBadges`, `CtaFooter`, `LandingFooter` (4-file pattern throughout)
- [x] `motion@^12` added for staggered entrance, `whileInView` reveals, scroll-drawn connector, badge stagger
- [x] All landing copy centralised in `src/lib/constants/landing-copy.ts`
- [x] Landing unit tests: 15 tests in `src/app/page.test.tsx`; landing E2E: 3 tests in `e2e/landing.spec.ts`
- [x] Screenshots under `public/assets/landing/`
- [x] Total: 264 unit tests across 31 files; 4 E2E specs

## Phase 3: Post-MVP

### Auth Integration — v1.2.0 ✅ COMPLETE (2026-06-14)
- [x] **PACKET-008: Auth integration** — shared ManuMuStudio OIDC (Auth.js/NextAuth v5), `/api/auth/*` routes, `(app)` protected route group + API gating (`requireSession`/`requireApiSession`), `AppUser`→`Broker` actor mapping (migration `auth_integration`), real landing sign-in CTAs (`AuthCta`), security-headers middleware; write routes resolve the actor from the session, not the body

### Planned
- [ ] Deploy verification: screenshots / demo recording after Vercel + Neon deploy
- [ ] Rate limiting on the weather proxy (Open-Meteo has undocumented limits)
- [ ] Deepen the two-sided workflow — richer charterer status visibility, broker handoff states, and document history.
- [ ] Harden role isolation — regression coverage around broker/client redirects, cross-charterer reads, and shared `/map` capabilities.

## Nice-to-have (only if core lands with time to spare)
- [ ] Dashboard refinements (filters, saved views, and richer activity history)
- [ ] Day-rate benchmarking view (last-done + rolling average)

## Stretch / "impressive but realistic" (only if ahead of schedule)
- [ ] PostGIS "vessels within N nm of port/field" (post-MVP stretch with written scaling rationale; core distance math is Haversine in the service layer)
- [ ] AISStream.io live vessel layer
- [ ] Python FastAPI seed/recap/analytics service (excluded from MVP — TypeScript-only; noted as a future polyglot option)

## Explicitly out of scope (for the MVP)
- Live enterprise AIS (MarineTraffic/Spire/Kpler)
- Real charterparty legal text / e-signature
- Auth / multi-tenant complexity
- Real-time AIS as the critical path
