# FixtureLog

> **Status: v1.1.0 — MVP complete + polished public landing.** Animated maritime landing page, regional Leaflet map, vessel-positions endpoint, Vercel + Neon deploy, 21 domain API endpoints plus the health endpoint, a pure matching engine, a weather enrichment layer, Zod validation at every boundary, five server-component UI pages, and a hermetic full-workflow E2E are in place. No account required — all routes are public. Auth integration is planned as PACKET-008.

FixtureLog is a portfolio demo project: a small, realistic **offshore shipbroking workflow application**, built as a demonstration for an SSY (Simpson Spence Young) Full-Stack Developer role. It is an **Offshore Fixture Board + Recap Generator with a marine "weather window" check and a regional vessel map** — letting a broker capture a client requirement, match available offshore vessels, record the fixture (the agreed deal), generate the recap (the deal summary), check whether marine weather supports the work window, and visualise where vessels are on a live Leaflet map. The scope, architecture, and data model are locked in [SPEC-001](docs/specs/SPEC-001-mvp-build.md).

For offshore shipbroking terminology used throughout the app, see [docs/GLOSSARY.md](docs/GLOSSARY.md).

**Live demo:** _deploy-ready — URL added after first Vercel deploy_

---

## Architecture

```
Browser
  └── Next.js 15 (App Router, server + client components)
        ├── /map  ──►  RegionalMapClient (client)
        │               ├── useRegionalMap (hook)
        │               └── RegionalMap / VesselMarker (Leaflet, ssr:false)
        ├── /charterers, /requirements, ...  ──►  Server components
        └── API Routes (Route Handlers, Node runtime)
              ├── /api/vessels/positions  ──►  PositionSnapshot (Prisma)
              ├── /api/requirements/[id]/match  ──►  FixtureMatcher (service)
              ├── /api/fixtures/[id]/recap  ──►  RecapFormatter (service)
              ├── /api/fixtures/[id]/weather  ──►  WeatherEnricher (service)
              └── ... (19 more endpoints)
                    └── Prisma 6  ──►  PostgreSQL 16 (Neon)
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Database | PostgreSQL 16 (Neon) |
| ORM | Prisma 6 |
| Map | Leaflet ^1.9.4 + react-leaflet ^5 + OpenStreetMap tiles |
| Animation | motion@^12 (landing page entrance/scroll animations) |
| Validation | Zod |
| Unit tests | Vitest + v8 coverage |
| E2E tests | Playwright |
| CI | GitHub Actions (4-job pipeline) |
| Deploy | Vercel + Neon |

---

## Getting started

### Prerequisites
- Node.js 20+
- Neon Postgres database (or any PostgreSQL 16+)

### Setup
1. Clone the repo
2. `npm install` (runs `prisma generate` via `postinstall`)
3. `cp .env.example .env` — edit with your `DATABASE_URL` and `NEXT_PUBLIC_APP_URL`
4. `npx prisma migrate dev --name init`
5. `npx prisma db seed`
6. `npm run dev` — visit http://localhost:3000

---

## Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript strict check |
| `npm run test` | Run unit tests (264 unit tests across 31 files) |
| `npm run test:coverage` | Unit tests + coverage report |
| `npm run test:e2e` | Playwright E2E tests (4 specs) |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `postinstall` | `prisma generate` (runs automatically after `npm install`) |

---

## Project structure

```
fixturelog/
├── .github/workflows/ci.yml
├── .nvmrc
├── .env.example                                      # incl. NEXT_PUBLIC_APP_URL
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.ts
├── playwright.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── assets/
│       └── landing/
│           ├── landing-desktop-1440.png              # Landing screenshot (desktop)
│           └── landing-mobile-390.png                # Landing screenshot (mobile)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                                  # Public landing page (animated)
│   │   ├── globals.css                               # Design tokens (palette, motion, typography)
│   │   ├── map/
│   │   │   └── page.tsx                              # /map server component + metadata
│   │   ├── charterers/
│   │   │   ├── page.tsx                              # Charterer list
│   │   │   └── [id]/page.tsx                         # Charterer detail
│   │   ├── requirements/
│   │   │   ├── page.tsx                              # Requirement list
│   │   │   └── [id]/
│   │   │       ├── page.tsx                          # Shortlist detail
│   │   │       └── ShortlistView.tsx                 # Per-factor breakdown component
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── charterers/
│   │       │   ├── route.ts                          # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts                      # GET detail
│   │       │       ├── requirements/route.ts         # GET requirements
│   │       │       └── fixtures/route.ts             # GET fixtures
│   │       ├── vessels/
│   │       │   ├── route.ts                          # GET list
│   │       │   ├── [id]/route.ts                     # GET detail
│   │       │   └── positions/route.ts                # GET latest position per vessel
│   │       ├── fixtures/
│   │       │   ├── route.ts                          # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts                      # GET detail (incl. weatherSnapshots)
│   │       │       ├── status/route.ts               # PATCH status
│   │       │       ├── recap/route.ts                # POST generate recap
│   │       │       ├── weather/route.ts              # POST persist WeatherSnapshot
│   │       │       └── subjects/
│   │       │           ├── route.ts                  # POST add subject
│   │       │           └── [subjectId]/route.ts      # PATCH update subject
│   │       ├── weather/
│   │       │   └── marine/route.ts                   # GET marine weather proxy (Open-Meteo)
│   │       └── requirements/
│   │           ├── route.ts                          # GET list, POST create
│   │           └── [id]/
│   │               ├── route.ts                      # GET detail
│   │               └── match/route.ts                # POST match → ranked shortlist
│   ├── components/
│   │   └── landing/
│   │       ├── LandingNav/                           # Scroll-aware fixed nav (4-file pattern)
│   │       ├── LandingHero/                          # Full-bleed hero with staggered copy entrance
│   │       ├── MarineTrafficCanvas/                  # Procedural marine canvas (vessel tracks, arcs)
│   │       ├── FeatureShowcase/                      # Alternating whileInView feature rows
│   │       ├── HowItWorks/                           # Scroll-drawn 4-step workflow connector
│   │       ├── TechBadges/                           # Staggered technology badges
│   │       ├── CtaFooter/                            # Final CTA band with demo links
│   │       └── LandingFooter/                        # Portfolio disclaimer + navigation footer
│   ├── features/
│   │   └── map/
│   │       ├── api.ts                                # Zod-parsed fetch helper for positions
│   │       ├── hooks/
│   │       │   └── useRegionalMap.ts                 # Data fetching + loading/error state
│   │       ├── RegionalMap/                          # Presentational Leaflet map component
│   │       │   ├── RegionalMap.tsx
│   │       │   ├── RegionalMap.types.ts
│   │       │   └── index.ts
│   │       ├── RegionalMapClient/                    # Client wrapper; owns hook; ssr:false lazy-load
│   │       │   ├── RegionalMapClient.tsx
│   │       │   ├── RegionalMapClient.types.ts
│   │       │   └── index.ts
│   │       └── VesselMarker/                         # CircleMarker + popup; color-coded by type
│   │           ├── VesselMarker.tsx
│   │           ├── VesselMarker.types.ts
│   │           └── index.ts
│   └── lib/
│       ├── prisma.ts
│       ├── health.ts
│       ├── health.test.ts
│       ├── services/
│       │   ├── fixture-status-policy.ts              # FixtureStatusPolicy
│       │   ├── fixture-status-policy.test.ts
│       │   ├── fixture-matcher.ts                    # FixtureMatcher (two-stage engine)
│       │   ├── fixture-matcher.types.ts
│       │   ├── fixture-matcher.test.ts
│       │   ├── recap-formatter.ts                    # RecapFormatter
│       │   ├── recap-formatter.test.ts
│       │   ├── weather-verdict.ts                    # computeVerdict() pure function
│       │   ├── weather-verdict.test.ts
│       │   ├── weather-enricher.ts                   # WeatherEnricher (fetch + TTL cache)
│       │   ├── weather-enricher.types.ts
│       │   └── weather-enricher.test.ts
│       ├── utils/
│       │   ├── haversine.ts                          # Great-circle distance (nautical miles)
│       │   ├── haversine.test.ts
│       │   ├── dp-class.ts                           # DP class rank / meets-minimum / headroom
│       │   └── dp-class.test.ts
│       ├── constants/
│       │   └── landing-copy.ts                       # Single source of truth for all landing page copy
│       └── validators/
│           ├── charterer.ts
│           ├── vessel.ts
│           ├── fixture.ts
│           ├── subject.ts
│           ├── requirement.validators.ts
│           ├── weather.validators.ts
│           └── vessel-position.validators.ts         # VesselPositionItem + positions response
├── e2e/
│   ├── global-setup.ts
│   ├── smoke.spec.ts
│   ├── happy-path.spec.ts
│   ├── map.spec.ts                                   # Hermetic map E2E; OSM tiles aborted
│   └── landing.spec.ts                               # Landing page E2E (3 tests)
└── docs/
    ├── GLOSSARY.md                                   # Offshore shipbroking + app-specific terms
    ├── AI-USAGE.md                                   # AI-assisted development; no runtime AI
    ├── specs/                                       # SPEC-001 MVP + SPEC-002 planned AI copilot
    ├── decisions/ (ADR-0001 – ADR-0003)
    ├── research/ (domain + technical research)
    ├── architecture/PROJECT-CONTEXT.md
    ├── roadmap/ROADMAP.md
    ├── journal/ (ENTRY-001 – ENTRY-007)
    └── pull-requests/ (PR-0.2.0 – PR-1.1.0)
```

---

## API Routes

21 domain API endpoints + 1 health endpoint.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/charterers` | List all charterers |
| POST | `/api/charterers` | Register a charterer |
| GET | `/api/charterers/[id]` | Charterer detail |
| GET | `/api/charterers/[id]/requirements` | Requirements for a charterer |
| GET | `/api/charterers/[id]/fixtures` | Fixtures for a charterer |
| GET | `/api/vessels` | List vessels (filterable) |
| GET | `/api/vessels/[id]` | Vessel detail |
| GET | `/api/vessels/positions` | Latest position snapshot per vessel (for map) |
| GET | `/api/fixtures` | List fixtures |
| POST | `/api/fixtures` | Create a fixture |
| GET | `/api/fixtures/[id]` | Fixture detail (includes `weatherSnapshots`) |
| PATCH | `/api/fixtures/[id]/status` | Transition fixture status |
| POST | `/api/fixtures/[id]/recap` | Generate a SUPPLYTIME 2017 recap |
| POST | `/api/fixtures/[id]/subjects` | Add a subject to a fixture |
| PATCH | `/api/fixtures/[id]/subjects/[subjectId]` | Update subject status |
| GET | `/api/weather/marine` | Open-Meteo marine weather proxy — returns workability verdict + wave/swell/wind-wave data; `fixtureId: null` (ad-hoc) |
| POST | `/api/fixtures/[id]/weather` | Persist a WeatherSnapshot linked to the fixture; returns snapshot with `fixtureId` |
| GET | `/api/requirements` | List requirements (filterable by status) |
| POST | `/api/requirements` | Create a requirement (`status: ENQUIRY`) |
| GET | `/api/requirements/[id]` | Requirement detail |
| POST | `/api/requirements/[id]/match` | Run matching engine; returns ranked shortlist + per-factor breakdown; transitions `ENQUIRY → SHORTLISTED` |

**UI pages** (Next.js 15 server components):

| Route | Description |
|-------|-------------|
| `/` | Public landing page — animated maritime landing with marine-chart hero canvas, feature showcase, and real public route CTAs (no account required) |
| `/map` | Regional vessel map — color-coded Leaflet CircleMarkers from seeded position data |
| `/charterers` | Charterer list |
| `/charterers/[id]` | Charterer detail with linked requirements and fixtures |
| `/requirements` | Requirement list with status badges |
| `/requirements/[id]` | Shortlist detail with per-factor score breakdown |

---

## Services

Business logic lives in pure TypeScript services under `src/lib/services/`:

- **`FixtureStatusPolicy`** — enforces the canonical Fixture status machine (`DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED`). The `ON_SUBS → FIXED` transition is subject-gated: it is only allowed when at least one SubjectItem exists on the fixture and every subject has status `LIFTED` or `WAIVED`. Rejected transitions return HTTP 400 with the count of outstanding subjects. Every successful transition writes a `FixtureStatusChange` audit row; transitioning to `FIXED` also stamps `Fixture.fixedAt`.
- **`RecapFormatter`** — produces a deterministic SUPPLYTIME 2017 recap in Markdown and plain text from the fixture's structured terms. No runtime LLM.
- **`FixtureMatcher`** — pure two-stage matching engine (hard filters → weighted composite score). Haversine distance, rate fit, and capability margin factors; tunable weights validated to sum to 1.0.
- **`WeatherEnricher`** — wraps the Open-Meteo Marine API call with a 5-minute in-memory TTL cache; calls `computeVerdict()` and returns a structured snapshot. No database writes.
- **`computeVerdict()`** — pure function; applies North Sea wave/swell thresholds to return `WORKABLE`, `MARGINAL`, or `NOT_WORKABLE`. No I/O, no state.

---

## Testing

```bash
npm run test          # 264 unit tests across 31 files
npm run test:coverage # coverage report (thresholds 70/60/70/70)
npm run test:e2e      # 4 E2E specs (smoke + happy-path + map + landing)
```

**Unit tests** cover every service, utility, validator, API route handler, and landing page structure. The map render test mocks react-leaflet components inline (the repo uses `environment: node`, not jsdom/@testing-library). **E2E tests** use Playwright; the map spec aborts OSM tile requests so no network calls are made during CI. The landing spec verifies desktop/mobile render, route navigation, and non-blank canvas.

---

## Deployment

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Yes (production) | The deployed origin URL (e.g. `https://fixturelog.vercel.app`) — used by server components to build absolute fetch URLs to API routes |

### Vercel + Neon runbook

1. Create a Neon project; copy the connection string to `DATABASE_URL` in Vercel environment variables.
2. Set `NEXT_PUBLIC_APP_URL` to the Vercel deployment URL.
3. Add a Vercel deploy hook or rely on the `postinstall: prisma generate` script — Prisma client is generated automatically on `npm install`.
4. Run `npx prisma migrate deploy` — applies all migrations to the production database.
5. Run `npx prisma db seed` — seeds vessels, owners, charterers, fixtures, requirements, and position snapshots.
6. Verify: visit `/api/health` (returns `{ status: "ok" }`), `/map` (vessel markers appear), `/requirements` (list loads).

---

## Domain context

FixtureLog models the shortest credible path from an offshore enquiry to a fixed deal and its recap, with a marine weather check and a regional vessel map. Key domain vocabulary: **charterer** hires the vessel, **owner** provides it, the **shipbroker** negotiates the deal, the **fixture** is the agreed hire contract, the **recap** summarises the terms, and **subjects** are conditions that must be lifted before the deal is clean fixed. See [docs/GLOSSARY.md](docs/GLOSSARY.md) for the full offshore shipbroking glossary.

---

## Roadmap

**Next:** PACKET-008 — auth integration (OAuth/OIDC, sign-in CTAs, protected routes). The public landing already includes a disabled "Sign in coming next" teaser; PACKET-008 will wire it to a real provider.

**After auth:** AI Broker Copilot runtime (natural-language requirement intake, typed backend tools, human confirmation before writes) followed by AI evals + observability hardening.

## Future AI Broker Copilot

The planned AI Broker Copilot is specified in [SPEC-002](docs/specs/SPEC-002-ai-broker-copilot.md). It is **not built in v1.1.x** and no AI runs at runtime today.

The future design keeps the LLM as an interface and the backend as the source of truth: free-text requirement intake, typed backend tools, evidence-backed shortlist explanations, weather interpretation through backend verdicts, and human confirmation before any write. Follow-on work is split into a post-MVP AI Broker Copilot implementation and AI evals + observability hardening.

---

## Decisions & spec

| Document | What it locks |
|----------|---------------|
| [ADR-0001](docs/decisions/ADR-0001-research-first-methodology.md) | Research-first, packet-based methodology |
| [ADR-0002](docs/decisions/ADR-0002-data-and-integration-strategy.md) | Data & integration strategy — seeded Postgres + Open-Meteo; AIS deferred; weather persistence; honesty rule |
| [ADR-0003](docs/decisions/ADR-0003-application-architecture.md) | Application architecture — Next.js full-stack + service layer; Vercel + Neon; CI/CD parity |
| [SPEC-001](docs/specs/SPEC-001-mvp-build.md) | MVP build spec — scope tiers, canonical status enums, data model, feature contracts, CI/CD, build sequence |
| [SPEC-002](docs/specs/SPEC-002-ai-broker-copilot.md) | Planned AI Broker Copilot — LLM as interface, backend/tools as truth, HITL writes, safety model, future eval/observability strategy |

---

## Research documents (domain source material)

| Document | What it covers |
|----------|----------------|
| [SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md](docs/research/SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md) | Domain reference — SSY, vessels, fixtures, recaps, AIS, market, competitive landscape |
| [SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md](docs/research/SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md) | Recommended project, data model, pages/routes, build plan, worked pipeline example |
| [SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md](docs/research/SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md) | Real-vs-mock data strategy, API inventory, stack, deployment, seed figures |
| [SSY-OFFSHORE-GLOSSARY.md](docs/research/SSY-OFFSHORE-GLOSSARY.md) | Plain-English glossary of broking/maritime/tech terms + cheat sheet |
| [AI-BROKER-COPILOT-RESEARCH.md](docs/research/AI-BROKER-COPILOT-RESEARCH.md) | Planned copilot architecture, tool design, safety model, HITL flow, observability, and eval strategy |

Project context and decision history: [docs/architecture/PROJECT-CONTEXT.md](docs/architecture/PROJECT-CONTEXT.md).

---

## Methodology

FixtureLog uses a **research-first, packet-based methodology**:

- Packet-based planning with **task files before implementation**
- Explicit architecture decisions recorded as **ADRs** (`docs/decisions/`)
- **Source-of-truth research docs** (`docs/research/`) and a ratified **build spec** (`docs/specs/`)
- **Journal entries** (`docs/journal/`) and **PR docs** (`docs/pull-requests/`)
- **Semantic versioning**; ship small, ship often
- **Strict TypeScript** standards; **Zod validation** at all API boundaries
- **Tests** before work is considered complete
- **Living docs** (this README, etc.) kept in sync with reality
- **No speculative implementation** before research and decisions are clear

---

## Landing page design

The public landing page uses a hybrid design direction:

1. **Helical Bio Explorer motion pattern (primary):** page structure, full-bleed hero, procedural canvas, staggered entrance, scroll-aware nav, `whileInView` reveals, and CTA-hover canvas intensity are ported from the author's Helical Bio Explorer project.
2. **SSY-inspired maritime editorial skin (secondary):** display-serif typography (Fraunces), deep navy `#000061` / cyan `#00e2fd` palette, full-width grid rhythm, generous spacing, pill CTAs, and editorial tone are informed by the SSY Global public homepage. The design input is the internal `docs/research/SSY-GLOBAL-LANDING-CSS-PATTERN-REPORT.md` CSS audit. No SSY brand assets, logos, or trademark treatments were copied.

The canvas rethemes the Helical animation into FixtureLog's domain: vessel tracks, port nodes, laycan arcs, weather bands, and a cyan route ribbon.

---

## About SSY (context, not affiliation)

SSY (Simpson Spence Young) is the world's largest independent shipbroker. This project is an independent portfolio demonstration and is **not affiliated with or endorsed by SSY**. Company facts cited in the research are drawn from public sources and tagged for confidence; some figures conflict across sources and are presented as ranges.
