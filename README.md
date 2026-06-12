# FixtureLog

> **Status: v0.3.0 — PACKET-002 Core Vertical Slice complete.** 14 API routes, a pure service layer (FixtureStatusPolicy + RecapFormatter), Zod validation at every boundary, and two server-component UI pages are in place. PACKET-003 (matching) is next.

FixtureLog is a portfolio demo project: a small, realistic **offshore shipbroking workflow application**, built as a demonstration for an SSY (Simpson Spence Young) Full-Stack Developer role. It is an **Offshore Fixture Board + Recap Generator with a marine "weather window" check** — letting a broker capture a client requirement, match available offshore vessels, record the fixture (the agreed deal), generate the recap (the deal summary), and check whether marine weather supports the work window. The scope, architecture, and data model are locked in [SPEC-001](docs/specs/SPEC-001-mvp-build.md).

---

## Getting started

### Prerequisites
- Node.js 20+
- Neon Postgres database (or any PostgreSQL 16+)

### Setup
1. Clone the repo
2. `npm install`
3. `cp .env.example .env` — edit with your `DATABASE_URL`
4. `npx prisma generate`
5. `npx prisma migrate dev --name init`
6. `npx prisma db seed`
7. `npm run dev` — visit http://localhost:3000

---

## Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript strict check |
| `npm run test` | Run unit tests |
| `npm run test:coverage` | Unit tests + coverage report |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Database | PostgreSQL 16 (Neon) |
| ORM | Prisma 6 |
| Unit tests | Vitest + v8 coverage |
| E2E tests | Playwright |
| CI | GitHub Actions (4-job pipeline) |
| Deploy | Vercel + Neon (target) |

---

## Project structure

```
fixturelog/
├── .github/workflows/ci.yml
├── .nvmrc
├── .env.example
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
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── charterers/
│   │   │   ├── page.tsx                          # Charterer list
│   │   │   └── [id]/page.tsx                     # Charterer detail
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── charterers/
│   │       │   ├── route.ts                      # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts                  # GET detail
│   │       │       ├── requirements/route.ts     # GET requirements
│   │       │       └── fixtures/route.ts         # GET fixtures
│   │       ├── vessels/
│   │       │   ├── route.ts                      # GET list
│   │       │   └── [id]/route.ts                 # GET detail
│   │       └── fixtures/
│   │           ├── route.ts                      # GET list, POST create
│   │           └── [id]/
│   │               ├── route.ts                  # GET detail
│   │               ├── status/route.ts           # PATCH status
│   │               ├── recap/route.ts            # POST generate recap
│   │               └── subjects/
│   │                   ├── route.ts              # POST add subject
│   │                   └── [subjectId]/route.ts  # PATCH update subject
│   └── lib/
│       ├── prisma.ts
│       ├── health.ts
│       ├── health.test.ts
│       ├── services/
│       │   ├── fixture-status-policy.ts          # FixtureStatusPolicy
│       │   ├── fixture-status-policy.test.ts
│       │   ├── recap-formatter.ts                # RecapFormatter
│       │   └── recap-formatter.test.ts
│       └── validators/
│           ├── charterer.ts
│           ├── vessel.ts
│           ├── fixture.ts
│           └── subject.ts
├── e2e/
│   ├── global-setup.ts
│   └── smoke.spec.ts
└── docs/ (research, specs, decisions, journal, architecture, roadmap)
```

---

## API Routes

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
| GET | `/api/fixtures` | List fixtures |
| POST | `/api/fixtures` | Create a fixture |
| GET | `/api/fixtures/[id]` | Fixture detail |
| PATCH | `/api/fixtures/[id]/status` | Transition fixture status |
| POST | `/api/fixtures/[id]/recap` | Generate a SUPPLYTIME 2017 recap |
| POST | `/api/fixtures/[id]/subjects` | Add a subject to a fixture |
| PATCH | `/api/fixtures/[id]/subjects/[subjectId]` | Update subject status |

---

## Architecture

### Service layer

Business logic lives in pure TypeScript services under `src/lib/services/`:

- **`FixtureStatusPolicy`** — enforces the canonical Fixture status machine (`DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED`). The `ON_SUBS → FIXED` transition is **subject-gated**: it is only allowed when at least one SubjectItem exists on the fixture and every subject has status `LIFTED` or `WAIVED`. Rejected transitions return HTTP 400 with the count of outstanding subjects. Every successful transition writes a `FixtureStatusChange` audit row; transitioning to `FIXED` also stamps `Fixture.fixedAt`.
- **`RecapFormatter`** — produces a deterministic SUPPLYTIME 2017 recap in Markdown and plain text from the fixture's structured terms. No runtime LLM.

Both services have no framework imports and are instantiated with plain `new`. All domain rules are covered by unit tests.

---

## Decisions & spec

| Document | What it locks |
|----------|---------------|
| [ADR-0001](docs/decisions/ADR-0001-research-first-methodology.md) | Research-first, packet-based methodology |
| [ADR-0002](docs/decisions/ADR-0002-data-and-integration-strategy.md) | Data & integration strategy — seeded Postgres + Open-Meteo; AIS deferred; weather persistence; honesty rule |
| [ADR-0003](docs/decisions/ADR-0003-application-architecture.md) | Application architecture — Next.js full-stack + service layer; Vercel + Neon; CI/CD parity |
| [SPEC-001](docs/specs/SPEC-001-mvp-build.md) | MVP build spec — scope tiers, canonical status enums, data model, feature contracts, CI/CD, build sequence |

---

## Research documents (domain source material)

| Document | What it covers |
|----------|----------------|
| [SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md](docs/research/SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md) | Domain reference — SSY, vessels, fixtures, recaps, AIS, market, competitive landscape |
| [SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md](docs/research/SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md) | Recommended project, data model, pages/routes, build plan, worked pipeline example |
| [SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md](docs/research/SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md) | Real-vs-mock data strategy, API inventory, stack, deployment, seed figures |
| [SSY-OFFSHORE-GLOSSARY.md](docs/research/SSY-OFFSHORE-GLOSSARY.md) | Plain-English glossary of broking/maritime/tech terms + cheat sheet |

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

## About SSY (context, not affiliation)

SSY (Simpson Spence Young) is the world's largest independent shipbroker. This project is an independent portfolio demonstration and is **not affiliated with or endorsed by SSY**. Company facts cited in the research are drawn from public sources and tagged for confidence; some figures conflict across sources and are presented as ranges.
