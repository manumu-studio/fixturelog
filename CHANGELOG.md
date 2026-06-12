# Changelog

All notable changes to FixtureLog are documented here. Versions follow [Semantic Versioning](https://semver.org/).

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
