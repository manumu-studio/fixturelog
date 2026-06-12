# FixtureLog — Project Context

> **Status: PACKET-002 CORE VERTICAL SLICE COMPLETE (2026-06-12, v0.3.0).** 14 API routes, pure service layer (`FixtureStatusPolicy`, `RecapFormatter`), Zod validation at every boundary, subject-lift → FIXED workflow with full audit trail, and two server-component UI pages are in place. PACKET-003 (matching) is next.
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
| App code | ✅ Core vertical slice — 14 API routes, service layer, Zod validators, 2 UI pages (v0.3.0). FixtureMatcher and weather integration belong to PACKET-003. |
| Packages / frameworks | ✅ Installed — Next.js 15, Prisma 6, Vitest, Playwright, Zod, TypeScript 5 |
| Schema | ✅ 13+ models, 12+ enums — `SubjectItemStatus` enum, `FixtureStatusChange` audit model, and Charterer contact columns added in PACKET-002 migration |
| Service layer | ✅ `FixtureStatusPolicy` (subject-gated status machine + audit writes) and `RecapFormatter` (deterministic SUPPLYTIME 2017) implemented as pure TypeScript services in `src/lib/services/` |
| API surface | ✅ 14 dynamic routes — charterers (list, create, detail, requirements, fixtures), vessels (list, detail), fixtures (list, create, detail, status, recap, subjects, subject update). See `README.md` API Routes table. |
| Validators | ✅ Zod schemas at every route boundary — `src/lib/validators/charterer.ts`, `vessel.ts`, `fixture.ts`, `subject.ts` |
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

## 7. Methodology

FixtureLog follows the same **research-first, packet-based methodology** used in the learning-speaking-app project:
- packet-based planning with task files **before** implementation,
- explicit architecture decisions (ADRs in `docs/decisions/`),
- source-of-truth research docs (`docs/research/`),
- journal entries (`docs/journal/`) and PR docs (`docs/pull-requests/`),
- semantic versioning, strict TypeScript standards, Zod validation at API boundaries,
- tests before work is considered complete, and living docs kept in sync.

See `docs/decisions/ADR-0001-research-first-methodology.md`.
