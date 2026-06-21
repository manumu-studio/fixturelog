# SSY Offshore — Glossary

> **Purpose.** A quick-reference glossary of the offshore-broking and maritime-data terms used across the FixtureLog research. Each entry gives a **plain-English meaning first**, then why it matters for the platform. Confidence tags preserved from sources: [INFERENCE] = reasoned from evidence, not directly stated; [UNVERIFIED] = thin public evidence.
>
> Grouped: **(A) commercial workflow · (B) vessels & specs · (C) contracts & documents · (D) market & pricing · (E) data & technology · (F) companies & platforms.**

---

## A. Commercial workflow

| Term | Plain meaning | Why it matters in the platform |
|------|---------------|--------------------------------|
| **Shipbroker** | A commercial intermediary who matches a vessel **owner** with a **charterer**, negotiates the deal, and earns a commission. Owns no ships or cargo. | The product's user. It exists to support the broker's decisions and deal flow. |
| **Owner** | The company that owns or controls the vessel and hires it out. | One of the two core parties in a fixture. |
| **Charterer** | The company that hires the vessel (oil major, operator, drilling contractor, wind developer, EPCI). | Drives demand and sets the work requirement. |
| **Offshore broking** | Chartering offshore support vessels and rigs that *service* offshore energy (oil & gas, wind) — not moving bulk cargo. | The data model must represent work scopes, regions, capabilities and service jobs, not just "ship + cargo." |
| **Requirement** (a.k.a. "the order") | The charterer's job request: vessel type, region, workscope, dates, budget, conditions. | Usually the first structured object — the anchor that starts the workflow. (CONFIRMED on SSY's offshore site.) |
| **Position list / Tonnage list** | The live list of vessels that are **open** (available), each with open date, open port/region and specs. | The broker's most-used artefact; matching availability to a requirement is the core analytical task. (CONFIRMED.) |
| **Open** | A vessel that is available for new work. | A vessel's "position" = where it is and when it becomes free. |
| **Workscope** | The actual offshore job (supply, anchor handling, rig move, subsea/construction support, ROV support, standby, wind O&M). | Matching is capability-plus-timing, not just location or name search. |
| **Firm offer** | A time-limited, definite offer ("firm for reply 0900 London Tuesday"). | A broker must not float the same vessel on two firm offers at once. |
| **Counter** | A reply that amends terms; can be accepted, countered again, or declined. | Each counter kills the previous offer — a negotiation timeline/decision log is valuable. |
| **Subjects ("subs")** | Open conditions that must be satisfied before a deal is binding (e.g. "subject to board approval," "subject stem"). | Status must not collapse "nearly fixed" and "fully fixed" into one state. Track subjects explicitly. |
| **On subs** | Main terms agreed but conditions still pending; either party can still walk away. | A distinct status between negotiating and fixed. |
| **Lift subs / Clean fixed** | All subjects declared/satisfied ("lifted") → the deal is a binding contract ("clean fixed"). | Under English law there is no contract until subs are lifted (US law historically treats main-terms agreement as binding). |
| **Fixture** | A concluded charter deal — the moment owner and charterer are bound. "To fix a vessel" = conclude the charter. | The core record on the fixture board; the main business outcome to track. (CONFIRMED on SSY's offshore site.) |
| **Spot vs Term** | **Spot** = short-term/single-job, reprices daily. **Term/period** = longer (months–years) at a fixed day-rate. | North Sea brokers quote both; the model should support both charter types. |
| **Mob / Demob** | Mobilisation / demobilisation — lump sums or day-rates to bring the vessel to/from the work area. | A recap field; mob fee is typically payable on delivery (SUPPLYTIME). |
| **Off-hire** | Periods the vessel is not earning (breakdown, etc.). | Affects execution and billing. |

---

## B. Vessels & specifications

| Term | Plain meaning | Why it matters |
|------|---------------|----------------|
| **OSV** | Offshore Support Vessel — umbrella term for ships that supply, support and service offshore installations. | The asset class being brokered. |
| **PSV** | Platform Supply Vessel — the workhorse; large flat aft deck + below-deck tanks; carries mud, cement, fuel, water, provisions, deck cargo. | High-signal vessel-type filter; *spec quoted:* clear deck area (e.g. >900 m²). |
| **AHTS** | Anchor Handling Tug Supply — handles anchors/mooring, **tows** rigs, can do supply runs. | *Defining spec:* bollard pull (t) and winch capacity. Modelled separately from PSV. |
| **MPSV / CSV** | Multi-Purpose / Construction Support Vessel — premium segment; big cranes, ROV systems, DP2/DP3, large accommodation; subsea construction/IMR. | Commands the highest day-rates. (SSY-specific internal modelling: SPECULATIVE.) |
| **ERRV** | Emergency Response & Rescue Vessel — standby/safety. | Operational vessel type. |
| **DSV** | Dive Support Vessel — has a moon pool for divers/ROVs. | Operational vessel type. |
| **CTV** | Crew Transfer Vessel — small fast catamaran ferrying wind technicians daily; calm seas (~1.5–2 m wave height). | Offshore wind; weather-window relevant. |
| **SOV / CSOV** | Service (or Commissioning) Operation Vessel — "walk-to-work" floating base with motion-compensated gangways; crew live aboard 2–4 weeks. | Offshore wind growth segment. |
| **Rig / MODU** | Mobile Offshore Drilling Unit: **jackup** (legs to seabed, shallow water), **semi-submersible** (floating, deep water), **drillship** (ship-shaped, moonpool, deep/ultra-deep). | A distinct asset; SSY launched a dedicated Rig business in 2025. |
| **DP (DP1/DP2/DP3)** | Dynamic Positioning — computer-controlled thrusters hold position instead of anchors. DP1 = no redundancy; DP2 = single-fault tolerant; DP3 = DP2 + physical separation. | DP2 is the North Sea PSV norm; DP3 for highest-risk work. A key matching filter. |
| **Bollard pull (t)** | Static pulling/towing force in tonnes. | The defining AHTS capability spec (North Sea anchor handlers ~150–300+ t). |
| **BHP** | Brake horsepower — engine power; proxy for AHTS capability. | Industry splits AHTS at the **22,000 bhp** threshold. |
| **Clear deck area (m²)** | Usable open deck for cargo/equipment. | A defining PSV/CSV spec brokers quote. |
| **Deadweight (DWT)** | Total carrying capacity in tonnes. | Standard vessel spec. |
| **IMO number** | 7-digit unique permanent ship identifier. | Seeds the vessel table; unique constraint. |
| **MMSI** | 9-digit identifier broadcast over AIS. | Appears in AIS feeds; unique constraint. |
| **FiFi class** | Firefighting capability classification. | One of several capability fields. |

---

## C. Contracts & documents

| Term | Plain meaning | Why it matters |
|------|---------------|----------------|
| **Charterparty (C/P)** | The formal contract between owner and charterer. | Downstream of the recap; more clause-heavy. The platform preserves the data that ends up here. |
| **Recap (recapitulation)** | The brokers' message summarising every agreed commercial term once a deal is fixed — the operative record people work from, usually built before the full C/P. | A prime automation target; disputes are litigated on its wording. (Neat one-line definition is [INFERENCE]; its existence and importance is well supported.) |
| **SUPPLYTIME 2017** | BIMCO's standard time charter party for offshore support vessels — the offshore industry standard. | The recap generator should mirror its fields (see blueprint §6 / tech-decision §6). |
| **Knock-for-knock** | Liability regime where each party bears loss/damage to its own people and property regardless of fault. | Core to SUPPLYTIME; lets work continue and insurers settle rather than parties litigating. |
| **Maintenance days** | Days the owner may take the vessel off-hire for maintenance. | A SUPPLYTIME-specific feature. |
| **BIMCO** | Baltic and International Maritime Council — publishes standard maritime contracts/clauses (incl. TOWCON/TOWHIRE, WINDTIME) since 1905; promotes digital workflows (SmartCon). | The contract-standards body for the domain. |
| **GENCON** | BIMCO's general-purpose voyage charter (dry cargo). | Contrast form — not used offshore. |
| **NYPE** | New York Produce Exchange time charter form (dry cargo). | Contrast form — not used offshore. |
| **Laycan** | The laydays/cancelling window — the agreed date range for delivery/commencement. | The window the weather-window check is run against. |
| **Laytime / Demurrage** | Time allowed for loading/discharge, and the penalty for exceeding it (voyage charters). | Largely **irrelevant** to OSV time charters — useful contrast knowledge. |

---

## D. Market & pricing

| Term | Plain meaning | Why it matters |
|------|---------------|----------------|
| **Day-rate** | The daily commercial hire level ($/day) for a vessel or rig under a time charter. | The core price; day-rate comparison is one of the most practical analytics features. |
| **Utilisation** | Share of the marketed fleet that is on hire. | The dominant rate driver — high utilisation → rate spikes; idle vessels → rates fall to opex. |
| **"Last done" / "Average last 5 fixtures"** | Benchmarks: the most recent fixed rate, and a rolling average, by region and class. | Exactly what SSY's weekly report tabulates; the benchmark feature. |
| **Cold-stacked / Laid-up** | A vessel taken out of active service (often older tonnage in weak markets). | A vessel status; affects supply. |
| **EPCI** | Engineering, Procurement, Construction, Installation contractor. | A charterer category. |
| **FFA** | Forward Freight Agreement — a cash-settled freight derivative. | Relevant to SSY's derivatives business and benchmark awareness (not core to an offshore physical-broking MVP). |
| **Weather window** | The period when sea state (wave height, swell, wind-wave) is calm enough to do offshore work safely. *(ES: una ventana de clima/mar en la que el trabajo offshore se puede hacer de forma segura.)* | The domain meaning behind the Open-Meteo integration — showing whether a fixture's laycan is workable. |

---

## E. Data & technology

| Term | Plain meaning | Why it matters |
|------|---------------|----------------|
| **AIS** | Automatic Identification System — a transponder broadcast of identity, position, course, speed, nav status. Designed for **collision avoidance, not market intelligence**. | Feeds position lists; but the UI should show source freshness/confidence. |
| **AIS limitations** | Coverage gaps (~50 km terrestrial), "going dark," spoofing, stale last-known position, manual ETA errors. | Why a demo should model `lastKnownPosition` and **not** integrate live AIS. [INFERENCE] |
| **PostGIS** | PostgreSQL spatial extension (distance, nearest-neighbour, bounding-box queries). | Enables "vessels within N nm of a port"; a strong engineering signal (Neon/Supabase support it; Railway/Render built-in Postgres do not by default). |
| **Position snapshot** | A recorded vessel position + availability at a point in time, with source and confidence. | A first-class concern in the data model (CONFIRMED by SSY *Positions*). |
| **Terrestrial vs satellite AIS** | Terrestrial reaches ~50 km from shore; satellite covers open ocean but with slower passes. | Explains coverage trade-offs in any AIS discussion. |

---

## F. Companies & platforms

| Name | What it is | Relevance |
|------|------------|-----------|
| **SSY (Simpson Spence Young)** | World's largest independent (private) shipbroker, founded 1880, rebranded to "SSY" in 2024. | The employer. Offshore desk since 2023; co-founded Ocean Recap. (Company size figures conflict across sources — see knowledge base caveat.) |
| **SSY Navigator** | SSY's research portal (launched with the 2024 rebrand). | Part of SSY's digital push. |
| **SSY Offshore App** | SSY's offshore portal (ssyoffshore.com) — dashboard with **Fixtures, Requirements, Positions, Live Weather Map** (CONFIRMED structure; deeper behaviour [UNVERIFIED]). | The strongest signal validating the FixtureLog build. |
| **Ocean Recap** | Recap & C/P management platform **co-founded by SSY** (Feb 2025) as a neutral alternative to Sea/. | The single most relevant reference point — SSY literally co-built a recap tool. |
| **Sea/ by Maritech** | Dominant recap/C-P platform (Clarksons-owned). Richard White (now SSY CIO) co-founded it. | Benchmark for recap/contract workflows. |
| **Signal Ocean** | Chartering analytics SaaS (AIS + fixtures + cargoes + emails). SSY invested; acquired AXSMarine (2025). | Product-philosophy benchmark: unify messy data. |
| **Veson Nautical** | Owns IMOS (post-fixture ERP), Position List, Shipfix (AI email parsing). | Benchmark for connected "fixture-to-invoice" workflow. |
| **Kpler** | Maritime intelligence platform; acquired MarineTraffic, FleetMon (2023) and Spire Maritime (2025). | Why famous AIS APIs are now enterprise-only. |
| **Spinergie** | Offshore-focused market intelligence; tracks 14,000+ vessels, layers charters/work onto AIS. | Closest analytics analogue to an SSY offshore platform. |
| **Open-Meteo Marine** | Free, no-key marine weather API (wave/swell/wind-wave/currents). | The recommended single real integration for FixtureLog. |
| **AISStream.io / Datalastic / BarentsWatch** | Self-serve AIS sources (free beta / paid / free Norwegian-zone). | Day-4 stretch options only; not core. |
| **Neon / Vercel / Render / Supabase** | Serverless Postgres / frontend host / app host / Postgres+auth. | The recommended deployment stack. |

---

## Quick cheat-sheet (30 seconds before the interview)

- **Offshore broking = day-rate chartering of OSVs and rigs** for oil & gas and offshore wind — not moving cargo. Unit is $/day under **SUPPLYTIME 2017**, not freight per tonne.
- **Three core artefacts:** the **position list**, the **fixture**, and the **recap** — still made in Excel and email, which is the problem **Ocean Recap** (SSY co-founded) was built to fix.
- **Full workflow:** requirement → match open tonnage → negotiate → fix on subs → lift subs → clean fixed → recap → charterparty.
- **Specs brokers quote:** clear deck area (PSV), bollard pull + BHP (AHTS), DP2 vs DP3, crane + accommodation (CSV).
- **Honest scoping:** seeded data + one real API (Open-Meteo weather window); no fake live AIS.
- **SSY context:** ~145-year-old private partnership, world's largest independent broker, new to offshore since 2023, investing in digital under CIO Richard White (who co-founded Sea/). Use ranges for size figures.
