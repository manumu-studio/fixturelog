# ADR-0003: Application Architecture

- **Status:** Accepted
- **Date:** 2026-06-11
- **Deciders:** Manu Murillo
- **Context tags:** architecture, stack, deployment

---

## Context

FixtureLog needs an application architecture before any code is written. The methodology (`docs/decisions/ADR-0001-research-first-methodology.md`) and data strategy (`docs/decisions/ADR-0002-data-and-integration-strategy.md`) are now ratified; this ADR settles the shape of the runtime, the deploy unit, and the CI/CD model.

The technical-decision research in `docs/research/` recommended a full-stack framework over a split frontend/backend, but the recommendation was not binding. Two constraints sharpen the choice. First, the `learning-speaking-app` project already runs a proven Next.js 15 + Prisma + Postgres pipeline; mirroring its shape makes its `ci.yml`, `playwright.config`, and `vitest.config` reusable rather than rebuilt. Second, the SSY Full-Stack Developer role lists React / TypeScript / Node / PostgreSQL, so the stack should read as that stack without ceremony. This decision is scoped to architecture only; scope tiering lives in `docs/specs/SPEC-001-mvp-build.md`, and data/integration choices live in ADR-0002.

---

## Decision

1. **Next.js full-stack, single codebase.** App Router for UI; Route Handlers for the API. No separate backend project.
2. **Node runtime, not edge.** Route Handlers run in the Node runtime so Prisma, the service layer, and the Open-Meteo fetch behave predictably without edge constraints.
3. **Prisma as the data access layer** against Postgres, consistent with ADR-0002.
4. **An explicit service layer** holds the domain logic as pure, testable services: `FixtureMatcher` (matching and scoring), `RecapFormatter` (deterministic SUPPLYTIME recap output), `WeatherEnricher` (Open-Meteo Marine enrichment and workability verdict), and `FixtureStatusPolicy` (status-transition rules). Route Handlers stay thin and delegate to these services.
5. **Distance math lives in the service layer.** The core uses a pure Haversine great-circle function (unit-tested, sufficient for ~20–40 vessels). PostGIS "vessels within N nm" is a documented stretch, not a core dependency; keeping distance in the service layer avoids coupling the architecture to a spatial extension.
6. **One deploy unit on Vercel; Neon Postgres.** A single Vercel project serves UI and API. Neon is the Postgres provider (Vercel-native, free serverless tier, PostGIS-capable for the stretch).
7. **CI/CD mirrors `learning-speaking-app` 1:1** as a direct consequence of the monolith choice: four parallel jobs (lint-typecheck, test-coverage, build-bundle, e2e) plus Vercel per-PR preview deploys. The single-codebase shape is what lets the reference pipeline be copied rather than re-authored; full job detail is specified in SPEC-001 and the project roadmap (`docs/roadmap/ROADMAP.md`).

### Rejected option

**Separate Node/Express API + React SPA (two deploy units).** Rejected because it doubles the CI/CD surface (two pipelines, two build/bundle steps), introduces CORS and cross-service environment management, and diverges from the `learning-speaking-app` reference pipeline, forfeiting the near-free CI/CD parity that is the primary reason for the monolith. It buys stronger physical separation that this project does not yet need; the service layer (decision 4) already provides the logical separation, so the cost is not justified for the MVP.

---

## Consequences

**Positive:**
- The monolith shape is what makes mirroring `learning-speaking-app`'s CI/CD near-free: same Next.js 15 + Prisma + Postgres stack means `ci.yml`, `playwright.config`, and `vitest.config` are copied, not re-authored.
- Matches the JD stack (React / TypeScript / Node / PostgreSQL) with one deploy and minimal ops.
- The service layer keeps the codebase reading like a real API project and keeps `FixtureMatcher`, `RecapFormatter`, `WeatherEnricher`, and `FixtureStatusPolicy` extractable into a standalone service later without rewriting the domain logic.
- Pure, dependency-light services (Haversine distance included) are straightforward to unit-test, which matters most for the matching centerpiece.

**Negative / costs:**
- A single deploy unit couples UI and API release cadence; they ship together.
- Node-runtime Route Handlers forgo edge-latency benefits (an acceptable trade for Prisma and service determinism).
- The extractability of the service layer is only preserved if discipline holds: Route Handlers must stay thin and must not absorb domain logic.

**Follow-ups:**
- SPEC-001 (`docs/specs/SPEC-001-mvp-build.md`) sequences the vertical slice and the four CI jobs against this architecture.
- The standalone-service extraction (and the optional Python FastAPI polyglot service) remains post-MVP future work, noted in the README.
- PostGIS adoption is gated on the day-5 distance stretch; if taken, document the GiST-indexed `ST_DWithin` scaling rationale.
