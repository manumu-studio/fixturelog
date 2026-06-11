# Roadmap — FixtureLog

> **Status: Day 1 spine foundation complete (2026-06-11, v0.2.0).** Repo skeleton, data model, seed, CI, and test infrastructure are in place. Day 2 (vertical slice: vessel list, fixture board, RecapFormatter) is next.

## Phase 0: Research & Foundation (current) — v0.0.0
- [x] Inspect repo, confirm empty
- [x] Clean + synthesize domain research (`docs/research/`)
- [x] Technical-decision research (APIs, stack, deployment)
- [x] Glossary + interview-prep research
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

### Day 1: Spine Foundation — v0.2.0 (COMPLETE — 2026-06-11)
- [x] Repo + CI skeleton; Neon Postgres; Prisma schema (13 models, 12 enums) + migration; idempotent seed (30 vessels + full data set)
- [x] Next.js 15 app shell + health endpoint with unit tests
- [x] Vitest (coverage thresholds 70/60/70/70) + Playwright (E2E smoke)
- [x] 4-job CI pipeline (lint-typecheck, test-coverage, build-bundle, e2e) with dual npm audit + bundle budget

### Day 2+: Vertical Slice (planned)
All items below are CORE must-haves per SPEC-001 §scope tiering.
- [ ] Route Handlers (vessels, requirements, fixtures) + fixture status workflow (subjects tracking + audit trail) + tests
- [ ] Vessel↔requirement matching algorithm — **CORE**: FixtureMatcher pure service (hard filters + weighted 0–100 score), heavily unit-tested; the technical centerpiece, not a stretch
- [ ] Recap generator — RecapFormatter pure service (deterministic SUPPLYTIME 2017 fields, Markdown + plain text) + audit trail
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
- [ ] PostGIS "vessels within N nm of port/field" (day-5 stretch with written scaling rationale; core distance math is Haversine in the service layer)
- [ ] AISStream.io live vessel layer
- [ ] Python FastAPI seed/recap/analytics service (excluded from MVP — TypeScript-only; noted as a future polyglot option)

## Explicitly out of scope (for the MVP)
- Live enterprise AIS (MarineTraffic/Spire/Kpler)
- Real charterparty legal text / e-signature
- Auth / multi-tenant complexity
- Real-time AIS as the critical path
