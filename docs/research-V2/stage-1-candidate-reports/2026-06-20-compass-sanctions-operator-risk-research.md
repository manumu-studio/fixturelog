# FixtureLog Sanctions / Operator-Risk Screening — Web Research Brief
*Offshore (OSV) shipbroking enquiry-to-fixture workflow. Prepared for Manu. Current as of 20 June 2026.*

## 1. Executive Summary

Sanctions / operator-risk screening is the single highest-value next feature for FixtureLog, and the research validates it as both real daily brokerage work and a genuine product gap that maps cleanly onto FixtureLog's existing entities. The recommendation is **RIGHT, BUT REFOCUS**: build a thin, deterministic screening slice — screen the owner, charterer, operator and vessel-by-IMO against free government lists plus the open-source OpenSanctions dataset, attach a CLEAR / REVIEW / BLOCKED status to requirements and fixtures, gate the ENQUIRY and pre-FIXED transitions, and store an immutable screening-result audit trail — rather than trying to replicate a behavioural maritime-intelligence platform (AIS spoofing, dark-fleet detection) that incumbents already own.

Three findings drive the design:
- **The data is free, structured, and self-hostable.** OFAC (SDN + Consolidated), the UK Sanctions List, the EU consolidated list, and the UN consolidated list all publish machine-readable downloads (CSV/XML/JSON), and OpenSanctions aggregates all of them — including a dedicated maritime/IMO export — under an open-source matching engine (`yente`, MIT-licensed) that runs in Docker against Postgres/Elasticsearch. A small Next.js/Postgres demo can self-host credible screening with zero list-licensing cost for non-commercial use.
- **Screening belongs early and must be re-checked.** OFAC's own maritime guidance tells charterers and shipbrokers to conduct "Know Your Vessel" (KYV) diligence covering the vessel, registered owner, operator, ultimate beneficial owner and ship manager. Sea/ (Maritech) and the Wolfsberg Group both confirm screening should be front-run to the start of the negotiation and re-screened before subjects are lifted, because lists change without notice.
- **OSV-specific designations are real.** OFAC has designated Russia-flagged vessels explicitly labelled "Offshore Support Vessel" and "Offshore Tug," plus their operators — so the OSV desk is squarely in scope, not a theoretical edge case.

The AI boundary holds cleanly: screening is a deterministic database/list-match gate; the copilot may only explain stored, sourced screening evidence and must refuse to invent or conclude sanctions status.

## 2. Sanctions / Risk Sources Table

| Source | Jurisdiction | Covers | Access method | Update cadence | Fit for FixtureLog | Caveats | Confidence |
|---|---|---|---|---|---|---|---|
| **OFAC SDN List** (Sanctions List Service) | US | Individuals, entities, **and vessels (with IMO numbers) and aircraft** | Bulk download CSV / fixed-field / XML / JSON via SLS; delta files; email subscription; search UI (fuzzy-logic name search) | "OFAC can add new entries to the SDN List at any time, often with little or no advance notice"; real-time, no fixed timetable (Terms.Law OFAC screening guide; ofac.treasury.gov) | **High** — primary list; vessel-by-IMO designations present; relational-DB friendly | SLS is a data-distribution service, not a matching engine — you build the fuzzy match/scoring yourself | CONFIRMED |
| **OFAC Consolidated (non-SDN) List** | US | Non-SDN programs (FSE, SSI, NS-MBS, NS-CMIC, etc.) | Same SLS bulk files (consolidated data file), JSON via OpenSanctions | Daily / as published | Medium — secondary but cheap to include | Records may also appear on SDN; less central for OSV chartering | CONFIRMED |
| **UK Sanctions List (FCDO)** | UK | Individuals, entities **and ships ("specified ships")** under SAMLA | Downloads in XML, HTML, ODT/ODS, CSV, PDF, TXT; search UI with fuzzy logic | As designations change | **High** — UK/North Sea relevance; includes ship designations | **The OFSI Consolidated List closed 28 Jan 2026 — the UK Sanctions List is now the single source.** Any feed keyed to the old OFSI list is stale | CONFIRMED |
| **EU Consolidated Financial Sanctions List (CFSP / FISMA)** | EU | Persons, groups, entities; **separate "Consolidated list of designated vessels"** (e.g. Russia Annex XLII shadow-fleet ships) | Downloadable formats via DG FISMA web service + data.europa.eu; PDF; EU Sanctions Map; EU sanctions tracker | As adopted (Official Journal) | **High** — designated-vessel list directly relevant | Login/registration historically needed for some FISMA formats; vessel list is a separate Annex, not always in the financial-sanctions file | CONFIRMED |
| **UN Security Council Consolidated List** | UN (global) | Individuals + entities; **1718 (DPRK) Designated Vessels List** for vessels | XML, HTML, PDF downloads; search UI | As committees decide (irregular) | Medium — foundational, but few vessels and rarely the binding constraint for North Sea OSV | Vessel coverage thin; mostly DPRK; entity/person-level otherwise | CONFIRMED |
| **OpenSanctions** (aggregator) | Global (integrates 374 sources per its homepage, accessed June 2026 — OFAC, UK, EU, UN + PEPs & criminal-interest data) | Persons, entities, **vessels**; PEPs; dedicated **maritime/IMO CSV export** | REST API (hosted), bulk data (CSV/JSON, no login for non-commercial), **self-hosted `yente` (MIT) in Docker** | Bulk released ≥ once daily, usually several times/day; self-host checks every 30 min | **Best fit for the demo** — one normalized schema (FollowTheMoney), `Vessel` schema, IMO export, self-hostable next to Postgres | **Free for non-commercial only; businesses need a paid bulk-data licence.** Vessel dataset is comparatively small — Bellingcat's toolkit notes the vessels database has "just over 2,000 entries" and advises using other tools alongside it; government lists remain authoritative | CONFIRMED |
| **EU Sanctions Map / EU sanctions tracker** | EU | Regimes, designated vessels, narrative | Web UI; data.europa.eu | As adopted | Low/Medium — reference + designated-vessel list | UI-oriented; use FISMA/OpenSanctions for machine data | CONFIRMED |
| **OFAC maritime advisories** (May 2020 global advisory; Oct 2024 scenario guidance; 2025 updates) | US (guidance, not a list) | Best practices, red flags, deceptive shipping practices (DSPs) | PDF documents | Periodic | High as a **design spec** for *what* and *when* to screen | Not machine-readable list data; guidance not law | CONFIRMED |
| **Commercial free-ish vessel lists** (e.g. TankerTrackers sanctioned-tanker list) | NGO/commercial | Sanctioned tankers (~1,345+) | Public API + CSV download | Daily | Low for OSV (tanker-focused) | Not authoritative; tanker bias; check terms | LIKELY |

## 3. What Brokers Should Screen

OFAC's maritime guidance is explicit that diligence must extend beyond the customer ("KYC") to the vessel ("KYV"), and names the parties to screen. Per the October 2024 OFAC maritime guidance and the December 2023 update, parties should research "not only … companies and individuals, but also the vessels, vessel owners, the ultimate beneficial owner or group ultimate owners, and operators." For each fixture, the screenable parties are:

- **Vessel — by IMO number (primary identifier).** The Wolfsberg Group and Pole Star both stress IMO-number screening because a vessel's name, flag and MMSI can change but its IMO number is permanent. FixtureLog already stores `Vessel.imo` and `Vessel.mmsi`. [CONFIRMED]
- **Registered owner** (FixtureLog has `Owner.name`, `Owner.country`).
- **Operator / disponent owner** — *distinct from registered owner.* This is the gap Joe at SSY described ("we may have dealt with a certain operator before … next thing they're on a sanctions list"). FixtureLog does not yet model a distinct operator.
- **Charterer** (FixtureLog has `Charterer.name`).
- **Ship/technical manager** — named in OFAC guidance; not yet modelled.
- **Beneficial owner / ultimate beneficial owner** — required by the **OFAC 50% Rule**: an entity owned 50%+ (directly, indirectly, or in aggregate) by one or more blocked persons is itself blocked even if not named on any list. This is why name-only screening is insufficient — much sanctioned exposure arises through ownership/control links rather than explicit listing, and regulators expect ownership tracing, not just list matching. [CONFIRMED — OFAC FAQ 398; Kharon; ComplyAdvantage]
- **Flag state** — high-risk / frequently-changed flags are an OFAC red flag; flag is also screened against country-sanctions lists.
- **Port / country** — port calls in sanctioned jurisdictions.
- **Cargo / project counterparty** — relevant where the offshore project counterparty is itself exposed.

**List-level vs vessel-level designations (key technical point):** OFAC SDN, the UK Sanctions List, and the EU list all publish **vessel-level (IMO) designations**; the UN publishes a vessel list mainly via the 1718 (DPRK) regime. The UN consolidated list and the OFAC Consolidated (non-SDN) list are largely entity/person-level. So vessel-by-IMO screening is available for free from OFAC, UK and EU directly, and aggregated (with an IMO export) by OpenSanctions. [CONFIRMED]

## 4. Broker Workflow Map

Real maritime practice (OFAC guidance + Sea/ Clearance Manager + Wolfsberg) sequences screening as an early, repeated, gating control — not a one-off check after the deal is done. Sea/'s own rationale: *"Traditionally, organizations negotiate ships, end up with a target vessel, and only when they have concluded the main negotiation terms do they then think about screening … so significant time can be spent only to realize that the vessel is not suitable. That's why we wanted to front-run sanctions in the process."* [CONFIRMED — windward.ai/blog]

Mapping onto FixtureLog's lifecycle:

**Requirement: ENQUIRY → SHORTLISTED → NEGOTIATING → ON_SUBS → FIXED → LOST**
- **First screen at ENQUIRY / SHORTLISTED** — screen owner, operator, charterer and each candidate vessel-by-IMO as soon as they enter the shortlist, to avoid wasting negotiation effort on an unfixable counterparty (the Sea/ "front-running" rationale).
- **NEGOTIATING** — re-screen on any change of counterparty or vessel substitution.
- **ON_SUBS** — screening status must be part of "subjects." Sea/ explicitly triggers screening/approval when a recap moves on subs and blocks lifting subjects until clearances are met. [CONFIRMED — sea.live/Clearance Manager]
- **Hard re-check immediately before FIXED** — a clean party can be designated mid-negotiation; re-screen before the fixture is confirmed.

**Fixture: DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED/FAILED**
- DRAFT/NEGOTIATING: inherit/refresh requirement-level screening.
- **FIXED gate:** the FIXED transition is the natural hard stop — do not allow promotion to FIXED while any party is BLOCKED or has a stale/unresolved screening result.

**What blocks vs warns:**
- **Hard BLOCK (deterministic gate):** an exact/high-confidence match to a designated person, entity or vessel-IMO on OFAC SDN / UK / EU / UN. Block the ON_SUBS→FIXED and FIXED transitions; require explicit human compliance action to proceed (and ideally make a true match non-overridable in the demo).
- **WARN / REVIEW (allow human review):** fuzzy/partial name match, ownership within reach of the 50% rule but unconfirmed, high-risk flag, near-threshold beneficial-ownership, or a stale result. Routed to a review state, not auto-blocked.

**Audit evidence to store (per screen):** who/what was screened, the exact query, which lists + list versions/dates, the match score, the match decision (clear/review/block), the reviewing broker, timestamp, and the cited source record. OFAC's enforcement posture is strict-liability, so a defensible, timestamped, immutable trail is the point. [CONFIRMED — OFAC enforcement context, Seward & Kissel]

**Staleness / re-screen cadence (TTL):** The Wolfsberg Group is the authoritative anchor: *"screening should be done when establishing a new relationship … and then at regular intervals, either upon a trigger event or as customer and/or list information changes … Where either internal or external data sets change frequently, periodic screening may be as often as daily."* (Wolfsberg Sanctions Screening Guidance, §4.3). OFAC adds new SDN entries "at any time, often with little or no advance notice," so a monthly batch can leave a gap of up to ~30 days. Practical rule for FixtureLog: treat a screening result as fresh for a short, configurable TTL (e.g. re-screen on each material event and before FIXED, plus a periodic refresh); flag any result older than the TTL as STALE → REVIEW. [CONFIRMED]

## 5. Competitor / Platform Scan

| Platform | Sanctions-screening capability | Classification | Notes / source |
|---|---|---|---|
| **Sea/ (Maritech)** | "Vessel Compliance Management" + "Clearance Manager": auto-triggers sanctions/ownership/PSC/KYC screening from the recap as fixtures progress; blocks lifting subjects until clearances met; full audit trail. Integrates third-party screening (PurpleTRAC, Windward) rather than owning the data. | **Table-stakes (for chartering-workflow tools) — and the closest analogue to FixtureLog's target** | Strongest signal: a chartering-workflow product (not a data vendor) treats screening as core. FixtureLog is doing the right thing, but for OSV. |
| **Veson Nautical (IMOS / IMOS X / Veson IQ)** | Markets "simplifying compliance" and regulatory workflow; partners/integrates for geopolitical sanctions rather than shipping a native list-screening engine; sanctions handled via Veson Partner Network integrations. | **Table-stakes intent, integration-based** | Public material emphasises emissions/EU ETS/CII; sanctions screening appears integration-led, not a native module. |
| **Lloyd's List Intelligence Seasearcher (Risk & Compliance)** | Native vessel screening, sanctioned-owner discovery up to seven ownership layers, behavioural/dark-shipping risk. | **Table-stakes (for compliance/data tools)** | Data-vendor side; a screening source FixtureLog could cite, not compete with. |
| **Pole Star PurpleTRAC** | Per the Association of Certified Sanctions Specialists' Pole Star page, screens vessel-by-IMO + ownership/management + flag + PSC history "against over 1,800+ sanctions watchlists across more than 90 jurisdictions globally"; Pole Star states "Within 30 seconds, PurpleTRAC screens a vessel's IMO number, ownership, management, flag, and port state control history," with data from alliance partner Dow Jones Risk and Compliance; tamper-proof audit records. | **Table-stakes (sanctions-vendor)** | The category-defining maritime screening engine; integrated into Sea/. |
| **Kpler (incl. MarineTraffic)** | Risk & Compliance: screen vessels/owners/cargo vs OFAC/OFSI/EU; flag risk, AIS gaps, dark STS, sanctioned port calls; daily updates. | **Table-stakes (data/intelligence)** | Behavioural + list screening fused with AIS. |
| **Windward** | Maritime-AI behavioural screening; its Risk & Compliance page states it delivers "predictive insights that flag 99% of sanctioned vessels before their official designation" (a 2025 review cites 99%+, and an EU 17th-package analysis 99.5%); go/no-go outputs; ownership up to 7 layers; explainable summaries (MAI Expert). Partners with Sea/. | **Novel integration (behavioural/predictive)** | The behavioural-prediction frontier — explicitly out of scope for FixtureLog. |
| **S&P Global Maritime Intelligence Risk Suite (MIRS)** | 600+ data fields on 200,000+ ships; compliance screening view vs current/historical status; OFAC sanctioned-country call monitoring; seven owner/operator/commercial roles. | **Table-stakes (data vendor)** | S&P also manages the IMO numbering scheme. |
| **Signal Ocean** | Charterer/broker/owner toolbox emphasising market analytics, AIS, fixtures; **no prominent public native sanctions-screening module surfaced.** | **Unclear / not publicly visible** | Could not confirm a dedicated sanctions-screening feature from public pages. |
| **Shipfix** | Chartering data/communications platform. **No public sanctions-screening capability surfaced.** | **Unclear / not publicly visible** | Not confirmed publicly. |

**Read:** Sanctions screening is **table-stakes** for serious chartering-workflow and maritime-intelligence platforms, but it is delivered either by specialist data vendors (PurpleTRAC, Lloyd's List, Kpler, MIRS, Windward) or by workflow tools that *integrate* those vendors (Sea/, Veson). What is **rare** is a self-contained, free-data, deterministic screening slice embedded natively in an *offshore/OSV* broking workflow with a grounded copilot — that is FixtureLog's defensible, demonstrable niche.

## 6. Recommended FixtureLog Feature

Build the **smallest credible deterministic screening slice**, scoped to impress SSY without overbuilding:

**Screen first (in priority order):** (1) **Vessel by IMO** — the highest-signal, OSV-relevant check and the one incumbents treat as primary; (2) **Owner**; (3) **Operator** (new entity — directly answers Joe's interview point); (4) **Charterer**. Defer beneficial-owner graph traversal, ship-manager, port and cargo-counterparty to a documented "next" phase.

**Data source for the demo:** self-host **OpenSanctions `yente`** (MIT, Docker) for one normalized API across OFAC/UK/EU/UN + the maritime/IMO export, with a clear note that production commercial use requires either direct ingestion of the free government files or an OpenSanctions bulk-data licence. This gives a working multi-list, IMO-capable screen at zero licence cost for a non-commercial demo.

**Risk statuses (deterministic):** `CLEAR` / `REVIEW` / `BLOCKED` (plus `STALE` → forces REVIEW). Exact/high-confidence designated match ⇒ BLOCKED; fuzzy/ownership/flag/near-threshold ⇒ REVIEW; no hit within TTL ⇒ CLEAR.

**Where it appears:**
- A screening status badge on each vessel, owner, operator and charterer in the broker dashboard and requirement/fixture detail views.
- A screening panel on the requirement (screen at ENQUIRY/SHORTLIST) and on the fixture (re-check before FIXED).
- A blocking gate on the ON_SUBS→FIXED (fixture) and FIXED (requirement) transitions when any party is BLOCKED or STALE.

**Broker review / override:** REVIEW states require a named broker to record a decision + rationale; BLOCKED true-matches should be non-overridable in the demo (or require a separate, logged compliance role) to demonstrate the "deterministic gate, not model judgment" principle.

**Audit trail:** every screen writes an immutable `ScreeningResult` and every status change writes to a compliance-case/review log (mirroring the existing `FixtureStatusChange` pattern), capturing lists+versions, scores, decision, reviewer and timestamp.

## 7. Data / Model Implications

New/changed entities (additive to the existing 15-model domain):

- **`Operator`** — distinct from `Owner` (name, country, optional link to Owner/manager). Directly addresses the interview evidence. Link `Fixture`/`Requirement` to an operator.
- **`ScreeningResult`** — the core new entity: `subjectType` (VESSEL/OWNER/OPERATOR/CHARTERER), `subjectId`, `query`, `listsChecked` + list version/date, `matchScore`, `status` (CLEAR/REVIEW/BLOCKED/STALE), `matchedRecordRef` (source URL/ID), `screenedAt`, `screenedBy`, `ttlExpiresAt`. Immutable; new screen = new row.
- **`ComplianceCase` / `ScreeningReview`** — opened when status is REVIEW/BLOCKED; holds reviewer decision, rationale, outcome, timestamps (mirrors `FixtureStatusChange` audit pattern).
- **Fields to add to existing entities:** `Vessel.flagState`; `Owner`/new `BeneficialOwner` optional link + `ownershipPercent` (to support a future 50%-rule view); `Vessel.shipManager` (optional, can be a later phase); a denormalized `screeningStatus` on Vessel/Owner/Operator/Charterer for fast dashboard rendering (source of truth remains `ScreeningResult`).
- **`FlagRisk` / country-risk** reference table (optional) for flag/port high-risk lookups.

Keep the database as the source of truth; screening writes are deterministic tool outputs, never model outputs.

## 8. AI / Copilot Implications

Within the stated AI boundary ("deterministic screening + sourced explanations + human review"):

**The copilot MAY:**
- Explain *why* a party is flagged by reading back stored `ScreeningResult` evidence — e.g. "Vessel X (IMO …) matched OFAC SDN entry [cited record], listed [date]; status BLOCKED by deterministic gate."
- Summarize the screening state of a requirement/fixture and what remains to clear.
- Point the broker to the source list record and the review action required.
- Surface the re-screen/TTL status ("last screened 9 days ago; stale, re-screen before FIXED").

**The copilot MUST refuse / must NOT:**
- Invent, infer or "conclude" a sanctions status not present in stored screening evidence.
- Override or clear a BLOCKED gate, or approve a mutating action (FIXED promotion) — those stay human-approved.
- Give legal advice or interpret whether a designation "really" applies.
- Make beneficial-ownership/50%-rule determinations autonomously — it may show stored ownership data and flag "below/near threshold — human review," but the determination is a deterministic rule + human review.

**What stays deterministic (not model judgment):** the list match, the score threshold, the CLEAR/REVIEW/BLOCKED assignment, the TTL/staleness rule, and the transition gates. High-risk decisions are gates or review states, never free-form model output.

## 9. Risks and Unknowns

- **Matching quality / false positives.** Name screening generates false positives; IMO-number screening is far cleaner. The demo should lean on IMO for vessels and a tunable score threshold for names, and be honest that production-grade fuzzy matching is non-trivial. [CONFIRMED — Wolfsberg/Pole Star on IMO primacy]
- **Beneficial ownership is the hard part.** The 50% rule means list-name screening alone misses ownership-based exposure; full UBO graph traversal is out of scope for the slice and should be explicitly flagged as a known limitation. [CONFIRMED]
- **Licensing.** OpenSanctions is free only for non-commercial use; a productized FixtureLog would need a bulk-data licence or direct government-file ingestion. Government files themselves are open (e.g. UK under Open Government Licence v3.0). [CONFIRMED]
- **UK list migration.** The OFSI Consolidated List closed 28 Jan 2026; ingest the FCDO UK Sanctions List, not the retired OFSI list. [CONFIRMED]
- **EU vessel list is a separate Annex.** Designated vessels (e.g. shadow-fleet ships under Reg. 833/2014 Annex) are not always in the financial-sanctions data file; source them deliberately. [CONFIRMED]
- **Not a behavioural intelligence platform.** FixtureLog should not claim AIS-spoofing/dark-fleet detection — that's Windward/Kpler/Pole Star territory and out of scope. [CONFIRMED]
- **Data freshness in a demo.** A demo running cached lists must show list version/date to remain credible; otherwise it silently serves stale data.

## 10. Hand-off to Codex (concrete next implementation move)

1. **Add the `Operator` and `ScreeningResult` entities** to the domain model (plus `ComplianceCase`/`ScreeningReview` and `Vessel.flagState`). Migrate Postgres additively.
2. **Stand up self-hosted OpenSanctions `yente`** (Docker compose: yente + Elasticsearch) alongside the existing stack; load the default + maritime datasets.
3. **Build a deterministic `screen()` service** that takes (subjectType, identifiers) → calls yente → writes an immutable `ScreeningResult` with status CLEAR/REVIEW/BLOCKED + list versions + score + source ref + TTL.
4. **Wire screening triggers** into requirement ENQUIRY/SHORTLIST creation and a mandatory re-screen on the ON_SUBS→FIXED transition; block the transition on BLOCKED/STALE.
5. **Surface status badges** on vessel/owner/operator/charterer in the dashboard and requirement/fixture views; add a screening panel with the cited match record and a broker review/decision action.
6. **Constrain the copilot** to read-only explanation of stored `ScreeningResult` rows with citations; add explicit refusals for sanctions conclusions, overrides and legal advice.
7. **Demo-proof:** seed one OSV whose owner/operator hits a designated entity — there are real, citable examples to model on: OFAC's 18 Dec 2024 action designated Russia-flagged vessels literally labelled "Offshore Support Vessel" (e.g. ARTEMIS OFFSHORE, IMO 9747194) and "Offshore Tug" (UMKA, IMO 9171620), plus the offshore pipe-layer Akademik Cherskiy (IMO 8770261), with operators such as the state-owned Marine Rescue Service / Morspas and LLC Farvater also SDN-listed — so the BLOCKED gate visibly fires end-to-end. [CONFIRMED — U.S. Federal Register notice 2025-02896, published 21 Feb 2025]

## 11. Directional Verdict

**RIGHT, BUT REFOCUS.**

Sanctions/operator-risk screening is the correct next feature — it is confirmed daily brokerage decision-making (Joe at SSY), it is table-stakes in the competitor set (Sea/, Veson, PurpleTRAC, Kpler, MIRS), and it maps directly onto FixtureLog's existing owner/charterer/vessel/fixture entities and audit-trail pattern. The refocus is on **scope and framing**: build the *deterministic, free-data, IMO-first screening gate with a sourced-explanation copilot and an immutable audit trail*, scoped to owner/operator/charterer/vessel — and explicitly **do not** drift into behavioural AIS/dark-fleet intelligence (owned by incumbents) or autonomous compliance decisions (outside the AI boundary). The concrete next move is to add the `Operator` + `ScreeningResult` entities and stand up self-hosted OpenSanctions `yente`, then gate the ON_SUBS→FIXED transition. That is the smallest slice that is credibly real to an SSY interviewer and faithfully demonstrates "deterministic screening + sourced explanations + human review."

---

### Key source URLs (for verification)
- OFAC Sanctions List Service: https://ofac.treasury.gov/sanctions-list-service
- OFAC maritime/shipping guidance (Oct 2024): https://ofac.treasury.gov/media/933556/download?inline=
- OFAC Iranian-oil shipping advisory (KYV / IMO research): https://ofac.treasury.gov/media/934236/download?inline=
- OFAC 50% Rule (FAQ 398): https://ofac.treasury.gov/faqs/398
- UK Sanctions List (FCDO): https://www.gov.uk/government/publications/the-uk-sanctions-list
- UK OFSI maritime financial-sanctions guidance: https://www.gov.uk/government/publications/financial-sanctions-guidance-for-maritime-shipping/financial-sanctions-guidance-for-maritime-shipping
- EU sanctions / FISMA resources: https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures/overview-sanctions-and-related-resources_en
- EU Sanctions Map (incl. designated vessels): https://www.sanctionsmap.eu/
- EU designated vessels (DMA reference): https://www.dma.dk/growth-and-framework-conditions/maritime-sanctions/sanctions-against-russia-and-belarus/eu-vessel-designations
- UN Security Council Consolidated List: https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list
- UN 1718 Designated Vessels List: https://main.un.org/securitycouncil/en/sanctions/1718/materials/1718-Designated-Vessels-List
- OpenSanctions datasets / API / self-host: https://www.opensanctions.org/datasets/ ; https://www.opensanctions.org/docs/self-hosted/ ; https://github.com/opensanctions/yente
- OpenSanctions maritime/IMO export: https://www.opensanctions.org/articles/2025-05-27-maritime-download/
- Sea/ Clearance Manager / Vessel Compliance Management: https://www.sea.live/intelligent-marketplace/clearance-manager/ ; https://www.sea.live/intelligent-marketplace/compliance-manager/
- Sea/ + Windward front-running rationale: https://windward.ai/blog/sea-and-windward-partner-to-improve-efficiency-during-pre-fixture-negotiations/
- Pole Star PurpleTRAC: https://www.polestarglobal.com/purpletrac/ ; https://sanctionsassociation.org/pole-star-acss-landing-page/
- Wolfsberg Sanctions Screening Guidance: https://wolfsberg-group.org/resources/168/53
- US Federal Register OSV/offshore designations (2025-02896): https://www.federalregister.gov/documents/2025/02/21/2025-02896/notice-of-department-of-state-sanctions-actions-pursuant-to-the-executive-order-regarding-blocking