# FixtureLog

> An offshore charter enquiry lands — which vessel, at what rate, in what weather window?

Capture a client requirement, match available offshore vessels, record the fixture, generate the recap, check the marine weather window, and see where vessels are on a live map — the shortest credible path from an offshore enquiry to a fixed deal.

<p align="center">
  <a href="#"><strong>Live Demo</strong></a> · <a href="docs/specs/SPEC-001-mvp-build.md"><strong>Build Spec</strong></a> · <a href="docs/GLOSSARY.md"><strong>Glossary</strong></a> · <a href="https://github.com/manumu-studio/fixturelog"><strong>Source Code</strong></a>
</p>

<p align="center"><em>v1.2.0 — MVP + public landing + auth integration. Operational routes require sign-in via the shared ManuMuStudio OIDC provider; the landing stays public.</em></p>

---

<p align="center">
  <img src="public/assets/landing/landing-desktop-1440.png" alt="FixtureLog — animated maritime landing page" width="800" />
</p>

---

## What it does

FixtureLog is a portfolio demo of a realistic **offshore shipbroking workflow** — an Offshore Fixture Board + Recap Generator with a marine weather check and a regional vessel map, built as a demonstration for an SSY (Simpson Spence Young) Full-Stack Developer role.

A broker captures a charterer's **requirement**, runs a pure two-stage **matching engine** (hard filters → weighted composite score) to produce a ranked vessel shortlist with a per-factor breakdown, records the **fixture** (the agreed deal) through a subject-gated status machine, generates a deterministic **SUPPLYTIME 2017 recap** in Markdown and plain text, checks whether marine weather supports the work window via an **Open-Meteo** verdict (`WORKABLE` / `MARGINAL` / `NOT_WORKABLE`), and visualises seeded vessel positions on a **Leaflet** map. No runtime LLM — the backend is the source of truth. Scope, status enums, and data model are locked in [SPEC-001](docs/specs/SPEC-001-mvp-build.md); domain vocabulary lives in the [glossary](docs/GLOSSARY.md).

## Pages

Five server-rendered surfaces cover the enquiry-to-fixture path. The landing is public; the operational pages (🔒) live in an authenticated route group and redirect anonymous visitors to `/`.

| Route | What it shows |
|---|---|
| `/` | Public maritime landing — marine-chart hero canvas, feature showcase, real sign-in / create-account / go-to-workspace CTAs |
| `/map` 🔒 | Regional vessel map — color-coded Leaflet markers from seeded position snapshots |
| `/requirements` · `/requirements/[id]` 🔒 | Requirement list with status badges, and shortlist detail with per-factor score breakdown |
| `/charterers` · `/charterers/[id]` 🔒 | Charterer list and detail with linked requirements and fixtures |

<p align="center">
  <img src="public/assets/landing/landing-mobile-390.png" alt="FixtureLog — responsive landing on mobile" width="280" />
</p>

## Architecture

```
┌──────────────────────────────────────┐
│        Next.js 15 · App Router        │   Vercel
│   React 19 · Leaflet · motion · Zod   │
└────────────────────┬─────────────────┘
                     │  Route Handlers (Node runtime)
┌────────────────────▼─────────────────┐
│         Service layer (pure TS)       │
│   Matcher · Recap · Weather · Status  │
└────────────────────┬─────────────────┘
                     │  Prisma 6
┌────────────────────▼─────────────────┐
│            PostgreSQL 16              │   Neon
│   Vessels · Fixtures · Snapshots      │
└──────────────────────────────────────┘
```

## API

21 domain endpoints (all session-protected) plus a public health check and the public Auth.js endpoints (`/api/auth/*`). Every external payload crosses a Zod boundary, and protected handlers return 401 JSON when unauthenticated. Write routes resolve the acting broker from the session — never from the request body — so a caller cannot impersonate another broker.

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check (public) |
| GET · POST | `/api/charterers` | List charterers · register a charterer |
| GET | `/api/charterers/[id]` `/requirements` `/fixtures` | Charterer detail + linked requirements and fixtures |
| GET | `/api/vessels` · `/api/vessels/[id]` | List vessels (filterable) · vessel detail |
| GET | `/api/vessels/positions` | Latest position snapshot per vessel (map data) |
| GET · POST | `/api/fixtures` | List · create a fixture |
| GET | `/api/fixtures/[id]` | Fixture detail (includes `weatherSnapshots`) |
| PATCH | `/api/fixtures/[id]/status` | Transition fixture status (subject-gated) |
| POST | `/api/fixtures/[id]/recap` | Generate a SUPPLYTIME 2017 recap |
| POST · PATCH | `/api/fixtures/[id]/subjects` | Add a subject · update subject status |
| GET · POST | `/api/weather/marine` · `/api/fixtures/[id]/weather` | Ad-hoc marine verdict · persist a `WeatherSnapshot` |
| GET · POST | `/api/requirements` | List (filterable) · create (`status: ENQUIRY`) |
| GET | `/api/requirements/[id]` | Requirement detail |
| POST | `/api/requirements/[id]/match` | Run matching engine → ranked shortlist; `ENQUIRY → SHORTLISTED` |

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript (strict), motion, Zod |
| **Auth** | Auth.js (NextAuth v5 beta) — shared ManuMuStudio OIDC provider, JWT sessions, layout + handler gating, `AppUser`→`Broker` actor mapping |
| **Mapping** | Leaflet 1.9.4 + react-leaflet 5, OpenStreetMap tiles |
| **Services** | Pure-TS service layer — matching, recap, weather enrichment, status policy |
| **ORM / Data** | Prisma 6, seeded Postgres, Open-Meteo Marine API (AIS deferred) |
| **Database** | PostgreSQL 16 (Neon) |
| **Infra** | Vercel (app), Neon (db), GitHub Actions CI/CD (4-job pipeline) |
| **Quality** | Vitest + v8 coverage, Playwright E2E, ESLint, `tsc` strict, Husky pre-commit |

## Quick start

```bash
# Prerequisites: Node.js 20+, a PostgreSQL 16 database (Neon or local)
npm install                          # runs `prisma generate` via postinstall
cp .env.example .env                 # set DATABASE_URL, NEXT_PUBLIC_APP_URL, and the AUTH_* / NEXTAUTH_* vars
npx prisma migrate dev               # applies all migrations (incl. auth_integration)
npx prisma db seed                   # vessels, owners, charterers, fixtures, requirements, positions
npm run dev                          # http://localhost:3000

# Verify
npm run typecheck && npm run lint
npm run test                         # 279 unit tests across 35 files
npm run test:e2e                     # Playwright: smoke · happy-path · map · landing
```

## Project structure

```
src/
  middleware.ts         # baseline security headers (edge-safe; excludes /api/auth/*)
  app/
    page.tsx            # public animated landing (real auth CTAs)
    (app)/              # authenticated route group — redirects anonymous visitors to /
      map/ · requirements/ · charterers/
    auth/error/         # auth error page
    api/
      auth/             # Auth.js handlers + federated sign-out (public)
      …                 # 21 domain route handlers (session-gated) + /health (public)
  components/
    landing/            # landing sections — each a 4-file component (incl. AuthCta)
  features/
    map/                # RegionalMap · RegionalMapClient · VesselMarker · useRegionalMap
    auth/               # NextAuth config · sign-in/up server actions · useSession · types
  lib/
    auth/               # requireSession · requireApiSession · resolveActor (broker mapping)
    services/           # FixtureMatcher · RecapFormatter · WeatherEnricher · FixtureStatusPolicy
    utils/              # haversine (nm) · dp-class ranking
    validators/         # Zod schemas at every boundary
    env.ts · env.server.ts   # split public / server env validation (secrets stay server-only)
prisma/
  schema.prisma         # domain model + status enums + AppUser↔Broker mapping
  seed.ts               # 30 seeded vessels + full workflow data
e2e/                    # Playwright: smoke · happy-path · map · landing
docs/                   # specs · ADRs · research · journal · PRs · glossary
```

## Architecture decisions

Key decisions are recorded as ADRs in [`docs/decisions/`](docs/decisions/):

- **Honesty rule for data** — seeded Postgres + live Open-Meteo weather; AIS deferred; every datum tagged by source and confidence ([ADR-0002](docs/decisions/ADR-0002-data-and-integration-strategy.md))
- **Next.js full-stack + pure service layer** — Vercel + Neon, CI/CD parity with the reference pipeline ([ADR-0003](docs/decisions/ADR-0003-application-architecture.md))
- **Research-first, packet-based methodology** — task files before implementation; ship small, ship often ([ADR-0001](docs/decisions/ADR-0001-research-first-methodology.md))
- **Locked MVP contract** — scope tiers, status enums, data model, and build sequence in [SPEC-001](docs/specs/SPEC-001-mvp-build.md)

Project context and decision history: [`docs/architecture/PROJECT-CONTEXT.md`](docs/architecture/PROJECT-CONTEXT.md).

## Roadmap

- **Done (v1.2.0)** — PACKET-008 auth integration (shared OIDC sign-in, protected route group + API gating, `AppUser`→`Broker` actor mapping, security-headers middleware)
- **Next** — PACKET-009 Client Portal (charterer login, dashboard, Fleet Explorer, create-enquiry)
- **After** — AI Broker Copilot runtime (NL intake, typed backend tools, human-confirmed writes), then AI evals + observability — specced in [SPEC-002](docs/specs/SPEC-002-ai-broker-copilot.md), not built today

## Built by

[ManuMu Studio](https://manumustudio.com). The landing's motion pattern is ported from the author's [Helical Bio Explorer](https://github.com/manumu-studio/helical-bio-explorer); the maritime editorial skin (Fraunces type, deep-navy `#000061` / cyan `#00e2fd`) is informed by a public SSY homepage CSS audit. No SSY brand assets, logos, or trademarks were copied.

## License

Independent portfolio demonstration — **not affiliated with or endorsed by SSY (Simpson Spence Young)**. Company facts cited in the research docs are drawn from public sources and tagged for confidence.
