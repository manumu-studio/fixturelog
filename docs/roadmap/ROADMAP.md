# Roadmap — FixtureLog

> **Status: PACKET-002 Core Vertical Slice complete (2026-06-12, v0.3.0).** 14 API routes, pure service layer, subject-lift → FIXED workflow, Zod validators, and two UI pages are in place. PACKET-003 (matching) is next.

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
- [x] First build packet + cursor tasks — scope locked in SPEC-001; build sequencing begins in Phase 2

## Phase 2: MVP Build — "Offshore Fixture Board + Recap Generator + Weather Window"

### PACKET-001: Spine Foundation — v0.2.0 (COMPLETE — 2026-06-11)
- [x] Repo + CI skeleton; Neon Postgres; Prisma schema (13 models, 12 enums) + migration; idempotent seed (30 vessels + full data set)
- [x] Next.js 15 app shell + health endpoint with unit tests
- [x] Vitest (coverage thresholds 70/60/70/70) + Playwright (E2E smoke)
- [x] 4-job CI pipeline (lint-typecheck, test-coverage, build-bundle, e2e) with dual npm audit + bundle budget

### PACKET-002: Core Vertical Slice — v0.3.0 (COMPLETE — 2026-06-12)
- [x] Route Handlers: 14 dynamic API routes covering charterers, vessels, fixtures, subjects, and recap; Zod validation at every boundary
- [x] Fixture status workflow: subject-gated `ON_SUBS → FIXED` enforced by `FixtureStatusPolicy`; `FixtureStatusChange` audit trail; `Fixture.fixedAt` stamped on FIXED
- [x] RecapFormatter pure service — deterministic SUPPLYTIME 2017 Markdown + plain text; no runtime LLM
- [x] Charterer UI: `/charterers` list and `/charterers/[id]` detail pages (Next.js 15 server components)
- [x] Schema additions: `SubjectItemStatus` enum, `FixtureStatusChange` model, Charterer contact columns (non-destructive migration)
- [x] 99 unit tests; 95.3% statement coverage; 0 TypeScript errors; 0 lint errors; 102 kB First Load JS

### PACKET-003: Matching (next)
All items below are CORE must-haves per SPEC-001 §scope tiering.
- [ ] FixtureMatcher pure service — hard filters + weighted 0–100 score, heavily unit-tested; the technical centerpiece
- [ ] `/api/requirements` route with matching results
- [ ] Vessel-matching UI panel
- [ ] Open-Meteo marine weather-window panel (persisted decision-time WeatherSnapshot)
- [ ] Regional map (Leaflet + OpenStreetMap, vessel + port markers) — **CORE**, built last and lazy-loaded; first must-have to slip if time-pressed

## Phase 3: Polish & Deploy (planned)
- [ ] Playwright E2E (requirement → match → fixture → recap)
- [ ] Deploy (Vercel + Neon)
- [ ] README + glossary + AI-usage note; screenshots / demo recording

## Nice-to-have (only if core lands with time to spare)
- [ ] Dashboard (summary cards + recent activity, live `/api/dashboard` aggregation if built)
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
