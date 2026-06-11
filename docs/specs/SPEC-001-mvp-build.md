<!-- SPEC-001: the authoritative MVP build spec for FixtureLog. Locks scope, data model, feature contracts, CI/CD, standards, and build sequence. -->

# SPEC-001: FixtureLog MVP Build

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-06-11 |
| **Deciders** | Manu Murillo |
| **Supersedes** | — |
| **Related** | [ADR-0002 — Data & Integration Strategy](../decisions/ADR-0002-data-and-integration-strategy.md) · [ADR-0003 — Application Architecture](../decisions/ADR-0003-application-architecture.md) |
| **Inputs** | [Project blueprint](../research/SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md) · [Private context](../../CONTEXT.md) · Locked Decision Ledger (2026-06-11) |

> The Locked Decision Ledger (ratified 2026-06-11) is authoritative. Where this spec and `docs/research/` disagree, this spec wins; where this spec and the ledger disagree, the ledger wins. Enum values, scope tiers, and the CI shape below are locked, not advisory.

---

## 1. Goal & non-goals

### Goal

Ship a **disciplined, properly-built thin vertical slice** of an offshore shipbroking workflow app — enquiry → shortlist → negotiation → fixture → recap — deployed and CI-gated, over roughly one week. The build targets a **likely 2nd technical stage**, not the 30-minute 1st-stage conversation.

The 1st-stage artifact (Mon 15-Jun) is this spec plus the two ADRs: they demonstrate **domain fluency and architecture judgement**. Code is 2nd-stage material.

### Non-goals

- **Not** a Monday demo. Do not rush a fragile "everything is live" build for the 1st stage.
- **Not** an attempt to clone MarineTraffic / Signal Ocean / Veson / Sea. The product is the *workflow spine*, not a market-data platform.
- **Not** a vessel-engineering catalogue. The data model is biased toward broker workflow — only attributes that affect matching, pricing, and execution are modelled.

### Sequencing principle (locked, D1)

> Thin vertical slice **first** (seed → fixture board → recap end-to-end), then layer matching, weather, and map. Scaling features (PostGIS, benchmarks, dashboard) are stretch/nice-to-have, never on the critical path.

---

## 2. Canonical status vocabulary

Two lifecycles share the `NEGOTIATING / ON_SUBS / FIXED` vocabulary deliberately — that shared vernacular is the whole point. `ENQUIRY` belongs to the **Requirement**, never the Fixture. The wording is authentic broker vernacular ("on subs", "fixed", "it failed").

### 2.1 `Fixture.status` (D3, canonical)

```
DRAFT ──▶ NEGOTIATING ──▶ ON_SUBS ──▶ FIXED ──▶ COMPLETED
              │              │
              ▼              ▼
            FAILED         FAILED        (FAILED is terminal)
```

| State | Meaning |
|-------|---------|
| `DRAFT` | Deal being recorded, not yet in active negotiation. |
| `NEGOTIATING` | Terms under discussion. |
| `ON_SUBS` | "On subjects" — agreed pending subject lift. **Not** binding. |
| `FIXED` | **Equivalent to "clean fixed"**: all subjects lifted, deal binding. |
| `COMPLETED` | Charter performed and closed. |
| `FAILED` | Terminal. Reachable from `NEGOTIATING` or `ON_SUBS` ("it failed"). |

- **`FIXED` == "clean fixed".** All subjects lifted ⇒ binding. Do **not** add a separate `CLEAN_FIXED` value — note the equivalence in code and UI.
- Transitions are enforced by the `FixtureStatusPolicy` service (see §5). Illegal transitions (e.g. `DRAFT → FIXED`, `COMPLETED → anything`) are rejected with a 4xx and never written.

### 2.2 `Requirement.status` (D4, canonical)

```
ENQUIRY ──▶ SHORTLISTED ──▶ NEGOTIATING ──▶ ON_SUBS ──▶ FIXED
   │             │               │             │
   ▼             ▼               ▼             ▼
  LOST          LOST            LOST          LOST       (LOST is terminal)
```

| State | Meaning |
|-------|---------|
| `ENQUIRY` | Charterer requirement captured; workflow start. |
| `SHORTLISTED` | FixtureMatcher has produced a ranked vessel shortlist. **Maps 1:1 to the matching feature.** |
| `NEGOTIATING` | Shared vocabulary with Fixture. |
| `ON_SUBS` | Shared vocabulary with Fixture. |
| `FIXED` | Set when the **linked Fixture reaches `FIXED`** (the policy propagates it). |
| `LOST` | Terminal — requirement not satisfied. |

- A Requirement flips to `FIXED` automatically when its linked Fixture reaches `FIXED`. This propagation lives in `FixtureStatusPolicy`.

### 2.3 Uncontested enums (D-ENUMS, locked)

| Enum | Values |
|------|--------|
| `Vessel.status` | `OPEN \| ON_HIRE \| YARD \| LAID_UP` |
| `PositionSnapshot.source` | `SEEDED \| MANUAL \| AIS \| IMPORTED` |
| `PositionSnapshot.confidence` | `HIGH \| MEDIUM \| LOW` |
| `VesselType` | `PSV \| AHTS \| MPSV \| CSV \| ERRV \| DSV \| CTV \| SOV \| OTHER` |
| `DPClass` | `DP1 \| DP2 \| DP3 \| NONE` |
| `Workscope` (code) | `SUPPLY \| ANCHOR_HANDLING \| RIG_MOVE \| TOWING \| CONSTRUCTION \| IMR \| ROV_SUPPORT \| STANDBY \| WIND_OM` |
| `RegionCode` | `NORTH_SEA \| BRAZIL \| US_GULF \| WEST_AFRICA \| MIDDLE_EAST \| SE_ASIA \| MEDITERRANEAN` |
| `Currency` | `GBP \| USD \| NOK` |
| `CharterType` | `SPOT \| TERM` |
| `CharterPartyForm` | `SUPPLYTIME_2017 \| OTHER` |

> Modelling note: these are **TypeScript union types at the application boundary** and Prisma enums in the schema. No `enum`-vs-union debate — Prisma enums in the DB, narrow string unions in service code, validated by Zod at every boundary.

---

## 3. Data model (Prisma schema target)

Relational, Prisma-first. Field detail is reconciled from blueprint §4/§9; **all enums are overridden by the locked ledger values in §2** (notably: Fixture/Requirement statuses replace the blueprint's `ENQUIRY/CLEAN_FIXED/...` and `NEW/MATCHED/...` drafts). `WeatherSnapshot` is added per D6. Audit timestamps (`createdAt`, `updatedAt`) on every table; unique constraints on `Vessel.imo` / `Vessel.mmsi`.

### Reference / party entities

| Entity | Key fields | Relationships |
|--------|-----------|---------------|
| `Owner` | `id, name, country?, notes?` | `1—* Vessel` |
| `Charterer` | `id, name, sector?, notes?` | `1—* Requirement`, `1—* Fixture` |
| `Broker` | `id, name, office?, email` | `1—* Fixture` (accountability), approves `Recap` |
| `Region` | `id, code (RegionCode, unique), name, centerLat, centerLng` | anchors `Requirement`, `Vessel.openRegion`, map |
| `Workscope` | `id, code (Workscope, unique), name, description?` | classifies `Requirement` |
| `RateBenchmark` | `id, regionId, vesselType, workscopeId?, basisDate, minRate, medianRate, maxRate, source` | nice-to-have benchmarking view |

### Core operational entities

| Entity | Key fields | Relationships |
|--------|-----------|---------------|
| `Vessel` | `id, name, imo? (unique), mmsi? (unique), vesselType (VesselType), ownerId, deckAreaM2?, bollardPullT?, dpClass (DPClass), builtYear?, status (Vessel.status), openRegionId?, openPort?, openDate?` | `* —1 Owner`, `1—* PositionSnapshot`, `1—* Fixture` |
| `PositionSnapshot` | `id, vesselId, capturedAt, lat, lng, portName?, availabilityFrom?, source (PositionSource), confidence (ConfidenceLevel)` | `* —1 Vessel`. **`source`/`confidence` carry the honesty labelling (D5).** |
| `Requirement` | `id, chartererId, regionId, workscopeId, vesselTypeNeeded (VesselType), minDeckAreaM2?, minBollardPullT?, minDpClass?, startDate, endDate?, durationDays?, charterType (CharterType), dayRateBudget?, status (Requirement.status), sourceChannel?, notes?` | `* —1 Charterer/Region/Workscope`, `0..1—* Fixture` |
| `Fixture` | `id, requirementId?, vesselId, chartererId, brokerId, regionId, workscopeId, charterType, status (Fixture.status), agreedDayRate, currency (Currency), mobilizationFee?, demobilizationFee?, durationDays?, deliveryPort?, redeliveryPort?, commencement?, charterPartyForm (CharterPartyForm), subjectsSummary?, fixedAt?` | `* —1 Vessel/Charterer/Broker/Region/Workscope`, `0..1—* Requirement`, `1—* SubjectItem`, `1—* Recap`, `1—* WeatherSnapshot` |
| `SubjectItem` | `id, fixtureId, label, status, dueAt?, owner?` | `* —1 Fixture`. Models "on subs" line items; all lifted ⇒ Fixture eligible for `FIXED`. |
| `Recap` | `id, fixtureId, version (default 1), generatedMarkdown, generatedText, mainTerms (Json), approvedByBrokerId?, sentAt?` | `* —1 Fixture`. `version` stays in schema (regeneration → v2); **UI ships v1 only**. |
| `WeatherSnapshot` | `id, fixtureId?, lat, lng, waveHeightM, swellHeightM?, windWaveHeightM?, workabilityVerdict, laycanFrom?, laycanTo?, fetchedAt` | `* —1 Fixture` (optional — ad-hoc lookups need no fixture). **Decision-time provenance (D6).** |

### Indexing & integrity

- Index `Vessel(status, openRegionId, openDate)` for the position-list / matching query.
- Index `Fixture(regionId, vesselType?, fixedAt)` for benchmarking.
- Unique `Vessel.imo`, `Vessel.mmsi`. FKs everywhere; `onDelete` restrict for party tables.
- All status fields are Prisma enums matching §2 exactly.

---

## 4. Feature contracts

Each must-have feature below is scoped with acceptance criteria. `FixtureMatcher` (§4.6) and `RecapFormatter` (§4.7) are specified in full detail — they are the technical centerpieces.

### 4.1 Seed (must-have)

Seed 20–40 **real** OSVs plus owners, charterers, North Sea ports, regions, workscopes, and realistic day-rate ranges.

- Real names: Tidewater, Solstad, DOF, Havila, Island Offshore (owners/operators); real North Sea ports (Aberdeen, Stavanger, Esbjerg, …).
- Realistic rates: North Sea PSV spot ~GBP 7,134/day; large AHTS spot ~GBP 56,798/day (used as benchmark anchors).
- Every seeded `PositionSnapshot` is written with `source = SEEDED` and an honest `confidence`.
- Seed is idempotent and re-runnable (used by CI e2e to produce a deterministic DB).

### 4.2 Vessel CRUD + position list (must-have)

List vessels with last-known position and availability; filter by type / region / status.

- `GET /api/vessels` supports filters: `vesselType`, `regionId`, `status`.
- List rows show position (from latest `PositionSnapshot`) **with the source/confidence label visible** — seeded data is never presented as live.
- `GET /api/vessels/:id` returns vessel detail incl. capability fields.
- Zod-validated query params; invalid filter → 400.

### 4.3 Requirement CRUD + shortlist (must-have)

Capture a charterer requirement and produce a ranked vessel shortlist.

- `POST /api/requirements` validates with Zod, persists, returns the created requirement (`status = ENQUIRY`).
- `POST /api/requirements/:id/match` invokes `FixtureMatcher` and returns a ranked shortlist (0–100).
- Producing a shortlist transitions the requirement to `SHORTLISTED`.
- Shortlist rows show the score **and the per-factor breakdown** (explainability).

### 4.4 Fixture board + status workflow (must-have)

Board/table of fixtures by status, with subjects tracking and an audit trail.

- `POST /api/fixtures` creates a fixture (links vessel + charterer + broker, optional requirement).
- `PATCH /api/fixtures/:id/status` routes through `FixtureStatusPolicy`; illegal transitions → 4xx, never written.
- Subjects (`SubjectItem`) are trackable per fixture; the board reflects `ON_SUBS` vs `FIXED`.
- Reaching `FIXED` propagates `FIXED` to any linked `Requirement` and stamps `fixedAt`.
- Every status change is recorded (audit trail) with actor + timestamp.

### 4.5 Open-Meteo weather-window panel (must-have)

Persisted decision-time workability check for a fixture's laycan/area.

- `GET /api/weather/marine?lat=&lng=` proxies **Open-Meteo Marine** (free, no key, no signup).
- On a broker workability check, persist a `WeatherSnapshot` (wave/swell/wind-wave, verdict, lat/lng, laycan window, `fetchedAt`) linked to the fixture (D6).
- Ad-hoc "current conditions" lookups use a short-TTL cache; not every call persists.
- **Tests are hermetic**: seed a `WeatherSnapshot`; Playwright never calls the live API.

### 4.6 FixtureMatcher — scoring spec (must-have, D7, centerpiece)

Pure, deterministic service. No I/O, no DB calls inside — takes a requirement + candidate vessels + tunable weights, returns ranked scored results. Heavily unit-tested. This is the likely whiteboard question; it is **core, not stretch**.

**Stage 1 — hard filters** (a vessel failing any is excluded, not scored):

- `vesselType` matches the requirement.
- Availability window: vessel `OPEN` and available before requirement `startDate`.
- Region matches the requirement region.
- Capability minimums met: `deckAreaM2 ≥ minDeckAreaM2`, `bollardPullT ≥ minBollardPullT`, `dpClass ≥ minDpClass`.

**Stage 2 — weighted score (0–100)** over surviving vessels:

| Factor | Basis | Default weight |
|--------|-------|---------------|
| Distance proximity | Haversine great-circle distance vessel→region/port; closer ⇒ higher | 0.40 |
| Day-rate-vs-budget fit | Vessel/benchmark rate vs `dayRateBudget`; on/under budget ⇒ higher, penalise overshoot | 0.35 |
| Capability margin | Headroom above the hard minimums (deck/bollard/DP) | 0.25 |

- Weights are **tunable** (injected config), default as above, sum to 1.0.
- Output is `0–100`, monotonic, deterministic for identical inputs.
- Result includes the **per-factor contribution breakdown** for explainability (drives §4.3 UI).
- Distance uses the Haversine function in the service layer (§ D8). PostGIS is **not** used by the matcher.
- Unit tests cover: each hard filter rejecting independently; weight tuning changing rank; ties; empty candidate set; boundary capability values.

### 4.7 RecapFormatter — recap generator spec (must-have, D9, centerpiece)

Deterministic pure service over the **SUPPLYTIME 2017** field set. **No runtime LLM** — precision and testability win; AI-first development is documented in the README dev-usage note, never used to generate contract terms.

**Input field set (SUPPLYTIME 2017):**

- Vessel (name, type), Owners, Charterer
- Hire rate / day + currency
- Mobilisation fee + demobilisation fee
- Laycan / delivery, redelivery port
- Period of hire (duration)
- Area / workscope
- Governing law

**Output & behaviour:**

- Emits **both Markdown and plain text** from the same structured `mainTerms`.
- Deterministic: identical fixture ⇒ identical output, byte-for-byte.
- Export via **copy-to-clipboard** (mirrors paste-into-Outlook) **and** file download.
- May append a persisted weather-window line and a "Generated by FixtureLog" footer.
- `Recap.version` is persisted; regeneration produces v2 in schema, but **UI ships v1 only**.
- Unit tests assert exact rendered output for a known fixture (snapshot-style), Markdown↔text parity, and field completeness.

### 4.8 Regional map (must-have — BUILT LAST)

Leaflet + OpenStreetMap with vessel and port markers.

- Built **last** among must-haves; **lazy-loaded** (kept out of the first-load bundle).
- Shows vessel markers (from latest `PositionSnapshot`, source-labelled) and port markers.
- **First must-have to slip** if time-pressed (its absence does not break the vertical slice).
- OSM tiles are demo-only usage.

### 4.9 Tests & deploy (must-have)

- Vitest unit tests (matcher + recap heavily covered) + **one** Playwright e2e happy-path (enquiry → match → fixture → recap).
- Deploy: **Vercel + Neon**. CI/CD per §7.
- README + glossary + AI-usage note shipped.

---

## 5. Service layer (architecture, ADR-0003)

Next.js App Router + Route Handlers in the **Node runtime** (not edge) + Prisma, single Vercel deploy unit, with a clear service layer (D2). Named services:

| Service | Responsibility | Purity |
|---------|---------------|--------|
| `FixtureMatcher` | Hard filters + weighted 0–100 scoring (§4.6) | Pure |
| `RecapFormatter` | Deterministic SUPPLYTIME recap → Markdown + text (§4.7) | Pure |
| `WeatherEnricher` | Open-Meteo fetch + verdict + snapshot persistence (§4.5) | I/O at edge, pure verdict logic |
| `FixtureStatusPolicy` | Legal transition enforcement + Requirement `FIXED` propagation (§2) | Pure decision, persistence at caller |

Route Handlers stay thin: validate (Zod) → call service → persist → respond. Services contain no HTTP concerns and stay extractable into a standalone service later. Haversine distance lives in the service layer (§ D8).

---

## 6. Scope tiering

### Must-have (core) — D10, verbatim

> seed (20–40 real OSVs + owners/charterers/ports/rates); Vessel CRUD + position list (filter type/region/status); Requirement CRUD + FixtureMatcher shortlist (0–100); Fixture board + status workflow (subjects tracking + audit trail); Recap generator (deterministic SUPPLYTIME, MD+text); Open-Meteo weather-window panel (persisted snapshot); regional map (Leaflet + OpenStreetMap, vessel+port markers — BUILT LAST, lazy-loaded, first must-have to slip if time-pressed); tests (Vitest units + 1 Playwright e2e happy-path); deploy (Vercel + Neon) + CI/CD + README/glossary/AI-usage note.

### Nice-to-have — D10, verbatim

> dashboard (summary cards + recent activity, live /api/dashboard aggregation if built); day-rate benchmarking view (last-done + rolling avg).

### Stretch (only if ahead) — D10, verbatim

> PostGIS "within N nm"; AISStream.io live layer; Python FastAPI seed/recap/analytics service.

### Explicitly out of scope (MVP)

- **Live enterprise AIS** — MarineTraffic / Spire / Kpler / Datalastic (sales-gated, burns days).
- **Real charterparty legal text / e-signature** — no clause libraries, no legally-operative contract documents.
- **Auth / multi-tenant** — no login, no orgs, no RBAC in the MVP.
- **Real-time AIS as a critical-path dependency** — AISStream.io is a stretch layer only, not a core feature.
- **Python FastAPI service** — excluded from MVP; TypeScript-only (D-MICROS); future polyglot option.
- **SQL Server** — Postgres-only for the demo; README acknowledges SSY's enterprise .NET/SQL Server stack vs this platform's Postgres.

---

## 7. CI/CD pipeline spec (D11)

**Mirrors `learning-speaking-app` 1:1** — same Next.js 15 + Prisma + Postgres shape, so `ci.yml` / `playwright.config` / `vitest.config` are copied across. Triggers: `pull_request → main` and `push → main`. **Concurrency**: cancel-in-progress per branch. **npm cache** enabled.

Four jobs — three run in parallel, e2e gated behind all three:

```
┌─ lint-typecheck ─┐
├─ test-coverage   ─┼──▶  e2e  (needs: all three)
└─ build-bundle    ─┘
```

| Job | Runs | Gate |
|-----|------|------|
| **lint-typecheck** | `eslint .` + `tsc` strict (`tsconfig.build.json`) + `npm audit --audit-level=high --omit=dev` | Lint clean, type-clean, no high-sev prod vulns |
| **test-coverage** | `vitest --coverage`, upload to Codecov | Thresholds: **statements 70 / branches 60 / functions 70 / lines 70** |
| **build-bundle** | `next build` + bundle budget check + `/api/health` smoke test (curl) | **First-Load-JS ≤ 200 kB**; health returns **200 or 503** |
| **e2e** | `needs:` all three. Postgres **16-alpine** service container → `prisma migrate deploy` → seed → Playwright (chromium) happy-path | Happy-path passes; upload report **on failure** |

- **Vercel automatic per-PR preview deploys** — free, no CI job.
- **Deferred to post-MVP:** a hard deploy-status-gate job.
- **Strict TS flags** (`tsconfig.build.json`): `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noImplicitReturns` (plus `strict`).
- **ESLint complexity caps:** `max-lines 300`, `max-lines-per-function 80`, `complexity 15`, `max-depth 3`, `max-params 4` — tests/e2e relaxed.

---

## 8. Engineering standards (non-negotiable)

When the build starts, these are CI-blocking, not aspirational:

- **Strict TS.** No `any`. No non-null assertions (`!`). No unsafe `as` outside documented boundaries (only `as const`). All strict flags from §7 on.
- **Zod at every boundary.** Every `.json()`, FormData, URL/query param, and external API response (incl. Open-Meteo) is `z.schema.parse()`d. Never trust external data via `as Type`.
- **4-file component pattern.** `ComponentName.tsx` / `.types.ts` (exported interfaces, no inline prop types) / `index.ts` (barrel) / `useComponentName.ts` (only when needed). `.module.scss` for component-scoped CSS.
- **One-line header comment** at the top of every code file describing what it does.
- **Complexity caps** as §7 — when touching a file already >300 lines, split it as part of the change.
- **Tests before complete.** A feature is not done until its tests pass and `npx tsc --noEmit && npx eslint .` is clean.
- **Every packet ends with docs + living-doc sync** (README structure tree, CHANGELOG, glossary, AI-usage note).

---

## 9. Build sequence (thin slice first)

Day-numbered guide adapted from blueprint §7, **re-sequenced to honour D1's thin-slice-first rule and the D10 tiering**. Matching/weather/map layer onto a working spine; PostGIS/benchmarks/dashboard are stretch/nice-to-have and never block.

| Day | Deliverable | Tier |
|-----|------------|------|
| **1 — Spine foundation** | Repo + CI skeleton (copy 4-job pipeline from learning-speaking-app); Neon DB; Prisma schema (§3) + first migration; idempotent seed (§4.1); `tsconfig.build.json` + ESLint caps wired. | Must |
| **2 — Vertical slice end-to-end** | Vessel list/detail + position list (§4.2); Fixture board + `FixtureStatusPolicy` transitions + subjects + audit (§4.4); `RecapFormatter` (§4.7) wired to `POST /api/fixtures/:id/recap`. **Slice is demoable: seed → fixture board → recap.** Unit tests for RecapFormatter + status policy. | Must |
| **3 — Matching** | Requirement CRUD (§4.3) + `FixtureMatcher` (§4.6) behind `POST /api/requirements/:id/match`; shortlist UI with per-factor breakdown; Haversine in service layer. **Heavy matcher unit tests.** | Must |
| **4 — Weather + e2e** | `WeatherEnricher` + Open-Meteo proxy + persisted `WeatherSnapshot` panel (§4.5); one Playwright happy-path e2e (enquiry → match → fixture → recap), hermetic (seeded snapshot). | Must |
| **5 — Map + deploy + docs** | Regional map last, lazy-loaded (§4.8); deploy to Vercel + Neon; README + glossary + AI-usage note; CHANGELOG + journal. **If time-pressed, map is first to slip.** | Must |
| **Stretch (only if ahead)** | PostGIS "within N nm" (`ST_DWithin`, GiST index) with written scaling rationale (§ D8); nice-to-have dashboard (`/api/dashboard` aggregation) + benchmarking view; AISStream.io live layer; Python FastAPI service. | Nice / Stretch |

**Cut order if behind:** (1) regional map, (2) benchmarks/dashboard, (3) PostGIS, (4) any board polish. **Never cut:** the requirement → shortlist → fixture → recap spine, the status model, the one real API, and the matcher/recap tests.

---

## 10. Open items deferred to per-packet task files

These are intentionally left to packet planning, not decided here:

- Exact seed roster (which 20–40 named vessels, owner mapping, per-class day-rate table).
- `FixtureMatcher` default weight calibration values and the day-rate-fit penalty curve shape.
- `RecapFormatter` exact Markdown layout / governing-law default text / footer wording.
- `SubjectItem` label taxonomy and the rule mapping "all subjects lifted" → eligibility for `FIXED`.
- Audit-trail storage shape (dedicated table vs status-history rows).
- Open-Meteo workability thresholds (wave/swell/wind-wave cutoffs) and short-TTL cache duration.
- Component-level UI/UX (board layout, filter controls, map styling).
- Bundle-budget allocation across routes to stay ≤ 200 kB First-Load JS.
- Stretch packets: PostGIS migration + scaling rationale doc; `/api/dashboard` aggregation contract; benchmarking view query shape.

> Each packet ends with documentation + living-doc sync per the engineering standards (§8). Roadmap: [`docs/roadmap/ROADMAP.md`](../roadmap/ROADMAP.md). Project context: [`docs/architecture/PROJECT-CONTEXT.md`](../architecture/PROJECT-CONTEXT.md). Journal: [`docs/journal/ENTRY-003.md`](../journal/ENTRY-003.md). Changelog: [`CHANGELOG.md`](../../CHANGELOG.md).
