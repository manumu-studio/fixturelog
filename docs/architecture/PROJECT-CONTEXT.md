# FixtureLog — Project Context

> **Status: DAY 1 SPINE FOUNDATION COMPLETE (2026-06-11, v0.2.0).** Project skeleton, data model (13 models, 12 enums), idempotent seed, CI pipeline, and test infrastructure are in place. Service layer (FixtureMatcher, RecapFormatter, WeatherEnricher, FixtureStatusPolicy) and UI are Day 2+.
>
> **Build source-of-truth:** `docs/specs/SPEC-001-mvp-build.md`.

---

## 1. What FixtureLog is

FixtureLog is a **portfolio demo project**: a small but realistic **offshore shipbroking workflow application**. The likely shape is an **Offshore Fixture Board + Recap Generator with a marine "weather window" check** — a tool that lets a broker capture a client requirement, match available offshore vessels, record the fixture (the agreed deal), generate a recap (the deal summary), and check whether marine weather supports the work window.

In one sentence: *FixtureLog models the shortest credible path from an offshore enquiry to a fixed deal and its recap, with one real external data source where it genuinely helps.*

---

## 2. Why it exists — the SSY interview context

FixtureLog is built as a **portfolio demonstration for a Full-Stack Developer role at SSY (Simpson Spence Young)**, the world's largest independent shipbroker. The role:
- focuses on building and evolving an **Offshore Broking platform**,
- uses **React, TypeScript, Node.js, PostgreSQL** (the role also mentions SQL Server),
- is a **hybrid London** position,
- explicitly emphasises **"AI-first thinking"** and responsible use of tools such as **Claude** and **Cursor**,
- and expects close collaboration with brokers to turn real workflows into software.

The goal of FixtureLog is to show **domain understanding + engineering fundamentals + disciplined product judgment** — not to clone an enterprise platform. The strongest signal driving the project: **SSY's own public offshore site exposes a dashboard of Fixtures, Requirements, Positions, and a Live Weather Map** — so FixtureLog deliberately mirrors that vocabulary rather than inventing a generic dashboard.

### Interview status (confirmed)

- **1st-stage interview: Monday 15 June 2026, 1:30–2:00 PM (30 min), MS Teams.**
- **Interviewer: Joe Alexander — Head of Offshore Development Technology** (the offshore tech lead, not HR).
- **Implication for FixtureLog:** the first stage is conversational (fit + background + AI workflow + domain) — a full build is **not** required by 15 June. The **research and blueprint** are the 1st-stage assets; the **build** is 2nd-stage / portfolio material.
- **Key org insight (CONFIRMED):** SSY's *core* enterprise stack is **.NET/Blazor/SQL Server/Azure**, but the offshore role's stack is **React/TS/Node/PostgreSQL** — the offshore platform is likely a newer, more modern, possibly standalone build (modernised from the inherited Westshore/F3 estate). This explains the SQL Server mention in the role.

Full interview prep: `docs/research/SSY-INTERVIEW-PREP-JOE-ALEXANDER.md`.

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
| App code | ✅ Spine foundation — app shell, health endpoint, seed (v0.2.0). Services TBD (Day 2+). |
| Packages / frameworks | ✅ Installed — Next.js 15, Prisma 6, Vitest, Playwright, Zod, TypeScript 5 |
| Schema | ✅ 13 models, 12 enums — initial migration applied |
| CI | ✅ 4-job GitHub Actions pipeline (lint-typecheck, test-coverage, build-bundle, e2e) |

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
6. **PostGIS** → **out of core**; day-5 **stretch** only, with a written scaling rationale (Haversine in the service layer for the core) — `docs/specs/SPEC-001-mvp-build.md`.
7. **AISStream.io** → **deferred to post-MVP** (README "future work" line, not a day-4 stretch) — `docs/decisions/ADR-0002-data-and-integration-strategy.md`.
8. **Python service** → **excluded** from the MVP (TypeScript-only); noted as a future polyglot option — `docs/specs/SPEC-001-mvp-build.md`.
9. **SQL Server** → **Postgres-only** for the demo; README acknowledges SSY's enterprise .NET/SQL Server stack vs the offshore platform's Postgres — `docs/specs/SPEC-001-mvp-build.md`.
10. **Aggregation endpoints + weather persistence** → dashboard (if built) = live `GET /api/dashboard` aggregation; persist a decision-time `WeatherSnapshot` linked to the fixture (+ short-TTL cache for ad-hoc lookups) to keep CI/e2e hermetic — `docs/decisions/ADR-0002-data-and-integration-strategy.md` and `docs/specs/SPEC-001-mvp-build.md`.

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
