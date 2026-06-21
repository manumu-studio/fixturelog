# SSY Offshore Fixture — Project Blueprint

> **Purpose.** This document turns the domain research into a concrete (but not yet final) product and technical blueprint for FixtureLog: the recommended project, the candidate feature set, a data model, page/route inventory, and a realistic build plan. It is **research output, not a committed plan** — packets and task files will formalise scope later.
>
> **Confidence tags:** CONFIRMED (named public source), [LIKELY] (well-supported, detail varies), [INFERENCE] (reasoned from evidence), [UNVERIFIED] / SPECULATIVE (thin evidence — flag it). Sources used `citeturn…` markers that have been removed; meaning preserved.
>
> See also: `SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md` (domain), `SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md` (APIs/stack/deployment), `SSY-OFFSHORE-GLOSSARY.md` (terms).

---

## 1. Headline recommendation

**Build an Offshore Fixture Board + Recap Generator** with:
- **seeded offshore commercial data** (vessels, owners, charterers, requirements, fixtures, recap templates),
- **exactly one real external API — Open-Meteo Marine** — for a genuinely useful "weather window / workability" feature, and
- a **Leaflet + OpenStreetMap** vessel/region map.

**Do not** try to become MarineTraffic, Signal Ocean, or Sea/ in five days. Build the **workflow spine** — requirement → shortlist → negotiation → fixture → recap — and show you understand the business.

**Why this wins (three reasons, all evidence-backed):**
1. **It mirrors SSY's own public offshore product language.** SSY's offshore site exposes a dashboard of **Fixtures, Requirements, Positions, and a Live Weather Map** (CONFIRMED). A fixture board + requirement tracking + position views + a real weather map aligns directly — no guessing at an imaginary platform.
2. **It sits in a real competitive problem-space.** Sea/ emphasises fixture + recap/contract management; Veson emphasises connected workflows "from fixture to final invoice"; Signal Ocean emphasises pulling fragmented market/communication data into one surface. The project addresses the same problem they do.
3. **It shows product sense *and* engineering fundamentals** — matching, workflow state design, document generation, auditability, external-data enrichment — without needing fragile enterprise live feeds. That disciplined trade-off is itself the interview story.

**Core interview line:** *"I built the shortest credible path from enquiry to fixture to recap, used one real API where it genuinely helps the user, and kept the scope disciplined."*

---

## 2. The data-strategy decision: seeded + ONE real API

This is the most important early decision. The research is consistent across sources:

- **Seeded data** gives a credible, controllable broker dataset (real vessel names, real charterers, realistic day-rates) with **zero reliability risk in a live demo**.
- **One real, no-friction API** proves you can integrate external services and adds a domain-authentic feature.
- **Open-Meteo Marine** is the best single real API: free, **no API key, no signup**, North Sea coverage at ~5 km resolution, returning exactly the variables (wave height, swell, wind-wave, currents) that determine offshore vessel **workability**. Zero demo-day failure risk.
- **Avoid every enterprise-gated AIS API** (MarineTraffic/Kpler, Spire) — they are sales-led and will burn days. AISStream.io is free but beta/WebSocket/backend-only — a day-4 stretch at most. (Full analysis in the technical-decision research doc.)

> **Honesty rule (from the research, important for the interview):** *Do not present seeded data as live.* Be explicit in the UI and README about what is seeded vs live. An SSY interviewer will respect honest scoping more than a fragile "everything is live" claim.

---

## 3. Candidate project ideas (ranked)

All are plausible; they are not equally strong for a 5-day build. **Idea A is the recommendation;** the others are natural sub-slices or "phase 1" fallbacks.

| # | Idea | What it does | Why SSY cares | Main risk |
|---|------|--------------|---------------|-----------|
| **A** ⭐ | **Offshore Fixture Board + Recap Generator** | Requirement → shortlist → negotiation → fixed → recap, with weather card + history search | Matches SSY Offshore's public *Requirements / Positions / Fixtures / Weather* language | None of the core workflow is fake if you seed responsibly |
| B | **Recap Generator & Fixture Library** | SUPPLYTIME-style recap builder → versioned, searchable fixture archive | Directly echoes **Ocean Recap** (SSY co-founded) and Sea/contracts | Over-scoping real legal clause libraries |
| C | **OSV Day-Rate Benchmarking Dashboard** | Visualise day-rate trends, "last done," rolling averages by class/region | Mirrors SSY Research's offshore market intelligence | Needs believable historical sample data |
| D | **Tonnage Position List & Availability Map** | Filterable position list + map of last-known positions + predicted open dates | The position list is the broker's most-used artefact | Can feel thin without a fixture workflow |
| E | **Offshore Wind Vessel (CTV/SOV) Scheduler** | Schedule CTVs/SOVs against wind-farm tasks with weather-window constraints | SSY entered wind via F3 Offshore; renewables growth | Optimisation/weather scope creep |

Two more concepts surfaced in research and fold into Idea A rather than standing alone: a **Requirement-to-Vessel Matcher** (explainable weighted shortlist) and a **Pre-Fixture Governance / Subjects Checker** (track subjects + approvals before commitment).

---

## 4. Recommended data model

A Prisma-friendly relational model. Confidence tags note how strongly each entity is supported by SSY's public product and the wider tooling market.

| Model | Core fields | Why it exists | Confidence |
|-------|-------------|---------------|------------|
| `Owner` | `id, name, country, notes` | Vessel commercial principal | [LIKELY] |
| `Charterer` | `id, name, sector, notes` | Buyer of offshore service | [LIKELY] |
| `Broker` | `id, name, office, email` | Internal user + accountability | [LIKELY] |
| `Region` | `id, code, name, centerLat, centerLng` | Commercial search area + map anchor | [LIKELY] |
| `Workscope` | `id, code, name, description` | Standardise job types | [LIKELY] |
| `Vessel` | `id, name, imo, mmsi, vesselType, ownerId, deckArea, bollardPull, dpClass, builtYear, status` | Core operational asset | [LIKELY] |
| `PositionSnapshot` | `id, vesselId, capturedAt, lat, lng, portName, availabilityFrom, source, confidence` | Position + availability are first-class | **CONFIRMED** (SSY *Positions* + tooling) |
| `Requirement` | `id, chartererId, regionId, workscopeId, startDate, endDate, vesselTypeNeeded, dayRateBudget, status, sourceChannel, notes` | Starts the workflow | **CONFIRMED** (SSY *Requirements*) |
| `Fixture` | `id, requirementId, vesselId, brokerId, status, agreedDayRate, currency, mobilizationFee, durationDays, subjectsSummary, fixedAt` | Canonical commercial booking | **CONFIRMED** (SSY *Fixtures* + industry) |
| `Recap` | `id, fixtureId, version, generatedMarkdown, generatedText, sentAt, approvedByBrokerId` | Automation target + handoff doc | [LIKELY] (Sea/ contract workflow) |
| `RateBenchmark` | `id, regionId, vesselType, workscopeId, basisDate, minRate, medianRate, maxRate, source` | Pricing awareness | [LIKELY] |
| `SubjectItem` | `id, fixtureId, label, status, dueAt, owner` | Model "on subjects" properly | [LIKELY] |

**Enums (union-type friendly):**
- `RequirementStatus = NEW | SHORTLISTED | NEGOTIATING | ON_SUBJECTS | FIXED | CLOSED_LOST`
- `FixtureStatus = DRAFT | NEGOTIATING | ON_SUBJECTS | FIXED | CANCELLED`
  *(an earlier source used `ENQUIRY | ON_SUBS | CLEAN_FIXED | FAILED | COMPLETED` — reconcile during planning; both encode the same domain rule that "on subs" ≠ "fixed")*
- `PositionSource = SEEDED | MANUAL | AIS | IMPORTED`
- `ConfidenceLevel = HIGH | MEDIUM | LOW`
- `VesselType = PSV | AHTS | MPSV | CSV | ERRV | DSV | CTV | SOV | OTHER`
- `DPClass = DP1 | DP2 | DP3 | NONE`
- `Region = NORTH_SEA | BRAZIL | US_GULF | WEST_AFRICA | MIDDLE_EAST | SE_ASIA | MEDITERRANEAN`

**Postgres notes:** `Owner 1—* Vessel`; `Vessel 1—* Fixture`; `Charterer 1—* Fixture`; `Fixture 1—* Recap` (versioned); `Requirement 0..1—* Fixture`. Index `Vessel(status, openRegion, openDate)` for the position-list/matching query and `Fixture(region, vesselType, fixedAt)` for benchmarking. Unique constraints on IMO/MMSI; audit timestamps everywhere.

> **Domain-modelling principle (worth saying in interview):** *"I kept the model biased toward broker workflow, not vessel engineering. I only modelled the attributes that affect matching, pricing and execution."*

---

## 5. Pages and API routes

**Pages (Next.js App Router):**
- `/dashboard` — summary cards + recent activity
- `/requirements` — list + filters · `/requirements/[id]` — detail + vessel shortlist
- `/fixtures` — board/table by status · `/fixtures/[id]` — detail + recap panel
- `/vessels` — list · `/vessels/[id]` — detail + map + weather card
- `/map` — regional vessel positions
- `/benchmarks` — day-rate comparison view

**API routes:**
- `GET /api/vessels` · `GET /api/vessels/:id`
- `GET /api/requirements` · `POST /api/requirements` · `POST /api/requirements/:id/match`
- `GET /api/fixtures` · `POST /api/fixtures` · `PATCH /api/fixtures/:id/status`
- `POST /api/fixtures/:id/recap`
- `GET /api/weather/marine?lat=…&lng=…` (Open-Meteo proxy + cache)
- `GET /api/benchmarks`
- *(stretch)* `GET /api/vessels/near?lat&lng&nm` (PostGIS)

---

## 6. Architecture

A deliberately "boring in a good way" stack that matches what SSY hires for:

- **Frontend:** Next.js (App Router) + React + TypeScript.
- **Backend:** Next.js Route Handlers in the Node.js runtime, with a clear **service layer** so it reads like a real API project.
- **Database:** PostgreSQL + Prisma. Add **PostGIS** only if time allows.
- **External integration:** Open-Meteo Marine (weather snapshots by region/vessel area).
- **Map:** Leaflet + OpenStreetMap tiles (demo-only tile usage).
- **Infra:** Docker Compose (app + db) locally.
- **Deployment:** Vercel or Render for the app; **Neon** or Supabase for PostgreSQL (Neon supports PostGIS).
- **CI/CD:** GitHub Actions — lint, typecheck, test, build (free on a public repo).
- **Python (optional):** a single seed-data normaliser/import script — **not** a runtime dependency unless genuinely needed.

**Domain services (object-oriented seams):** `FixtureMatcher`, `RecapFormatter` / `RecapGenerator`, `WeatherEnricher`, `FixtureStatusPolicy`, `VesselMatcher`.

**Engineering-fundamentals map (what to demonstrate):**

| Fundamental | How the project shows it |
|-------------|--------------------------|
| OOP | Focused domain services with clear responsibilities |
| DS & algorithms | Weighted shortlist scoring; availability-overlap checks; benchmark bucketing; Haversine/PostGIS distance ranking |
| REST API design | Resource routes, idempotent reads, explicit status transitions, validation, proper error responses |
| PostgreSQL modelling | Normalised tables, FKs, enums, unique IMO/MMSI, indexes, optional geospatial index, migrations |
| Docker | Dockerfile + compose for reproducible local dev |
| Cloud | Vercel/Render + Neon/Supabase, env vars, migrations |
| CI/CD | GitHub Actions: lint/typecheck/tests + preview deploy |
| Python | Optional FastAPI/data script for seed parsing |
| Testing | Vitest/Jest unit (matcher, recap), API integration (status transitions), one Playwright happy-path E2E, pytest if Python used |
| Responsible AI | Use Claude/Cursor to scaffold; verify via tests, schema validation, domain review; commit a short README "AI usage" note |

---

## 7. Realistic 5-day build plan

| Day | Deliverable |
|-----|-------------|
| **1** | Repo + CI skeleton; Neon (+PostGIS if used); Prisma schema + migrations; seed script (real owners/charterers/ports, realistic day-rates); core pages for vessels/requirements/fixtures |
| **2** | Node REST API (vessels, requirements, fixtures) + fixture status workflow; requirement detail + vessel shortlist logic; fixture creation flow; unit tests |
| **3** | Recap generator (SUPPLYTIME fields); status transitions + audit trail; tests for core services; UI — fixture board, vessel list/detail, map (Leaflet + OSM) |
| **4** | Open-Meteo marine weather-window panel; map page + weather cards; vessel-to-requirement matching algorithm; benchmark view; PostGIS "vessels near port" (optional); add AISStream.io live layer **only if on track** |
| **5** | Playwright E2E (requirement → match → fixture → recap); polish; deploy (Vercel + Render + Neon); README + glossary + AI-usage note; screenshots / short demo recording |

**If you must cut scope, cut in this order:** (1) PostGIS → (2) advanced benchmark analytics → (3) Python helper scripts → (4) fancy drag-and-drop board UI.

**Do NOT cut:** (1) the requirement → shortlist → fixture → recap spine; (2) a clean status model; (3) one real API; (4) tests around matching and recap generation.

---

## 8. Feature tiers

- **Safe MVP (must-build):** Vessel CRUD; requirement CRUD; fixture board with status workflow; recap generator (SUPPLYTIME-style summary); seeded realistic data; map of vessels/ports; basic tests; deployed.
- **Impressive but realistic:** PostGIS "vessels within N nm of field/port"; vessel↔requirement matching (filter by DP class, deck area, bollard pull → rank by distance + day-rate fit); Open-Meteo weather-window check on the fixture laycan; optional Python recap/analytics service; CI/CD with tests; Dockerised.
- **Too risky — avoid:** live MarineTraffic/Spire/Kpler integration (enterprise sales); a paid Datalastic dependency in a live demo; building an AIS receiver; heavy Copernicus NetCDF pipelines; real-time AIS as the critical path.

---

## 9. Reference TypeScript model (illustrative)

From the research (lightly reconciled). Strong enough for a demo, honest enough for an interview. **Not the final schema** — the canonical model lives in §4.

```ts
type UUID = string;

type Region = "NORTH_SEA" | "BRAZIL" | "US_GULF" | "WEST_AFRICA" | "MIDDLE_EAST" | "SE_ASIA" | "MEDITERRANEAN";
type VesselType = "PSV" | "AHTS" | "MPSV" | "CSV" | "ERRV" | "DSV" | "CTV" | "SOV" | "OTHER";
type DPClass = "DP1" | "DP2" | "DP3" | "NONE";
type Workscope = "SUPPLY" | "ANCHOR_HANDLING" | "RIG_MOVE" | "TOWING" | "CONSTRUCTION" | "IMR" | "ROV_SUPPORT" | "STANDBY" | "WIND_OM";
type FixtureStatus = "ENQUIRY" | "ON_SUBS" | "CLEAN_FIXED" | "FAILED" | "COMPLETED";
type CharterType = "SPOT" | "TERM";

interface Owner { id: UUID; name: string; country?: string; }
interface Charterer { id: UUID; name: string; type?: "OIL_MAJOR" | "OPERATOR" | "DRILLING_CONTRACTOR" | "WIND_DEVELOPER" | "EPCI"; }

interface Vessel {
  id: UUID; name: string; vesselType: VesselType; ownerId: UUID;
  buildYear?: number; flag?: string; classSociety?: string;
  deckAreaM2?: number; deadweightT?: number; bollardPullT?: number; bhp?: number;
  dpClass: DPClass; accommodation?: number; craneCapacityT?: number;
  fifiClass?: string; imo?: string;
  status: "OPEN" | "ON_HIRE" | "YARD" | "LAID_UP";
  openDate?: string; openRegion?: Region; openPort?: string;
  lastKnownLat?: number; lastKnownLng?: number; lastPositionAt?: string; // AIS proxy
}

interface Requirement {
  id: UUID; chartererId: UUID; region: Region; workscope: Workscope;
  vesselType: VesselType; minDeckAreaM2?: number; minBollardPullT?: number; minDpClass?: DPClass;
  commencement: string; durationDays?: number; charterType: CharterType;
  status: "OPEN" | "MATCHED" | "FIXED";
}

interface Fixture {
  id: UUID; vesselId: UUID; chartererId: UUID; requirementId?: UUID;
  region: Region; workscope: Workscope; charterType: CharterType;
  dayRate: number; currency: "USD" | "GBP" | "NOK";
  mobFee?: number; demobFee?: number;
  commencement: string; durationDays?: number; redelivery?: string;
  status: FixtureStatus; charterPartyForm: "SUPPLYTIME_2017" | "OTHER";
  fixedAt?: string; subjects?: string[];
}

interface Recap {
  id: UUID; fixtureId: UUID; version: number; createdAt: string;
  bodyText: string; mainTerms: Record<string, string>;
}
```

---

## 10. Illustrative end-to-end pipeline (frontend → backend → DB → response)

> This is a **worked example** of the intended flow, not a spec. It shows what the user does, what the backend does, and what the user gets back at each step. Think of the app as a small "broker workflow machine": the broker enters to answer one question — *"A client needs a vessel. Which vessel can do the job, what deal can we record, and can we generate the recap?"*

**Step 0 — User enters the app (dashboard).**
Frontend → `GET /api/dashboard`. Backend queries PostgreSQL for open requirements, available vessels, recent fixtures, average day-rates, active recaps.
*User sees:* a dashboard — e.g. "12 available vessels · 4 open requirements · 3 fixtures on subjects · 2 fixed this week · avg PSV day-rate £18,500/day."

**Step 1 — Client requirement.**
Broker creates a requirement (Client: Equinor · Needs: PSV · Region: North Sea · Work: platform supply · Start: 20 Jun · Duration: 14 days · Budget: £20,000/day).
Frontend → `POST /api/requirements`. Backend: **(1)** validate with Zod, **(2)** save to PostgreSQL, **(3)** return the created requirement.
*User sees:* "Requirement created. Now matching vessels…"

**Step 2 — Vessel matching.**
Backend queries vessels (type = PSV, region = North Sea, available before 20 Jun, can do platform supply), then runs a matching algorithm:
- **Hard filters** remove wrong type / not available / wrong region.
- **Score** remaining: closer location ↑, better availability ↑, day-rate near budget ↑, right capabilities ↑.

*User sees a ranked shortlist:*
```
1. Skandi Vega   — 92%  PSV, Aberdeen, available 18 Jun, £18,500/day
2. Far Symphony  — 84%  PSV, North Sea, available 21 Jun, £19,200/day
3. Normand Aurora— 78%  PSV, Stavanger, available 19 Jun, £20,500/day
```

**Step 3 — Weather window (the one real API).**
For the selected vessel/region, backend calls **Open-Meteo Marine** (`GET /api/weather/marine?lat=…&lng=…` proxying Open-Meteo) for the laycan date. Open-Meteo returns wave height 1.4 m, moderate wind-wave, acceptable swell. Backend converts to a verdict.
*User sees:* "✅ Workable window · wave height 1.4 m · risk: Low (below 2 m threshold)."

**Step 4 — Broker creates a fixture.**
Broker picks Skandi Vega and records the deal (Owner: DOF · Charterer: Equinor · Rate: £18,500/day · Status: On Subjects · Delivery: Aberdeen).
Frontend → `POST /api/fixtures`. Backend: validate → save → link to vessel + requirement + charterer → return fixture detail. Later: `PATCH /api/fixtures/:id/status` → `FIXED`.
*User sees:* "Fixture created. Status: On Subjects."

**Step 5 — Recap generator.**
When fixed, broker clicks "Generate Recap." Frontend → `POST /api/fixtures/:id/recap`. Backend: fetch fixture + vessel + owner + charterer + weather snapshot → generate structured recap text → save → return.
*User gets:* a clean SUPPLYTIME-style recap (vessel, type, owner, charterer, region, workscope, rate, delivery, start, duration, status, weather-window line, "Generated by FixtureLog").

**Backend picture:** `Frontend → REST API → Validation (Zod) → Business logic (services) → PostgreSQL → response`.

**What the user actually gets:** available vessels, a way to enter client needs, ranked matches, a marine-weather check, fixture status tracking, automatic recap generation, and a dashboard of current work.
**What the interviewer sees:** React/TS UI, REST API design, PostgreSQL modelling, business logic + algorithms, real external-API integration, genuine domain understanding, and engineering discipline.

> **Note for planning:** this pipeline assumes `GET /api/dashboard` (an aggregation endpoint not yet in §5) and a weather snapshot persisted on/near the fixture. Both are reasonable but should be decided explicitly during spec/packet planning.

---

## 11. Open product decisions (still to be made)

These are deliberately **not** decided yet — they belong in spec/packet planning:

1. **Next.js full-stack** (route handlers) vs **separate Node API**? Research leans Next.js route handlers with a service layer.
2. **Status model wording** — reconcile `ENQUIRY/ON_SUBS/CLEAN_FIXED/...` vs `NEW/NEGOTIATING/ON_SUBJECTS/FIXED/...`. Needs one canonical enum.
3. **Scope of the recap generator** — single SUPPLYTIME template vs multiple; plain-text vs Markdown vs export.
4. **Whether to include a matching/scoring algorithm in the MVP** or defer to the "impressive" tier.
5. **PostGIS in or out** for the MVP (engineering signal vs time cost).
6. **AISStream.io** — include as a day-4 live layer or cut entirely and seed positions.
7. **Python service** — include (FastAPI seed/recap) or stay TypeScript-only.
8. **SQL Server** — the role mentions PostgreSQL *and* SQL Server; the demo only needs Postgres. Decide whether to acknowledge SQL Server at all.
