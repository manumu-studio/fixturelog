# SSY Offshore Broking — Knowledge Base

> **Purpose of this document.** This is the domain reference for the FixtureLog project. It explains what offshore shipbroking is, who SSY is, the vessels and contracts involved, and the day-to-day broker workflow — in plain English first, technical vocabulary second.
>
> **How to read the confidence tags.** Sources used a small set of tags that this document preserves:
> - **CONFIRMED** — supported by a named, public primary source.
> - **[LIKELY]** — strongly supported but the exact figure or detail varies by source.
> - **[INFERENCE]** — a reasonable conclusion drawn from the evidence, not a directly stated fact.
> - **[UNVERIFIED]** — public evidence was too thin to confirm; do not state as fact.
>
> This document is **synthesized from two research sources** (a tailored knowledge base and a 5-day-project domain study). Broken citation markers from the originals have been removed; real source URLs are kept. No new facts were invented.

---

## 1. Executive summary

SSY (Simpson Spence Young) is a long-established, privately owned shipbroking partnership that describes itself as **the world's largest independent shipbroker**. Its public material cites operating from around **28 offices** worldwide. Headcount figures vary by source (see caveat below). Its service lines include Dry Cargo, Tankers, Gas/LNG, Sale & Purchase, Derivatives, Chemicals, Towage, Ship Finance, Ship Recycling, Research, **Offshore**, and a newer dedicated **Rigs** business.

For the interview context, the key point is not just that SSY is a broker. It is that **SSY is actively building software for brokers and research teams** and is investing in digital tooling. The Full-Stack Developer role is focused on building and evolving an **Offshore Broking platform** using **React, TypeScript, Node.js, PostgreSQL and SQL Server**, in a hybrid London role, with strong emphasis on **AI-first thinking** and responsible use of tools such as Claude and Cursor, working closely with brokers to turn real workflows into software.

Offshore broking is a high-speed, relationship-heavy, data-heavy business. A broker must know which vessels are open, where they are, what they can do, what the market is paying, which enquiries are live, and what was fixed before under similar conditions. Useful maritime platforms (Signal Ocean, Veson, Sea/, Spinergie) all combine the same ingredients: **vessel/AIS data, position lists, fixtures, market rates, emails/messages, structured user input, contract workflows and analytics**. SSY is not hiring a generic full-stack developer — it is hiring someone to **reduce commercial friction in a workflow that is still fragmented across email, spreadsheets, messaging and specialist market data**.

> **🎯 The single strongest signal for FixtureLog (CONFIRMED).** SSY's public offshore site exposes a **dashboard built around four objects: Fixtures, Requirements, Positions, and a Live Weather Map.** This is not inferred product language — it is what SSY itself publicly shows. It means a fixture board + requirement tracking + position views + a real marine-weather map maps **directly** onto SSY's own offshore product vocabulary, and it is why a real weather integration (Open-Meteo Marine) is the highest-credibility "real API" choice. This finding drives the recommended build in `SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md`.

---

## 2. Who SSY is

**What they are.** SSY is the world's largest independent (privately owned) shipbroker, founded in 1880 by Ernest Simpson, Lewis Spence and Captain William Young. In 2024 it formally rebranded from "Simpson Spence Young" to "SSY," with a new identity and the **SSY Navigator** research portal.

**Leadership (public material).** Managing Partner: **Stanko Jekov**. Head of Offshore: **Frank Holck** (Dubai). Global Head of Research: **Dr Roar Adland**. First-ever CIO (appointed 2025): **Richard White** — a Clarksons veteran and co-founder of the **Sea/** chartering platform, where he was CTO. White's remit is firm-wide, **not** tied specifically to the offshore app. [INFERENCE]

**The offshore desk.** SSY's Offshore department describes itself as "a leading offshore shipbroker for the oil & gas and offshore wind industry," operating from dedicated offices in **Aberdeen, Dubai, Hamburg, Kristiansand and Oslo**, covering chartering, market intelligence & analysis, and sale & purchase (S&P) of offshore vessels.

**Offshore acquisitions timeline (CONFIRMED):**
- **Westshore Shipbrokers** (Kristiansand, Norway; founded 1987) — acquired 2023; SSY's first offshore move. A panel broker to Equinor for AHTS/PSV requirements, focused on the North Sea spot market. *(A 2025 dispute between SSY and Westshore's former MD is reported background only — do not lead with it.)*
- **F3 Offshore** (Hamburg & Dubai; founded 2009) — acquired July 2023; first brokerage to specialise in North Sea renewables.
- **Grieg Shipbrokers** (Oslo, Bergen, London; founded 1884) — agreed December 2025, effective January 2026.
- **Dedicated Rig business** — announced May 2025, led by Nicholas Wagner-Larsen, launched later in 2025.

**Digital strategy.** SSY appointed Richard White as first CIO in 2025. It also (a) partnered with and invested in **Signal Ocean** (co-developing the dry bulk module, 2018–2020), and (b) **co-founded Ocean Recap** in February 2025 with Arrow, Gibson, Howe Robinson and Ifchor Galbraiths. SSY co-founding a recap platform is the single most relevant signal for this project.

**The "SSY Offshore App" / offshore site (CONFIRMED structure).** SSY's offshore page links to the **SSY Offshore App** at ssyoffshore.com — a JavaScript single-page portal, the rebranded continuation of Westshore's digital offering. A separate research pass **confirmed the site exposes a dashboard with Fixtures, Requirements, Positions, and a Live Weather Map**, alongside market-intelligence content. *(The deeper live behaviour behind each tab — exact fields, real-time data sources — remains [UNVERIFIED]; one earlier pass could not get the portal to render.)* The desk publishes a weekly **SSY Offshore Spot Market Update**. An archived weekly report (16 August 2024) showed it contains: a **PSV Weekly Report (UK spot)** and **AHTS Weekly Report (Norway spot)**; a **fixtures table** (Date, Vessel, Charterer, Rate, Scope of Work, Period, Commencement); **"Last done" and "Average Last 5 Fixtures"** benchmarks; **day-rate charts**; and **vessel position lists**. [INFERENCE] This report structure is effectively a product spec for a demo.

> **Caveat — company size figures conflict across SSY's own materials. [LIKELY / partly UNVERIFIED]** Do **not** state a single number as fact:
> - Jekov (Lloyd's List, 2025): "from 370 to **around 550**" people, **28 offices**, 27 partners.
> - SSY website (one page): "**650+ experts**."
> - SSY official company overview (another page): "almost **145 years**," "**1,000+ specialists**," "**26 offices in 14 countries**."
>
> These don't reconcile cleanly (the 1,000+ figure may count a broader "maritime, trade, energy, financial markets" population than the broker headcount). **Safe interview phrasing:** "a ~145-year-old private partnership, the world's largest independent shipbroker, with on the order of 26–28 offices and several hundred to ~1,000 specialists depending on how you count." Always attribute and use a range. **Public revenue and market-listing data: [UNVERIFIED]** — not found in official sources.

---

## 3. The domain in plain English

**Shipbroking** is the business of matching someone who has a ship with someone who needs shipping capacity or vessel services. A **shipbroker** is an intermediary who matches a vessel **owner** (who has a ship to hire out) with a **charterer** (who needs a ship), negotiates the deal, and earns a **commission** (typically a small % of the hire). Brokers do not own ships or cargo.

A **fixture** is the concluded deal — the moment owner and charterer are bound. A **charterparty** is the formal contract between them, for the carriage of goods or the hire of the vessel in return for payment of freight or hire.

**Offshore broking** is similar in structure but different in the asset and the job. Instead of moving cargo from port A to port B, offshore brokers arrange specialised vessels and rigs that **service offshore energy** — oil & gas platforms/rigs and offshore wind farms. (It has nothing to do with "offshoring" labour.)

**How offshore differs from dry cargo and tanker broking:**
- **Pricing unit:** offshore vessels are hired on a **day-rate** (e.g. $25,000/day) under a **time charter**. Dry cargo and tankers are often fixed on voyage charters priced as freight ($/tonne) or Worldscale.
- **What's moved:** offshore is about *services* (supply runs, anchor handling, construction support, crew transfer), not bulk cargo.
- **Contract form:** offshore uses **SUPPLYTIME 2017**; dry/tanker use GENCON (voyage), NYPE (time charter), or tanker forms.
- **Specs that matter:** offshore cares about deck area, bollard pull, DP class, crane capacity, accommodation; dry/tanker care about deadweight, cargo capacity, draft, speed.
- **Geography:** offshore is intensely regional (North Sea, Brazil, US Gulf, West Africa, Middle East, SE Asia), with vessels migrating between regions chasing rates.

In plain terms, offshore brokers help answer: *Which vessel is open in the North Sea next week? Can it do this workscope? Is it DP-capable? Has it handled similar jobs before? What is the likely day-rate?* That is why the software challenge is so business-specific.

---

## 4. Offshore support vessels (OSVs) and rigs

> An **OSV (offshore support vessel)** is an umbrella term for specialised ships that supply, support and service offshore installations.

**Core OSV types:**
- **PSV — Platform Supply Vessel.** The workhorse (typically 50–100 m). Large flat open aft deck plus below-deck tanks, carrying cargo to/from platforms and rigs: drilling mud, cement, fuel, fresh water, methanol, provisions, deck cargo. Modern North Sea PSVs are DP2-class. *Spec a broker quotes:* clear deck area (e.g. >900 m²), deadweight, tank capacities.
- **AHTS — Anchor Handling Tug Supply.** A powerful multi-role vessel that handles anchors and mooring chains, **tows** rigs/platforms, and can do supply runs. *Defining spec:* **bollard pull** (static pulling force in tonnes; large North Sea anchor handlers run 150–300+ t BP) and winch capacity.
- **MPSV / CSV — Multi-Purpose / Construction Support Vessel.** The premium segment. Large open deck, big offshore cranes (often 100–400+ t), ROV launch systems, **DP2/DP3**, accommodation for 100+, used for subsea construction, installation, IMR (inspection/repair/maintenance) and well intervention. Commands the highest day-rates.
- **Other operational types:** ERRV (Emergency Response & Rescue Vessel), DSV (Dive Support Vessel — has a moon pool), cable-lay vessels, FSIV (Fast Supply Intervention Vessel), seismic survey ships.

**Offshore wind vessels:**
- **CTV — Crew Transfer Vessel.** Small, fast aluminium catamaran (~20–30 m) ferrying technicians from shore to turbines daily; operates in calmer seas (up to ~1.5–2 m wave height).
- **SOV — Service Operation Vessel ("walk-to-work").** A floating offshore base where technicians live for 2–4 weeks, with **motion-compensated gangways** for safe transfer in rougher seas. **CSOV** = commissioning SOV.

**Offshore drilling rigs (MODUs — Mobile Offshore Drilling Units):**
- **Jackup** — a platform with legs that "jack down" to rest on the seabed; for shallow water (≤~400 ft).
- **Semi-submersible** — a floating rig on submerged pontoons; for deep water; held by mooring or DP.
- **Drillship** — a ship-shaped vessel with a derrick and moonpool, DP2/DP3, for deep/ultra-deep water.

**Key specs brokers care about (these become data-model fields):** deck area / clear deck (m²); deadweight (DWT, t); **bollard pull** (t, for AHTS); BHP (engine power); **DP class (DP1/DP2/DP3)**; accommodation / berths; crane capacity (t); build year, flag, classification society (DNV, Lloyd's Register, ABS), FiFi (firefighting) class, winterisation.

> **DP (Dynamic Positioning)** is a computer-controlled system that holds a vessel's position using thrusters instead of anchors. **DP1** = no redundancy; **DP2** = redundancy so a single fault doesn't lose position; **DP3** = DP2 plus physical separation (fire/flood in one compartment won't disable it). DP2 is the norm for North Sea PSVs; DP3 for the highest-risk drilling/dive work.

---

## 5. The fixture workflow

> A **fixture** is a concluded charter deal — the moment owner and charterer are bound. "To fix a vessel" = to conclude the charter.

A practical offshore workflow, simplified for software design:

1. **Enquiry / requirement.** A charterer needs a vessel: e.g. "PSV, min 900 m² deck, DP2, for a 3-well drilling campaign offshore Aberdeen, commencing 1 July." Brokers usually receive this via email, calls, chat or internal channels.
2. **Position / tonnage list.** The broker consults the **position list** (a.k.a. **tonnage list**) — the live list of vessels that are **open** (available), each with open date, open port/region and specs. Matching availability to the requirement is the core analytical task.
   > **"Open"** = available for new work. A vessel's **"position"** = where it is and when it becomes free.
3. **Circulation & matching.** Broker circulates suitable candidates to the charterer and the requirement to owners. In offshore, matching is **capability-plus-timing**, not just name or location search.
4. **Negotiation.** Exchange of **firm offers** and **counters**:
   - A **firm offer** is time-limited and definite ("firm for reply 0900 London Tuesday"). A broker must not float the same vessel on two firm offers at once.
   - A **counter** amends terms; any counter can be accepted, countered again, or declined. Each counter kills the previous offer.
5. **Fix on subs → lift subs → clean fixed.**
   - Once main commercial terms agree, the vessel is fixed **"on subs"** (subject to conditions — e.g. "subject to charterers' board approval," "subject stem"). While subjects are live, either party can still walk away.
   - When all subjects are declared/satisfied ("lifted"), the deal is **"clean fixed"** — a binding contract.
   > **Legal note:** under English law there is no contract until all subs are lifted; US law historically treats main-terms agreement as binding — a real difference worth knowing.
6. **Recap.** The brokers issue the agreed-terms summary.
7. **Charterparty.** The formal contract is drawn up and signed; then the fixture is executed (delivery, redelivery, off-hire, documentation, billing, commissions, later analytics).

**Spot vs term.** A **spot** fixture is short-term/single-job (one rig move, a few supply runs); the spot market reprices daily. A **term/period** charter is longer (months to years) at a fixed day-rate. North Sea brokers quote both.

**Domain rule for software:** status is **not** a simple open/closed flag. A realistic model needs at least `ENQUIRY → ON_SUBS → CLEAN_FIXED → FAILED → COMPLETED`, with subjects tracked while on subs.

---

## 6. Charterparty / recap detail

> A **charterparty (C/P)** is the contract between owner and charterer. Standard forms save everyone re-drafting from scratch.

**Standard forms:**
- **SUPPLYTIME 2017** — BIMCO's standard **time charter party for offshore support vessels**; the offshore industry standard (first published 1975; revised 1989, 2005, 2017). Built around a **knock-for-knock** liability regime: each party bears loss/damage to its own people and property regardless of fault — so insurers settle rather than parties litigating. The 2017 edition simplified knock-for-knock and added sanctions, anti-corruption, infectious-disease and MLC 2006 clauses. **Maintenance days** (days the owner may take the vessel off for maintenance) are a SUPPLYTIME-specific feature.
- **BIMCO** — the Baltic and International Maritime Council, which publishes standard maritime contracts and clauses (including TOWCON/TOWHIRE for towage, WINDTIME for wind CTVs), and promotes digital contract workflows (SmartCon). Creating contracts since 1905.
- **GENCON** — BIMCO's general-purpose voyage charter (dry cargo). **NYPE** — the New York Produce Exchange time charter form (dry cargo).

> A **recap (recapitulation)** is the message the brokers send both parties summarising every agreed term once a deal is fixed. It is the operative record of the deal — what people actually work from — usually built before the full charterparty. Disputes are litigated on the recap's wording, so getting it right matters. *(The neat one-line definition is [INFERENCE] from the sources, but the recap's existence and commercial importance is well supported.)*

**Main terms an offshore recap captures:** hire / **day-rate** ($/day); **mobilisation / demobilisation** ("mob/demob") fees; charter period / duration; commencement / delivery and redelivery; **off-hire** (periods the vessel isn't earning); fuel / bunkers accounting on delivery/redelivery; area / workscope; knock-for-knock, insurance, special clauses. *(Dry/tanker recaps add laytime/demurrage, which is largely irrelevant to OSV time charters.)*

**SUPPLYTIME 2017 recap fields (useful for a recap generator):** Vessel name | Owners | Charterer | Hire rate/day (Box 20) | Mobilisation + Demobilisation fee (Box 12) | Laycan/Delivery date & port (Boxes 5–7) | Redelivery port + notice (Box 8) | Period of hire (Box 9) | Area of Operation (Clause 6) | Bunkers on delivery & redelivery | Governing law/dispute resolution (Box 33).

**How recaps are created today:** overwhelmingly by hand — copy-pasting a previous recap into email or Word, editing terms, and sending. This is exactly the manual pain that Sea/ and Ocean Recap target.

---

## 7. Day-rate pricing

Offshore vessels are priced as **day-rates** ($/day) under time charters, not voyage freight. Drivers:
- **Supply/demand & utilisation** — the dominant driver. High marketed utilisation (mid-80s%+) → rates spike; idle vessels → rates collapse toward operating cost ("opex rates").
- **Region** — the same vessel earns very different rates in the North Sea vs Brazil vs West Africa.
- **Vessel spec** — deck area, bollard pull, DP class, age, fuel efficiency. High-spec modern tonnage earns a premium; old tonnage gets cold-stacked.
- **Season** — North Sea summers typically lift rates.

**Market context (2025–2026), presented as reported figures, not fact:**
- After all-time highs in 2023–24, the market softened through 2025. Per Riviera/Offshore Support Journal (Dec 2025), the **Clarksons Offshore Index** stood at **108 points** at end-November, **down ~11% on the mid-2024 peak**.
- Clarksons' narrower **OSV Rate Index** was **~189 points**, down ~5% on mid-2024 highs — still roughly double the 2020 low.
- **Orderbook is structurally low** (~3.3% of the global fleet). Westwood reported 2025 marketed utilisation averaging **~76%**.
- **Term PSV (>900 m²)** rates were around **US$29,000/day** at end-November 2025.
- The **North Sea was the weakest region**; Brazil, the Middle East and SE Asia were more resilient.
- 2026 outlook is broadly "soft/flat early, hopeful for H2" (a **forecast**, not fact).

> **Caveat — market figures are volatile and region-specific.** Cite ranges, not precise single numbers. North Sea spot AHTS briefly touched $60,000–70,000/day in tight 2023–24 periods; spot PSVs fell below operating cost in oversupplied 2025 months. See `SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md` for specific seed-data figures with named broker sources.

**How brokers benchmark:** they track "last done" fixtures and rolling averages ("average last 5 fixtures"), by region and vessel class — exactly what SSY's weekly report tabulates.

---

## 8. Vessel positions and AIS

> **AIS (Automatic Identification System)** is a transponder system ships broadcast: identity (MMSI/IMO, name), position (lat/long), course, speed, navigation status. It was designed for **collision avoidance, not market intelligence** — an important caveat.

**How brokers use it:** to see where vessels actually are, estimate when a vessel will be "open," validate owners' claimed positions, and reconstruct fixtures (a PSV sitting at a platform implies it's on contract). AIS feeds position lists and tools like Signal Ocean, Kpler, Spinergie, MarineTraffic.

**Limitations (be honest in interview):**
- **Gaps/coverage:** terrestrial AIS only reaches ~50 km from shore; open ocean relies on slower satellite passes; dense areas saturate receivers.
- **Going dark:** a vessel can switch off its transponder.
- **Spoofing:** broadcasting false position/identity (relevant mostly to sanctions, but shows AIS isn't ground truth).
- **Stale data:** the last known position persists until a new signal arrives.
- **Human error:** destination/ETA fields are manually entered and often wrong.

> [INFERENCE] **For a demo you should not integrate live AIS.** Instead, model a `lastKnownPosition` field, seed it, and *talk* about how AIS would feed it in production and where AIS lies to you. This is the credible, scoped choice. See the technical-decision research for the API analysis behind this.

---

## 9. Current broker workflows — the manual reality

Brokers largely run on **Excel, email/WhatsApp, and internal tools.** Position lists are spreadsheets manually updated from owner emails and AIS. Requirements arrive by email. Recaps are copy-pasted and hand-edited. Fixture history lives in inboxes and personal spreadsheets, not a searchable central database. A 2025 Splash247 interview put it bluntly: "Chartering in 2025 is still astonishingly manual."

**Pain points:** scattered data (no single source of truth); manual, error-prone position lists; manual recaps with weak version control; no central searchable fixture history for benchmarking; knowledge trapped in individual brokers' heads.

**Why digitisation is hard:** broking is **relationship-driven** ("my word is my bond") and brokers fear disintermediation; data is **confidential and commercially sensitive** (owners/charterers don't want rivals seeing their rates — which is why Ocean Recap markets itself as a neutral "data safe haven"); and the market is **fragmented** across regions, vessel types and bespoke terms. Winning tools "augment the status quo, not undercut it."

---

## 10. Competitive software landscape

- **Ocean Recap** (launched Feb 2025) — a recap & charterparty management platform **co-founded by SSY** with Arrow, Gibson, Howe Robinson and Ifchor Galbraiths, built with Signal Ocean. Created as a neutral alternative to Clarksons-backed Sea/, to avoid a recap "data-oligopoly." CEO: Jeroen Wolthuis. **This is the single most relevant reference point for FixtureLog — SSY literally co-built a recap platform.**
- **Sea/ by Maritech** — the dominant recap/C-P platform, owned by Clarksons. Modules: Sea/contracts (recap & C/P with templates, version control, approval workflows, audit trail), Sea/net (AIS), Sea/calc, Sea/gateway, Sea/futures. Richard White (now SSY CIO) co-founded it.
- **Signal Ocean** (founded ~2014–2016; CEO Ioannis Martinos) — chartering analytics SaaS combining AIS, tonnage lists, cargo lists, fixtures and rates with AI. Publicly cites processing **80,000+ emails daily**, tracking **4.3M+ voyages**, serving **250+ client companies**. SSY invested in it. Signal Ocean **acquired AXSMarine** (2025).
- **Veson Nautical** — owns **IMOS** (the dominant post-fixture/voyage-management ERP), **Position List** (broker tonnage lists with AIS), and **Shipfix** (AI email parsing into structured market screens).
- **Kpler** — chartering suite (tonnage/cargo lists, fixtures, voyage calculators, email parsing, live maps); strong AIS. Acquired MarineTraffic and FleetMon (2023) and Spire Maritime (2025).
- **Spinergie** — **offshore-focused** market intelligence; tracks 14,000+ vessels, layers charters/work-packages/activities onto AIS. The closest analytics analogue to what an SSY offshore platform would need.

**The gap:** no single tool dominates *offshore* the way Sea/ dominates dry/tanker recaps. Offshore is comparatively under-served — that is the opening.

**Lesson for FixtureLog:** the product philosophy across all of these is the same — *pull messy operational data into a unified, structured workflow* (vessel/tonnage DB + position list + fixture records + recap generation + rate benchmarking).

---

## 11. What an offshore broking platform needs to do

**Core features:**
- Vessel/tonnage management (fleet database with offshore specs).
- Position list (open dates, open ports, status) — filterable/sortable.
- Requirement/order list (charterer needs).
- Vessel↔requirement matching (filter by spec + availability).
- Fixture capture (record concluded deals).
- Recap generation (produce the agreed-terms summary from a fixture).
- Day-rate benchmarking ("last done," rolling averages by class/region).
- Fixture history search.
- Analytics/reporting (utilisation, rate trends — the weekly report).
- **AI support with strong controls** — drafting, summarizing and structuring are good AI use cases; silent factual invention is not. The product must make human review explicit.

**Likely data-model entities:** `Vessel`, `Owner`, `Charterer`, `Requirement`, `Fixture`, `Recap`, `Region`, `Workscope`, `Status`, `Position`. *(Concrete TypeScript models live in `SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md`.)*

---

## 12. Source URLs (kept from research)

- BIMCO SUPPLYTIME 2017 — https://www.bimco.org/contractual-affairs/bimco-contracts/contracts/supplytime-2017/
- SSY Research / Offshore — https://www.ssyglobal.com/research · https://www.ssyglobal.com/services/offshore
- North Sea rate data (Seabrokers/Clarksons/Fearnleys via Riviera) — https://www.rivieramm.com/
- Baltic Exchange — chartering, negotiations, fixtures, FFAs, vessel types (public guides)
- Signal Ocean (platform) · Veson · Sea/ by Maritech · Spinergie · Kpler — vendor product pages

---

## 13. Open questions and limitations

- **SSY revenue, exact development-team size, and current product details of Ocean Recap / Sea/ / Veson / AXSMarine** were not confirmed to high confidence. Treat as open questions; do not bluff specifics.
- The **live feature set of the SSY Offshore App (ssyoffshore.com)** could not be confirmed — the portal didn't render. Described content is [INFERENCE] from its Westshore lineage and the published weekly report. Treat specifics as **[UNVERIFIED]**.
- **Headcount** varies by source (~550–650 staff). Attribute and use a range.
- **Market/day-rate figures** are reported/forecast values, late 2025/early 2026, volatile and region-specific — cite ranges and flag the H2-2026 "take off" view as a forecast.
