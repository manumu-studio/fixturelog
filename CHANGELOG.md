# Changelog

All notable changes to FixtureLog are documented here. Versions follow [Semantic Versioning](https://semver.org/).

## [0.5.0] — 2026-06-12 (PACKET-004: Weather Enrichment + Happy-Path E2E)

### Added

- Open-Meteo Marine weather proxy: `GET /api/weather/marine?lat=&lng=` with 5-minute in-memory TTL cache; SSRF-safe Zod-validated coordinates; `current`-conditions source (not `hourly[0]`) so the values represent the present moment, not midnight
- `computeVerdict()` pure function producing a workability verdict (`WORKABLE` / `MARGINAL` / `NOT_WORKABLE`) from North Sea thresholds (wave height, swell height, wind-wave height)
- `WeatherEnricher` service — thin layer wrapping the Open-Meteo fetch + TTL cache; no database calls
- Zod validator module `weather.validators.ts` covering query params, external-response schema, and snapshot shapes
- `POST /api/fixtures/:id/weather` — persists a `WeatherSnapshot` linked to the fixture and returns the snapshot with `fixtureId`; ad-hoc lookups via the proxy route return `fixtureId: null`
- `GET /api/fixtures/:id` now includes `weatherSnapshots` in the response
- 2 seeded `WeatherSnapshot` rows attached to fixture2 and fixture3 for hermetic testing
- `e2e/happy-path.spec.ts` — first full-workflow broker E2E: requirement creation → matching → fixture creation → weather snapshot verification → subject creation + lift → `ON_SUBS → FIXED` transition → recap generation; hermetic via seeded data (zero live Open-Meteo calls)

### Quality Gates

- 42 unit tests added this packet; 239 total across 26 files
- Coverage: 94.92% statements / 85.03% branches / 93.61% functions / 94.92% lines (thresholds 70/60/70/70)
- TypeScript: 0 errors; ESLint: 0 errors
- First Load JS shared: 102 kB (budget < 200 kB)
- No Prisma migration — `WeatherSnapshot` existed in the PACKET-002 schema; no schema changes in PACKET-004

---

## [0.4.0] — 2026-06-12 (PACKET-003: Requirement Matching)

### Added

- FixtureMatcher: two-stage (hard filter + weighted score) vessel matching engine (`src/lib/services/fixture-matcher.ts`)
- Haversine great-circle distance utility returning nautical miles (`src/lib/utils/haversine.ts`)
- DP class comparison utility — rank, meets-minimum, and headroom helpers; `NONE < DP1 < DP2 < DP3` (`src/lib/utils/dp-class.ts`)
- Requirement CRUD: `POST /api/requirements`, `GET /api/requirements`, `GET /api/requirements/[id]`
- `POST /api/requirements/[id]/match` — runs the two-stage matching engine; returns a ranked shortlist with per-factor breakdown (`distance`, `rateFit`, `capabilityMargin`)
- `ENQUIRY → SHORTLISTED` status transition on first match; re-match on `SHORTLISTED` (or any later status) returns actual status unchanged
- Tunable scoring weights (default: distance 0.40, rateFit 0.35, capabilityMargin 0.25); weights reflected in `MatchResponse.weightsUsed`
- Zod validation at all requirement API boundaries: create body, list query params, match-request weights (sum-to-1.0 refine — invalid weights return HTTP 400)
- `/requirements` page: server-component requirement list with status badges
- `/requirements/[id]` page: server-component shortlist detail with per-factor score breakdown; `ShortlistView` presentational component extracted

### Quality Gates

- 98 unit tests added this packet; 197 total across all files
- Coverage: 94.76% statements / 84.52% branches / 92.68% functions / 94.76% lines (thresholds 70/60/70/70)
- TypeScript: 0 errors; ESLint: 0 errors
- First Load JS (`/requirements` pages): 106 kB (102 kB shared baseline; budget < 200 kB)
- No Prisma migration (no schema changes in PACKET-003)

---

## [0.3.0] — 2026-06-12 (PACKET-002: Core Vertical Slice)

### Added

**API Routes (14 new dynamic routes)**
- `GET /POST /api/charterers` — list charterers; register a charterer with optional contact fields
- `GET /api/charterers/[id]` — charterer detail
- `GET /api/charterers/[id]/requirements` — requirements linked to a charterer
- `GET /api/charterers/[id]/fixtures` — fixtures linked to a charterer
- `GET /api/vessels` — list vessels (filterable by type, region, availability)
- `GET /api/vessels/[id]` — vessel detail
- `GET /POST /api/fixtures` — list fixtures; create a fixture
- `GET /api/fixtures/[id]` — fixture detail
- `PATCH /api/fixtures/[id]/status` — transition fixture status (subject-gated on `ON_SUBS → FIXED`)
- `POST /api/fixtures/[id]/recap` — generate and persist a deterministic SUPPLYTIME 2017 recap
- `POST /api/fixtures/[id]/subjects` — add a subject to a fixture
- `PATCH /api/fixtures/[id]/subjects/[subjectId]` — update subject status (`LIFTED` / `WAIVED`)

**Services**
- `FixtureStatusPolicy` — pure service enforcing the canonical status machine; subject-gated `ON_SUBS → FIXED` (requires ≥1 subject with every subject `LIFTED` or `WAIVED`); returns 400 with outstanding-subject count on rejection; writes a `FixtureStatusChange` audit row on every transition; stamps `Fixture.fixedAt` on transition to `FIXED`
- `RecapFormatter` — pure service producing deterministic SUPPLYTIME 2017 recap in Markdown + plain text; no runtime LLM

**Validators**
- Zod validator modules for charterer, vessel, fixture, and subject boundaries — all route handlers parse request input through these schemas (resolves carry-forward W2)

**UI Pages**
- `/charterers` — charterer list (Next.js 15 server component)
- `/charterers/[id]` — charterer detail with linked requirements and fixtures (Next.js 15 server component)

**Schema**
- `SubjectItemStatus` Postgres enum (`PENDING`, `LIFTED`, `WAIVED`) — replaces plain string on `SubjectItem.status` (resolves carry-forward N1)
- `FixtureStatusChange` audit model — immutable per-transition record (actor, fromStatus, toStatus); indexed on `fixtureId`; cascades on delete
- `Charterer` contact columns — `contactName`, `contactEmail`, `contactPhone` (optional, non-destructive migration)
- Migration: `prisma/migrations/20260612150000_vertical_slice_subjects_audit_contact`

**Infrastructure**
- Node.js ≥20 pinned via `package.json` `engines` and `.nvmrc 20.20.2` (resolves INCIDENT-P01-vitest-esm-startup)
- `import 'server-only'` added to `src/lib/prisma.ts` (resolves carry-forward N3)
- Coverage config extended to include `src/app/api/**`

### Fixed
- `INCIDENT-P01-vitest-esm-startup` — Vitest ESM startup failure on Node 18; resolved by pinning Node 20
- `INCIDENT-P01-npm-audit-critical-dev` — `happy-dom` high-severity audit failure; resolved by removing unused dependency

### Quality Gates
- 99 unit tests across 15 files; all passing
- Coverage: 95.3% statements / 82.8% branches / 95.5% functions / 95.3% lines (thresholds 70/60/70/70)
- TypeScript: 0 errors; ESLint: 0 errors
- First Load JS shared: 102 kB (budget < 200 kB)

---

## [0.2.0] — 2026-06-11 (PACKET-001: Spine Foundation)

### Added
- Next.js 15 project initialized with App Router and strict TypeScript
- Prisma schema: 13 models, 12 enums matching SPEC-001 sections 2-3
- Initial database migration for all tables
- Idempotent seed: 30 vessels across 6 types, 8 owners, 6 charterers, 4 brokers, 7 regions, 9 workscopes, 6 rate benchmarks, 4 requirements, 3 fixtures, subject items, recap
- Health endpoint (`/api/health`) with extracted testable helper
- Unit tests for health check logic (Vitest)
- E2E smoke tests (Playwright — homepage + health endpoint)
- Vitest configuration with coverage thresholds (70/60/70/70)
- Playwright configuration with global DB seed setup
- 4-job CI pipeline: lint-typecheck, test-coverage, build-bundle, e2e
- Dual npm audit (full + prod-only) in CI
- Bundle size budget enforcement (200 kB First-Load JS)
- ESLint flat config with complexity caps (300 lines, 80/function, complexity 15, depth 3, params 4)
- `.env.example` template

---

## [0.1.0] — 2026-06-11 (Project Spec & Decisions)

### Added
- `docs/decisions/ADR-0002-data-and-integration-strategy.md` — data & integration strategy.
- `docs/decisions/ADR-0003-application-architecture.md` — application architecture.
- `docs/specs/SPEC-001-mvp-build.md` — MVP build spec (scope tiers, canonical status enums, data model, feature contracts, CI/CD, build sequence).
- `docs/journal/ENTRY-001.md` — consolidated packet journal entry.

### Decided
- **Architecture:** Next.js full-stack (App Router + Route Handlers, Node runtime) + service layer (`FixtureMatcher`, `RecapFormatter`, `WeatherEnricher`, `FixtureStatusPolicy`); one Vercel deploy unit (ADR-0003).
- **Canonical status enums:** `Fixture.status` = `DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED` (+ `FAILED`); `Requirement.status` = `ENQUIRY → SHORTLISTED → NEGOTIATING → ON_SUBS → FIXED` (+ `LOST`) (SPEC-001 §2).
- **Data strategy:** seeded Postgres + Open-Meteo Marine as the one real API; AIS deferred; weather persisted as decision-time snapshots; honesty rule via `source`/`confidence` (ADR-0002).
- **Matching:** `FixtureMatcher` is core (hard filters + weighted 0–100 score); Haversine distance core, PostGIS a post-MVP stretch.
- **Recap:** deterministic SUPPLYTIME formatter (Markdown + plain text), no runtime LLM.
- **CI/CD:** mirrors `learning-speaking-app` 1:1 (lint-typecheck · test-coverage · build-bundle · Playwright e2e) + Vercel per-PR previews.
- **Deploy target:** Vercel + Neon (Postgres-only; Python FastAPI service excluded from MVP).

---

## [0.0.0] — 2026-06-11 (research/planning foundation)

### Added
- Research foundation under `docs/research/`:
  - `SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md` — synthesised domain reference.
  - `SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md` — recommended project, data model, pages/routes, build plan, worked pipeline example.
  - `SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md` — real-vs-mock data strategy, API inventory, stack, deployment, seed figures.
  - `SSY-OFFSHORE-GLOSSARY.md` — plain-English glossary + cheat sheet.
- Methodology scaffolding: `docs/architecture/PROJECT-CONTEXT.md`, `docs/decisions/ADR-0001-research-first-methodology.md`, consolidated journal entry, `docs/roadmap/ROADMAP.md`, and project rules.
- Agent/project rules: `.clauderules` and `.cursorrules` to keep future Claude Code and Cursor sessions aligned with the research-first methodology.
- `README.md` (project overview, status, research index, methodology).

### Notes
- **No application code, packages, or frameworks** — research-first by design (ADR-0001).
- Source research citation markers stripped; confidence tags (`CONFIRMED`/`[LIKELY]`/`[INFERENCE]`/`[UNVERIFIED]`) preserved.

---

_0.1.0 is a documentation/spec milestone — no application code yet. The first **code** release will follow the first build packet (see `docs/roadmap/ROADMAP.md`)._
