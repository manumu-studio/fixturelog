# FixtureLog — Project Context

> **Status: PACKET-004 WEATHER ENRICHMENT + HAPPY-PATH E2E COMPLETE (2026-06-12, v0.5.0).** 20 domain API endpoints plus the health endpoint, weather enrichment layer (`computeVerdict()` + `WeatherEnricher` + two weather routes), fixture-detail `weatherSnapshots` exposure, hermetic full-workflow E2E (3 specs), and 239 unit tests are in place. PACKET-005 (weather UI / visual demo polish) is next.
>
> **Build source-of-truth:** `docs/specs/SPEC-001-mvp-build.md`.

---

## 1. What FixtureLog is

FixtureLog is a **portfolio demo project**: a small but realistic **offshore shipbroking workflow application**. The likely shape is an **Offshore Fixture Board + Recap Generator with a marine "weather window" check** — a tool that lets a broker capture a client requirement, match available offshore vessels, record the fixture (the agreed deal), generate a recap (the deal summary), and check whether marine weather supports the work window.

In one sentence: *FixtureLog models the shortest credible path from an offshore enquiry to a fixed deal and its recap, with one real external data source where it genuinely helps.*

---

## 2. Why it exists — SSY role context

FixtureLog is built as a **portfolio demonstration for a Full-Stack Developer role at SSY (Simpson Spence Young)**, the world's largest independent shipbroker. The public role description:
- focuses on building and evolving an **Offshore Broking platform**,
- uses **React, TypeScript, Node.js, PostgreSQL** (the role also mentions SQL Server),
- is a **hybrid London** position,
- explicitly emphasises **AI-assisted development** and responsible engineering judgment,
- and expects close collaboration with brokers to turn real workflows into software.

The goal of FixtureLog is to show **domain understanding + engineering fundamentals + disciplined product judgment** — not to clone an enterprise platform. The strongest signal driving the project: **SSY's own public offshore site exposes a dashboard of Fixtures, Requirements, Positions, and a Live Weather Map** — so FixtureLog deliberately mirrors that vocabulary rather than inventing a generic dashboard.

Only public role requirements and product/domain context are included in repository documentation.

---

## 3. Current decision status — core decisions ratified

| Area | Status |
|------|--------|
| Domain research | ✅ Done — see `docs/research/` |
| Technical-integration research | ✅ Done — see `docs/research/SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md` |
| Recommended product direction | ✅ Done — ratified in `docs/decisions/ADR-0002-data-and-integration-strategy.md` |
| Recommended data strategy | ✅ Done — ratified in `docs/decisions/ADR-0002-data-and-integration-strategy.md` |
| Final scope / spec | ✅ Done — ratified in `docs/specs/SPEC-001-mvp-build.md` |
| Data model (canonical) | ✅ Done — canonical enums + schema in `docs/specs/SPEC-001-mvp-build.md` |
| Application architecture | ✅ Done — ratified in `docs/decisions/ADR-0003-application-architecture.md` |
| App code | ✅ Weather enrichment + E2E complete — 20 domain API endpoints plus health, service layer + FixtureMatcher + WeatherEnricher + computeVerdict(), Zod validators, 4 UI pages, hermetic happy-path E2E (v0.5.0). |
| Packages / frameworks | ✅ Installed — Next.js 15, Prisma 6, Vitest, Playwright, Zod, TypeScript 5 |
| Schema | ✅ 13+ models, 12+ enums — `SubjectItemStatus` enum, `FixtureStatusChange` audit model, and Charterer contact columns added in PACKET-002 migration; no schema changes in PACKET-003 |
| Service layer | ✅ `FixtureStatusPolicy` (subject-gated status machine + audit writes), `RecapFormatter` (deterministic SUPPLYTIME 2017), `FixtureMatcher` (two-stage hard-filter + weighted scoring engine), `computeVerdict()` (pure workability verdict function), and `WeatherEnricher` (Open-Meteo fetch + TTL cache) — all pure TypeScript services in `src/lib/services/` |
| Utilities | ✅ `haversine` (great-circle distance, nautical miles) and `dpClass` (rank, meets-minimum, headroom) in `src/lib/utils/` — both pure, independently tested |
| API surface | ✅ 20 domain API endpoints plus `GET /api/health` — charterers (list, create, detail, requirements, fixtures), vessels (list, detail), fixtures (list, create, detail, status, recap, weather snapshot persist, subjects, subject update), weather proxy (`GET /api/weather/marine`), requirements (list, create, detail, match). Fixture detail now includes `weatherSnapshots`. See `README.md` API Routes table. |
| Validators | ✅ Zod schemas at every route boundary — `src/lib/validators/charterer.ts`, `vessel.ts`, `fixture.ts`, `subject.ts`, `requirement.validators.ts` (incl. sum-to-1.0 weights refine), `weather.validators.ts` (query params, external-response schema, snapshot shape) |
| Shortlist UI | ✅ `/requirements` (list with status badges) and `/requirements/[id]` (shortlist detail with per-factor breakdown) — Next.js 15 server components |
| CI | ✅ 4-job GitHub Actions pipeline (lint-typecheck, test-coverage, build-bundle, e2e); Node 20 pinned |

---

## 4. Likely app direction (recommended, not final)

From the research, the recommended direction is:

- **Product:** Offshore Fixture Board + Recap Generator + Weather Window.
- **Core flow:** client needs a vessel → app matches vessels → broker creates a fixture → app generates the recap → app checks marine weather for the work window.
- **Data strategy:** **seeded commercial data** (vessels, owners, charterers, requirements, fixtures, recaps) **+ exactly one real API — Open-Meteo Marine** (free, no key, no signup) for the weather window.
- **AIS / live vessel tracking:** **optional stretch only** (AISStream.io on day 4 if ahead) — not core.
- **Likely stack:** Next.js + React + TypeScript · Node REST API (route handlers + service layer) · PostgreSQL + Prisma (Neon, optionally PostGIS) · Leaflet + OpenStreetMap · Docker · GitHub Actions CI/CD · optional Python (FastAPI) for seed/import or matching.

**Why this direction:** it maps to SSY's public product language, sits in a real competitive problem-space (Sea/, Veson, Signal Ocean, Ocean Recap), and shows OOP, algorithms, REST design, relational modelling, real-API integration, and CI/CD — without the demo-day risk of enterprise live feeds.

Full reasoning and a worked end-to-end pipeline example: `docs/research/SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md`.

---

## 5. Current recommended direction from research (summary)

- ✅ **Seeded data + one real API.**
- ✅ **Open-Meteo Marine** as the safest real integration (no key, no signup, North Sea coverage, returns workability variables).
- ✅ **Avoid enterprise AIS APIs** (MarineTraffic, Spire, Kpler) for the MVP — sales-led, costly, demo-risky.
- ✅ **Be explicit about seeded vs live** in the UI and README — honest scoping over a fragile "everything is live" claim.

---

## 6. Resolved decisions (2026-06-11)

The ten formerly-open items are now **resolved**, ratified in a grilling session by Manu Murillo. Each maps to the doc that records it (these decisions **override** any conflicting recommendation in `docs/research/`):

1. **Final product scope** → MVP must-haves / nice-to-haves / stretch tiering locked — `docs/specs/SPEC-001-mvp-build.md`.
2. **Canonical status model** → Fixture `DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED` (+ `FAILED`); Requirement `ENQUIRY → SHORTLISTED → NEGOTIATING → ON_SUBS → FIXED` (+ `LOST`); `FIXED` = "clean fixed" (no separate value); `ENQUIRY` lives on the Requirement — `docs/specs/SPEC-001-mvp-build.md` (D3–D4).
3. **Architecture** → Next.js full-stack (App Router + Route Handlers, **Node** runtime) + Prisma + service layer (FixtureMatcher, RecapFormatter, WeatherEnricher, FixtureStatusPolicy); single Vercel deploy — `docs/decisions/ADR-0003-application-architecture.md`.
4. **Recap generator scope** → deterministic RecapFormatter over the SUPPLYTIME 2017 field set, **both** Markdown + plain text, copy + download, `Recap.version` in schema (v1 ships), no runtime LLM — `docs/specs/SPEC-001-mvp-build.md`.
5. **Matching algorithm** → **CORE**, not stretch: FixtureMatcher pure service, hard filters + weighted 0–100 score, heavily unit-tested — `docs/specs/SPEC-001-mvp-build.md`.
6. **PostGIS** → **out of core**; post-MVP **stretch** only, with a written scaling rationale (Haversine in the service layer for the core) — `docs/specs/SPEC-001-mvp-build.md`.
7. **AISStream.io** → **deferred to post-MVP** (README "future work" line, not a core packet dependency) — `docs/decisions/ADR-0002-data-and-integration-strategy.md`.
8. **Python service** → **excluded** from the MVP (TypeScript-only); noted as a future polyglot option — `docs/specs/SPEC-001-mvp-build.md`.
9. **SQL Server** → **Postgres-only** for the demo; README acknowledges SSY's enterprise .NET/SQL Server stack vs the offshore platform's Postgres — `docs/specs/SPEC-001-mvp-build.md`.
10. **Aggregation endpoints + weather persistence** → dashboard (if built) = live `GET /api/dashboard` aggregation; persist a decision-time `WeatherSnapshot` linked to the fixture (+ short-TTL cache for ad-hoc lookups) to keep CI/e2e hermetic — `docs/decisions/ADR-0002-data-and-integration-strategy.md` and `docs/specs/SPEC-001-mvp-build.md`.

---

## 8. PACKET-002 implementation notes (2026-06-12)

These decisions were made during the Core Vertical Slice build and are recorded here as addenda to the ratified spec:

- **`FixtureStatusChange` audit model** — every status transition writes an immutable audit row (actor, fromStatus, toStatus, indexed on `fixtureId`, cascade-deletes with the fixture). Not part of the original SPEC-001 schema; added as a non-breaking schema addition.
- **Subject-gated `ON_SUBS → FIXED`** — enforced in `FixtureStatusPolicy`. Attempts without subjects, or with unresolved subjects, return HTTP 400 with an outstanding-subject count. This is the primary domain rule exercised by the API surface.
- **`fixedAt` on Fixture only** — when a fixture transitions to `FIXED`, `Fixture.fixedAt` is stamped. The linked Requirement moves to `status: FIXED` but has no `fixedAt` column.
- **Charterer contact columns** — `contactName`, `contactEmail`, `contactPhone` added as optional nullable columns via a non-destructive migration. Existing seed rows receive values; no data was lost.
- **Node 20 pinned** — `package.json` `engines: ">=20.0.0"` and `.nvmrc 20.20.2` resolve the Vitest/Vite ESM startup incompatibility with Node 18.

---

## 9. PACKET-003 implementation notes (2026-06-12)

These decisions were made during the Requirement Matching build and are recorded here as addenda to the ratified spec:

- **`FixtureMatcher` pure service** — two-stage engine (hard filters → weighted composite). Takes plain objects, returns plain objects; no database calls inside the matcher. All I/O (fetch vessels, fetch benchmark, persist status transition) happens in the route handler. Follows the same pure-service pattern as `FixtureStatusPolicy` and `RecapFormatter`.

- **Haversine utility** (`src/lib/utils/haversine.ts`) — great-circle distance in nautical miles. PostGIS remains deferred to post-MVP (SPEC-001, ADR-0002); at 30-vessel scale, Haversine in-process is correct, fast, and independently testable.

- **DP class utility** (`src/lib/utils/dp-class.ts`) — rank ordering (`NONE < DP1 < DP2 < DP3`), meets-minimum check, and headroom helpers used by the hard-filter and capability-margin scoring stages.

- **rateFit limitation** — `rateFit` compares the requirement's `dayRateBudget` against the regional rate benchmark for the vessel type (`RateBenchmark` table). Because the schema has no per-vessel day-rate column, every candidate from the same `(vesselType, region)` cohort receives an identical `rateFit` score. This is a documented limitation; per-vessel rate data would require a schema extension (post-MVP).

- **Neutral 0.5 for absent budget/benchmark** — when `dayRateBudget` is null or no benchmark row exists, `rateFit` defaults to 0.5. Missing data never inflates or deflates the composite score.

- **`ENQUIRY → SHORTLISTED` on first match** — the status transition fires only when `requirement.status === 'ENQUIRY'`. Subsequent match calls on any later status run scoring and return results without touching status. `MatchResponse.status` is the actual post-operation `RequirementStatus` — never hard-coded.

- **Tunable weights, Zod-validated** — `POST /api/requirements/[id]/match` accepts an optional `weights` body (`{ distance, rateFit, capabilityMargin }`). The validator uses `.refine()` to ensure the three values sum to 1.0 (± floating-point tolerance); invalid requests return HTTP 400 `"Weights must sum to 1.0"`. Default: distance 0.40 / rateFit 0.35 / capabilityMargin 0.25.

- **`ShortlistView` extracted** — the shortlist detail page (`/requirements/[id]`) extracted its render logic into `ShortlistView.tsx` (a presentational server component) to keep both files under the 150-line average target.

- **No Prisma migration** — `Requirement`, `Region`, and `RateBenchmark` existed in the PACKET-002 schema. PACKET-003 required no schema changes.

---

## 10. PACKET-004 implementation notes (2026-06-12)

These decisions were made during the Weather Enrichment + E2E build and are recorded here as addenda to the ratified spec:

- **`computeVerdict()` pure function** (`src/lib/services/weather-verdict.ts`) — takes raw `waveHeightM`, `swellWaveHeightM`, and `windWaveHeightM` values and returns a `WorkabilityVerdict` (`WORKABLE` / `MARGINAL` / `NOT_WORKABLE`). No I/O, no state, no framework imports. Applies North Sea thresholds.

- **`WeatherEnricher` I/O service** (`src/lib/services/weather-enricher.ts`) — wraps the Open-Meteo Marine API call. Uses the `current` conditions block (not `hourly[0]`, which is midnight, not the present time). Applies a 5-minute in-memory TTL cache keyed by coordinate. Calls `computeVerdict()` and returns a structured `WeatherSnapshot`-shaped object. No database writes — the enricher is a pure network + cache layer.

- **Route persistence, not service persistence** — the `POST /api/fixtures/:id/weather` route handler is the only layer that writes a `WeatherSnapshot` to the database. Keeping persistence in the route (not the service) follows the same separation-of-concerns pattern used by `FixtureStatusPolicy` and `FixtureMatcher`.

- **`fixtureId: null` for ad-hoc lookups** — the `GET /api/weather/marine` proxy route always returns `fixtureId: null` in its response. `fixtureId` is only non-null in snapshots returned by `POST /api/fixtures/:id/weather` (persisted, fixture-linked).

- **`weatherSnapshots` on fixture detail** — `GET /api/fixtures/:id` now includes a `weatherSnapshots` array in its response (additive, non-breaking). This is how the E2E hermetically verifies weather evidence without live API calls.

- **Hermetic E2E** (`e2e/happy-path.spec.ts`) — weather is verified through 2 seeded `WeatherSnapshot` rows attached to fixture2 and fixture3 in `prisma/seed.ts`. The E2E exercises the full broker workflow: requirement creation → matching → fixture creation → weather snapshot count check → subject creation + LIFTED → `ON_SUBS → FIXED` (subject-lift gate honored) → recap generation. Zero live Open-Meteo calls in the automated suite.

- **Subject-lift gate in the E2E** — the happy-path spec creates a SubjectItem on the NEGOTIATING fixture and sets its status to `LIFTED` before attempting the `ON_SUBS → FIXED` transition. This proves the gate works end-to-end, not just in unit tests.

- **Rate limiting deferred** — Open-Meteo's public API has undocumented rate limits. Rate limiting on the proxy route is tracked as a future concern in `docs/roadmap/ROADMAP.md`, not as an in-code TODO.

- **`requiredCoordParam` schema correction** — the initial `weather.validators.ts` draft used a numeric refinement that required an explicit `coerce` step; the final implementation uses `z.coerce.number()` directly in the query schema to handle URL query-string values (which are always strings) cleanly.

- **`response.ok` handling** — the `WeatherEnricher` checks `response.ok` before parsing the body and throws a structured error on non-2xx. This prevents Zod from receiving an error body from Open-Meteo and producing a misleading validation error.

- **No migration** — `WeatherSnapshot` (with nullable `fixtureId`) existed in the PACKET-002 schema. PACKET-004 required no schema changes.

---

## 7. Methodology

FixtureLog follows the same **research-first, packet-based methodology** used in the learning-speaking-app project:
- packet-based planning with task files **before** implementation,
- explicit architecture decisions (ADRs in `docs/decisions/`),
- source-of-truth research docs (`docs/research/`),
- journal entries (`docs/journal/`) and PR docs (`docs/pull-requests/`),
- semantic versioning, strict TypeScript standards, Zod validation at API boundaries,
- tests before work is considered complete, and living docs kept in sync.

See `docs/decisions/ADR-0001-research-first-methodology.md`.
