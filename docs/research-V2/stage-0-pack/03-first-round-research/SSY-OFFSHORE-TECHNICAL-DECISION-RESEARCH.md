# SSY Offshore — Technical Decision Research (Real vs Mock Data, APIs, Stack)

> **Purpose.** This document records the technical-integration research behind FixtureLog's data strategy: which external APIs are realistically usable, which to avoid, the recommended stack, deployment options, and realistic seed-data figures. It is the basis for the data-strategy ADR.
>
> **Confidence tags:** CONFIRMED (named public source), [LIKELY] (well-supported, exact figure varies), [INFERENCE] (reasoned), [UNVERIFIED] (thin evidence). Broken `citeturn…` markers removed; real URLs preserved at the end.
>
> **Headline decision:** **seeded data + exactly ONE real, no-friction API (Open-Meteo Marine).** Avoid every enterprise-gated AIS API. See `SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md` for how this shapes the product.

---

## 1. TL;DR

- **Build seeded PostgreSQL data + ONE real API.** Fully seeded data (vessels, requirements, fixtures) plus the **Open-Meteo Marine API** (free, no key, no signup) to power a genuinely useful **"weather window"** feature. Add **AISStream.io** (free, instant key) only as a day-4 stretch.
- **Avoid every enterprise-gated AIS API.** MarineTraffic (now Kpler), Spire, and Kpler are enterprise-sales-only and will burn days waiting for approval. The only AIS sources usable *today* without a sales call: AISStream.io (free, instant), Datalastic (instant key but paid), BarentsWatch (free, OAuth2 step). AISHub is free but needs a physical receiver — not viable.
- **Deploy on Vercel (Next.js) + Neon (free serverless Postgres with PostGIS) + Render/Railway (Node API + optional Python service).** Instant signup, genuine free/cheap tiers; demo cost ~£0–£5.

> **Why a "weather window" matters (plain English):** offshore crews cannot transfer to turbines or do anchor-handling safely when seas are rough. A *weather window* (Spanish: *una ventana de clima/mar en la que el trabajo offshore se puede hacer de forma segura*) is the period when sea state is calm enough to work. Showing whether a fixture's laycan has a workable forecast is real domain understanding, not a generic map.

---

## 2. The single most important filter — can you get a working key TODAY?

The maritime-data market consolidated hard in 2023–2025:
- **Kpler acquired MarineTraffic** (closed 7 Mar 2023) and **FleetMon** (closed 13 Mar 2023).
- **Kpler acquired Spire Maritime** (announced Nov 2024, ~$241m; closed 25 Apr 2025).
- S&P Global separately acquired ORBCOMM's AIS business.

**Consequence:** the famous names (MarineTraffic, Spire, Kpler) are now **enterprise-sales-only**. MarineTraffic discontinued its self-serve credit API in January 2025 and routes API access through "Contact Sales." **These are disqualified for a 5-day build.** (CONFIRMED)

**What you CAN sign up for instantly:**
- **AISStream.io** — genuinely free, real-time global AIS over WebSocket, key generated instantly after GitHub sign-in. No card. (CONFIRMED)
- **Open-Meteo Marine API** — free for non-commercial use, **no API key at all**, just HTTP GET. Returns wave height, wave/swell direction & period, wind-wave height, ocean currents. (CONFIRMED)
- **Datalastic** — self-serve, key by email in minutes, but **paid**. REST, easy to integrate. (CONFIRMED self-serve; exact entry price varies €99 vs €199 — treat as [LIKELY], confirm at signup.)
- **BarentsWatch (Kystverket)** — free open AIS for the Norwegian economic zone via REST + OAuth2 client-credentials; requires registering a user + API client. Relevant for North Sea. (CONFIRMED free; mild setup friction.)

---

## 3. Vessel / AIS data APIs

| Provider | Data | Free tier / cost | Friction | Worth it in 5 days? |
|----------|------|------------------|----------|---------------------|
| **AISStream.io** | Real-time AIS over WebSocket; position, identity, port calls, static data. Global. | **Free.** No card. | **None** — GitHub sign-in, instant key. | **Best free live option.** Caveat: WebSocket (not REST), terrestrial coverage, disconnects ~every 2 min → handle reconnects. Beta, no SLA, backend-only (not browser-direct). |
| **Datalastic** | REST: real-time position, ETA, particulars, ports, historical, vessels-in-radius. 800k+ vessels. | **Paid, self-serve.** From €99–€199/mo per source. 2-week money-back. | **Low** — key by email in ~5 min. | Only if you want REST + radius queries and will pay. `/vessel_inradius` fits "vessels near port" but cost is unnecessary for a demo. |
| **MarineTraffic (Kpler)** | Largest AIS network; positions, particulars, events, historical. | API **Enterprise-only / Contact Sales** since Jan 2025. | **High** — sales call. | **No** — disqualified. |
| **VesselFinder** | REST credit-based AIS: positions, voyage, particulars, route planner. | Credit packs; trial credits. | **Medium** — self-serve but credits via email/wire. | **Marginal** — usable but more friction + cost than AISStream. |
| **Spire Maritime** | Satellite AIS, large constellation. | Enterprise (now Kpler). | **High.** | **No.** |
| **Kpler** | Full maritime intelligence platform. | Enterprise. | **High.** | **No.** |
| **AISHub** | Aggregated community AIS feed (JSON/XML/CSV). | **Free** *only if* you contribute a receiver feed (≥10 vessels, ≥90% uptime). | **Disqualifying** — needs a physical receiver. | **No.** |
| **BarentsWatch (Kystverket)** | Free open AIS for Norwegian economic zone; live + historic; REST + GeoJSON. | **Free** under NLOD. | **Medium** — register, create client, OAuth2. | **Strong North Sea angle** if you want real regional vessels and accept OAuth2 setup. |
| **aprs.fi** | Hobby APRS/AIS. | Free hobby API. | Low. | Not broking-credible; skip. |

---

## 4. Marine / weather APIs

| Provider | Data | Free tier | Friction | Demo fit |
|----------|------|-----------|----------|----------|
| **Open-Meteo Marine** ⭐ | Wave height, wave/swell direction & period, wind-wave height, current velocity/direction, SST. 5 km European model covers the North Sea. | **Free, non-commercial, NO API KEY.** CC-BY 4.0. | **None.** HTTP GET. | **Best fit.** Powers the weather-window/workability feature. Sign-up-free = zero demo-day risk. |
| **Stormglass.io** | Marine: wave, swell, currents, wind, tides, water temp. | Free **10 req/day, non-commercial**; paid €19/€49/€129/mo (500/5,000/25,000 req/day). | Low — register, key. | Backup. 10 req/day is tight; fine for a cached demo. |
| **NOAA (US)** | Tides, weather, marine. | Free, no key (many endpoints). | None. | US-centric; tides useful, less relevant to the North Sea. |
| **Met Office (UK)** | UK weather (DataHub). | Free tier; key required. | Medium. | Optional; Open-Meteo already covers the UK. |
| **Copernicus Marine** | Authoritative ocean/wave reanalysis & forecast. | Free but registration + NetCDF. | Medium-high. | Overkill for 5 days. |

---

## 5. Maps and geospatial

| Tool | Capability | Cost | Friction | Demo use |
|------|-----------|------|----------|----------|
| **Leaflet + OpenStreetMap** ⭐ | Lightweight 2D maps, markers, popups. | **Free, open source.** Tiles donation-funded, best-effort, no SLA — demo use only, respect tile policy. | None. | Plot vessel positions and ports. Simplest path; recommended. |
| **MapLibre GL JS** | WebGL vector tiles, open-source Mapbox GL fork, first-class TypeScript. | **Free** (lib; tiles may need a provider). | Low. | Nicer rendering; slightly more setup. |
| **Mapbox** | Premium vector maps, Studio styling. | Free ~50,000 loads/mo; token without card. | Low. | Fine, but adds a vendor token; only if you want custom styling and have time. |
| **Google Maps** | Familiar maps + Places. | Mar 2025 restructure removed the $200 credit; per-SKU free caps. | Low-medium (card). | Not recommended; costlier, card-gated. |
| **PostGIS** | PostgreSQL spatial extension: `GEOGRAPHY`/`GEOMETRY`, distance, nearest-neighbour (`<->`), bbox. | Free extension. **Supported on Neon & Supabase**; NOT on Railway/Render built-in Postgres by default. | Low on Neon/Supabase. | **Strong engineering signal** — "vessels within X nm of a port/field." Day-5 / stretch only. |

---

## 6. Shipping / offshore seed data

- **OSV specs & types** — PSV, AHTS, MPSV/CSV. Realistic fields: deck area (m²), bollard pull (t), DP class, deadweight (dwt), BHP, FiFi class, year built. Hand-author ~20–40 believable vessels (e.g. PSV deck ~764 m²; AHTS bollard pull 50–400 t).
- **Ports with lat/lng (free):**
  - **World Port Index (NGA Pub 150)** — free CSV (`UpdatedPub150.csv`), ~3,700 ports with lat/lng, depths, facilities. Public domain. Also on Kaggle/HDX.
  - **UN/LOCODE** — UNECE official download; 40,000+ codes. Free; CSV on GitHub and DataHub.
  - **Upply open seaports** — free CSV/XLSX, CC-BY 4.0, lat/lng, no account.
- **Real owners/charterers** (use real names for credibility):
  - **Owners/operators:** Tidewater (operated **208 vessels** per FY2025 10-K — 139 PSVs, 52 AHTS), Solstad (retained "40 high-end CSV and AHTS" after selling 37 PSVs to Tidewater in 2023), DOF, Havila, Island Offshore, SEACOR Marine, Maersk Supply Service.
  - **Charterers:** Equinor, BP, TotalEnergies, Ithaca Energy, INEOS, Shell, Aker BP, Petrobras (oil & gas); Ørsted, Vattenfall, ScottishPower Renewables, RWE (offshore wind).
- **IMO / MMSI** — IMO = 7-digit unique ship ID; MMSI = 9-digit AIS identifier. Both seed the vessel table.

**Realistic North Sea day-rate seed figures (2025/2026), CONFIRMED via named brokers:**
- **PSV (large, >900 m², North Sea spot):** averaged **GBP 7,134/day in March 2025** (vs GBP 7,182 a year earlier, −0.67% y-o-y); utilisation fell from 73% (Dec 2024) to 56% (Mar 2025) — Seabrokers via Riviera. Large modern PSV **term** contracts internationally reached **~US$36,000–40,000/day** (Fearnleys via Baird Maritime).
- **Large AHTS (>22,000 bhp) spot:** "up 24.34% y-o-y, averaging **GBP 56,798** in March 2025" (from GBP 45,681 in Mar 2024) — Seabrokers via Riviera. Early March 2025 saw spot fixtures as low as **GBP 15,000 / NOK 200,000**, then spikes above **GBP 150,000 / NOK 1.5m/day** to secure spot tonnage. Industry splits AHTS at the **22,000 bhp** threshold.
- Broader context: Clarksons **OSV Rate Index hit 190 points end-March 2025**, "68% above the 10-year average," while North Sea PSV rates remained "still 22% below mid-'24 highs."

> **Caveat:** day-rate figures are spot-market and volatile, for demo realism only. Cite ranges, attribute to the broker/source, and **do not present seeded data as live**.

**SUPPLYTIME 2017 recap fields (for the generator):** Vessel name | Owners | Charterer | Hire rate/day (Box 20) | Mob + Demob fee (Box 12) | Laycan/Delivery date & port (Boxes 5–7) | Redelivery port + notice (Box 8) | Period of hire (Box 9) | Area of Operation (Clause 6) | Bunkers on delivery & redelivery | Governing law/dispute resolution (Box 33). Knock-for-knock liability regime; mob fee payable on delivery.

---

## 7. Deployment & engineering-fundamentals stack

- **Vercel (Hobby)** — free, instant; ideal for the Next.js frontend. 100 GB bandwidth, 1M edge requests/mo, ~4h Active CPU/mo. **Non-commercial only**, hard-pauses at limits. Fine for a demo. (CONFIRMED)
- **Neon** ⭐ — serverless Postgres; free 0.5 GB + ~191 compute-hours/mo, scale-to-zero, instant branching, native Vercel integration, **supports PostGIS**. Best DB choice. (CONFIRMED)
- **Supabase** — Postgres + auth + storage + auto REST API; free 500 MB, pauses after 7 days idle; PostGIS out of the box. Good if you want bundled auth. (CONFIRMED)
- **Railway** — no permanent free tier; **$5 trial credit**, then Hobby $5/mo. Card required. Built-in Postgres (no PostGIS by default). (CONFIRMED)
- **Render** — genuine free tier (web + static + Postgres), **no card**; free web services cold-start (~1 min after 15 min idle). (CONFIRMED)
- **Fly.io** — no free tier for new users; card required. (CONFIRMED)
- **GitHub Actions** — **free/unlimited for public repos**; private repos get a monthly quota. Use a public repo → free CI. (CONFIRMED)

**Recommended architecture:** Next.js (App Router) + React + TS on Vercel · Node + TS REST API (Express or Next.js route handlers) with **Prisma** · **Neon** Postgres (+PostGIS) · optional **FastAPI** Python microservice (CSV seed parsing, recap text, match score), Dockerised · GitHub Actions CI (lint, typecheck, Vitest + pytest, preview deploy) · Dockerfile + docker-compose for local dev.

---

## 8. Recommendations (staged)

- **Stage 1 (Day 1 AM):** seeded data + ONE real API (Open-Meteo Marine). Seeded data = credible, controllable, zero live-demo risk. Open-Meteo = no key, no signup, no demo-day failure.
- **Stage 2 (Day 4, if ahead):** add AISStream.io for a live "vessels on the map" layer. **Threshold:** core CRUD + recap + tests already working and deployed. If behind, skip and seed positions.
- **Stage 3 (stretch only):** cached AIS-near-port queries via PostGIS. **Do NOT** pay for Datalastic or attempt MarineTraffic/Spire/Kpler — the sales cycle alone exceeds the timeline.

**What would change the recommendation:** if the role emphasised real-time data engineering, lead with AISStream.io ingestion. If the interviewer explicitly wanted live North Sea vessel data, invest the extra hour in BarentsWatch OAuth2.

**Best single integration: Open-Meteo Marine** — free, no key/signup, North Sea coverage at 5 km, returns exactly the workability variables, maps to a broker-relevant feature (workable laycan window).

---

## 9. Caveats

- **Pricing changes fast** — verify on each provider's page before relying. Datalastic entry price quoted inconsistently (€99 vs €199) — [LIKELY], confirm at signup.
- **AISStream.io is experimental and terrestrial** — drops connections ~every 2 min, no reliable mid-ocean satellite positions. Coastal North Sea demo only; handle reconnection.
- **Vercel Hobby is non-commercial only** and pauses at limits — fine for a portfolio demo, not a real product.
- **PostGIS is not default on Railway/Render built-in Postgres** — use Neon or Supabase for spatial queries.
- **BarentsWatch data is Norwegian-zone only**, NLOD-licensed (attribution). Norwegian-sector realism, not UK-sector.
- **Day-rate figures are volatile spot-market values** — demo realism only.
- **Do not present seeded data as live** — be explicit about seeded vs live in UI/README. Honest scoping > a fragile "everything is live" claim.

---

## 10. Key source links

- AISStream.io — https://aisstream.io/ · docs https://aisstream.io/documentation
- Open-Meteo Marine — https://open-meteo.com/en/docs/marine-weather-api
- Stormglass — https://stormglass.io/pricing/
- Datalastic — https://datalastic.com/pricing/
- VesselFinder API — https://api.vesselfinder.com/docs/
- MarineTraffic/Kpler (enterprise) — https://www.kpler.com/product/maritime/data-services
- BarentsWatch AIS — https://developer.barentswatch.no/docs/AIS/live-ais-api/ · https://www.kystverket.no/en/sea-transport-and-ports/ais/access-to-ais-data/
- AISHub — https://www.aishub.net/
- World Port Index (NGA) — https://msi.nga.mil/Publications/WPI · Kaggle https://www.kaggle.com/datasets/mexwell/world-port-index
- UN/LOCODE — https://unece.org/trade/cefact/UNLOCODE-Download · https://github.com/datasets/un-locode
- Upply open seaports — https://opendata.upply.com/seaports
- Leaflet — https://leafletjs.com/ · MapLibre — https://maplibre.org/ · Mapbox pricing — https://www.mapbox.com/pricing
- PostGIS on Neon — https://neon.com/docs/extensions/postgis · on Supabase — https://supabase.com/docs/guides/database/extensions/postgis
- Neon — https://neon.com/ · Supabase — https://supabase.com/ · Vercel pricing — https://vercel.com/pricing · Railway pricing — https://docs.railway.com/pricing/plans · Render — https://render.com/
- GitHub Actions billing — https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions
- BIMCO SUPPLYTIME 2017 — https://www.bimco.org/contractual-affairs/bimco-contracts/contracts/supplytime-2017/
- SSY Research / Offshore — https://www.ssyglobal.com/research · https://www.ssyglobal.com/services/offshore
- North Sea rate data (Seabrokers/Clarksons/Fearnleys via Riviera) — https://www.rivieramm.com/
