# FixtureLog Glossary

Definitions for offshore shipbroking terminology used throughout this application, plus app-specific terms.

---

## Offshore Shipbroking Terms

**AHTS (Anchor Handling Tug Supply vessel)**
A vessel designed to handle anchors for drilling rigs and to tow rigs and platforms. Combines anchor-handling gear with a supply-vessel cargo deck.

**Charter party**
The contract between a shipowner and a charterer governing the hire of a vessel. Specifies duration, hire rate, trading area, and operational conditions. SUPPLYTIME 2017 is a widely used charter party form for offshore support vessels.

**Charterer**
The company or individual that hires a vessel from its owner. The charterer directs the vessel's employment within the agreed parameters of the charter party.

**Clean fixed**
Industry shorthand for a fixture that has been agreed without outstanding conditions — all subjects have been lifted or waived. Equivalent to `FIXED` status in FixtureLog.

**CSV (Construction Support Vessel)**
A large, dynamically positioned vessel equipped for subsea construction work — pipe-laying, riser installation, umbilical deployment, and heavy lift.

**CTV (Crew Transfer Vessel)**
A fast, smaller vessel used to transfer personnel and light cargo to offshore wind turbines and platforms. Common in the offshore wind sector.

**Day rate**
The daily hire charge for a vessel under a time charter. Quoted in USD per day. Covers vessel operating costs plus a margin; consumables (fuel, port fees) are typically charterer's account.

**Demobilization**
The process of returning a vessel to its home port or a standby berth at the conclusion of a contract. May involve decommissioning installed equipment.

**DP class (Dynamic Positioning class)**
A classification certifying a vessel's ability to maintain position using thruster systems without anchoring. Graded `NONE < DP1 < DP2 < DP3`. Higher classes provide greater redundancy for critical subsea or heavy-lift operations.

**DSV (Dive Support Vessel)**
A vessel equipped with saturation diving systems for deep-water intervention work. Typically DP2 or DP3 classed.

**ERRV (Emergency Response and Rescue Vessel)**
A vessel on permanent standby near an offshore installation, ready to rescue personnel in an emergency. Required by regulation in most North Sea fields.

**Fixture**
The completed deal between a shipowner and a charterer. Once "clean fixed," the fixture defines the terms under which the vessel will be employed. In FixtureLog, a Fixture progresses through `DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED`.

**IMO (International Maritime Organization)**
The United Nations agency responsible for the safety, security, and environmental performance of international shipping. Each vessel has a unique, permanent IMO number.

**Laycan (Laydays / Cancelling)**
The window of dates within which a vessel must be ready to begin the charter. If the vessel is not ready by the cancelling date, the charterer may cancel without penalty.

**MMSI (Maritime Mobile Service Identity)**
A unique nine-digit number that identifies a vessel's AIS transponder. Used to track vessel positions via Automatic Identification System (AIS) feeds.

**Mobilization**
The process of preparing a vessel for a specific contract — installing specialist equipment, moving to a load port, or undergoing required inspections before commencement.

**MPSV (Multi-Purpose Support Vessel)**
A versatile vessel combining several capabilities — dive support, construction support, ROV operations, and sometimes anchor handling. Often DP2 or DP3 classed.

**On subs (On Subjects)**
A stage in fixture negotiations where the principal terms are agreed but the deal is conditional on outstanding subjects being lifted. Equivalent to `ON_SUBS` status.

**OTHER**
An app-level vessel type for offshore support vessels that do not fit the named PSV, AHTS, MPSV, CSV, ERRV, DSV, CTV, or SOV categories.

**Owner**
The company or individual that owns a vessel and makes it available for charter. The owner's representative negotiates terms with the shipbroker acting for the charterer.

**PSV (Platform Supply Vessel)**
The workhorses of the offshore supply industry. Designed to carry mixed bulk cargo (fuel, water, mud, cement) and deck cargo to offshore installations.

**Recap (Recapitulation)**
A summary document, sent by the broker after a fixture is clean fixed, that recaps the agreed terms. In FixtureLog, the `RecapFormatter` service generates a deterministic SUPPLYTIME 2017 recap.

**Shipbroker**
An intermediary who negotiates vessel hire on behalf of owners and charterers. Advises on market rates, vessel selection, and deal structure. SSY (Simpson Spence Young) is a major independent shipbroker.

**SOV (Service Operation Vessel)**
A larger vessel used as a floating base for offshore wind maintenance operations. Typically carries technicians, walk-to-work gangways, and a small fleet of daughter craft.

**Subjects**
Conditions attached to a fixture negotiation that must be resolved before the deal is clean fixed (e.g., management approval, board approval, credit approval). Each subject item has a status of `PENDING`, `LIFTED`, or `WAIVED`.

**SUPPLYTIME 2017**
A standard charter party form published by BIMCO (Baltic and International Maritime Council), widely used for offshore support vessel time charters. FixtureLog's `RecapFormatter` produces recaps based on this form's field set.

**Workscope**
The specific operational task a vessel is contracted to perform — for example, anchor handling, diving support, platform supply, or subsea construction.

---

## App-Specific Terms

**FixtureMatcher**
The two-stage vessel-matching engine in `src/lib/services/fixture-matcher.ts`. Stage 1 applies hard filters (vessel type, availability, region, deck area, bollard pull, DP class). Stage 2 computes a weighted composite score (distance 0.40, rate fit 0.35, capability margin 0.25). Returns a ranked shortlist with per-factor breakdown. No machine learning — all logic is explicit and deterministic.

**FixtureStatusPolicy**
The service that enforces the canonical fixture status machine (`DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED`). The `ON_SUBS → FIXED` transition is subject-gated: it requires at least one subject item with every item either `LIFTED` or `WAIVED`. Invalid transitions return HTTP 400 with the count of outstanding subjects. Every valid transition writes a `FixtureStatusChange` audit row.

**RecapFormatter**
A pure TypeScript service that generates a deterministic SUPPLYTIME 2017 recap in both Markdown and plain text from a fixture's structured terms. No runtime AI or LLM involvement — output is a straightforward template render.

**WeatherEnricher**
An I/O service wrapping the Open-Meteo Marine API. Fetches `current` wave, swell, and wind-wave conditions for a given coordinate, applies a 5-minute in-memory TTL cache, and calls `computeVerdict()` to produce a `WorkabilityVerdict`. No database writes.
