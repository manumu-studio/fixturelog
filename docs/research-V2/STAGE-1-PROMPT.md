# STAGE 1 PROMPT — Sanctions / Operator-Risk Screening for FixtureLog

> **Audience:** Claude.ai web research.
> **Use:** Claude.ai cannot access Manu's terminal/repo. Use `docs/research-V2/stage-1-pack/` as
> the pasteable context pack, especially `01-WHY-FIRST-PILOT-FAILED.md`, then paste this prompt.
> **Project:** FixtureLog, an offshore shipbroking workflow demo aimed at SSY.
> **Stage:** 1 of the refocused research chain.
> **Status:** Cleared to launch (Stage 0.1 passed 2026-06-20 — see `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md`).
> **Lead:** Claude.ai, because this stage needs web breadth.
> **Cross-check:** Claude Code will later verify the output against the actual repo.

---

## 0. Why This Stage Exists

Stage 0 corrected a major false premise. FixtureLog is **not** a bare shell that needs broad research into
"what a broker tool should be." It is already a near-complete offshore-broking tool. The only genuinely
high-signal missing product gap is **sanctions / operator-risk screening**, because an SSY interviewer
named it as daily broker decision-making and Stage 0 confirmed the feature is absent from the schema/product.

This stage must research that single gap, not restart product discovery.

---

## 1. Outcome, One Sentence

Produce a source-backed research brief that tells us exactly how sanctions/operator-risk screening should work in an offshore OSV enquiry → fixture workflow, which public/cheap data sources matter, whether competitors already do this, and the narrow product shape FixtureLog should build next.

---

## 2. Research Chain Rules You Must Obey

This stage is governed by FixtureLog's project-specific research/decision system:

1. **Outcome-first.** The one-sentence outcome above is the target. Do not drift.
2. **Relevance gate.** Only include findings that move the next product decision.
3. **Two-party calibration.** Claude.ai provides web breadth; Claude Code will later cross-check against repo truth; Manu is the human arbiter.
4. **Directional verdict.** End with exactly one verdict:
   - `WRONG PATH`
   - `RIGHT, BUT REFOCUS`
   - `NOVEL / UNEXPLORED`
   - `VALIDATED / EXISTING`
5. **No premature estimates.** Do not attach hours/days/timeline estimates. Structural independence is allowed; duration guesses are not.
6. **Confidence labels.** Mark non-obvious claims as `CONFIRMED`, `LIKELY`, `INFERENCE`, or `UNVERIFIED`.
7. **Source discipline.** Provide links for every non-obvious external claim. If a fact is not publicly verifiable, say so.

---

## 3. FixtureLog Current State From Stage 0

Treat this as confirmed project ground truth. Do **not** re-research it.

FixtureLog already has:

- A 15-model offshore-broking domain model.
- Requirements, vessels, owners, charterers, brokers, fixtures, subjects, recaps, weather snapshots, vessel positions.
- Negotiation state machines:
  - `RequirementStatus`: `ENQUIRY → SHORTLISTED → NEGOTIATING → ON_SUBS → FIXED → LOST`
  - `FixtureStatus`: `DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED / FAILED`
- A two-stage vessel matching engine:
  - hard filter first;
  - weighted scoring second using distance, rate fit, and capability margin.
- Weather workability verdicts.
- SUPPLYTIME-style recap generation.
- Broker dashboard with enquiry queue, fixture timeline, pending actions, close actions, copilot, and voice.
- Charterer portal with enquiries, fixtures, documents, and fleet.
- A grounded broker copilot:
  - answers from current desk data;
  - fixed refusal behavior when the data is missing;
  - read tools;
  - write tools that only propose actions and require human approval.
- Voice agent exists, but deeper voice work is not this stage.
- Vessel positions are seeded only, but the schema already supports AIS.

Stage 0 evidence classified FixtureLog as already a real broker tool. The genuine remaining gaps are:

1. `/requirements` list UI is functional but visually raw.
2. `/charterers` list UI is functional but visually raw.
3. **No sanctions / operator-risk screening exists.**
4. Live AIS is not integrated yet.

This Stage 1 prompt is only about gap 3.

---

## 4. Why Sanctions / Operator Risk Is the Priority

Interview evidence from Joe / SSY context:

> "We may have dealt with a certain operator before, but the next thing you know they're on a sanctions list, and then we can't operate with them — that's key decision-making we do as a brokerage every day."

Stage 0 conclusion:

- Sanctions/operator-risk screening is absent from FixtureLog.
- There is no schema field or product flow for it yet.
- This is the highest-signal feature because it connects directly to daily brokerage risk decisions.

---

## 5. Existing Entities You Can Assume FixtureLog Has

These entities already exist conceptually in the app and are screenable candidates:

- `Owner`
  - Represents vessel owner/operator in the current model.
  - Has `name`, `country`.
- `Charterer`
  - Represents the client/counterparty.
  - Has `name` (plus `sector` and contact fields — `contactName` / `contactEmail` / `contactPhone`).
- `Vessel`
  - Has `name`, `imo`, `mmsi`.
  - Can map to vessel-level sanctions/watchlist checks.
- `Broker`
  - Internal user/actor.
- `Requirement`
  - The charterer demand/enquiry.
- `Fixture`
  - The negotiated deal connecting vessel, owner/charterer/broker/region/workscope.
- `FixtureStatusChange`
  - Existing audit trail for status transitions.

Likely missing if screening needs them:

- distinct operator separate from owner;
- beneficial owner;
- ship manager;
- flag state;
- port/country risk;
- cargo/project counterparty;
- compliance case/review entity;
- screening result entity.

Do not invent code. Use these as product context for research.

---

## 6. Product Architecture Boundary

FixtureLog's AI boundary is important:

- The database and deterministic tools are the source of truth.
- The copilot may explain risk only from stored screening evidence and cited sources.
- The copilot must not invent sanctions conclusions.
- Mutating actions remain human-approved.
- High-risk decisions should be deterministic gates or review states, not free-form model judgment.

Preferred framing:

> deterministic screening + sourced explanations + human review.

Avoid:

> model training, autonomous compliance decisions, or unsourced legal advice.

---

## 7. Research Scope

Research sanctions/operator-risk screening for offshore shipbroking, especially OSV / PSV / AHTS / ERRV workflows in North Sea or similar offshore markets.

Answer only these questions:

### 7.1 Which Sanctions / Risk Lists Matter?

Research:

- OFAC SDN and maritime/vessel sanctions.
- FCDO UK Sanctions List (not the retired OFSI Consolidated List feed).
- EU consolidated sanctions list.
- UN sanctions list.
- Any maritime-specific watchlists or advisories relevant to vessels, owners, operators, managers, charterers, ports, or beneficial owners.
- Whether brokers or maritime compliance teams typically screen:
  - vessel;
  - owner;
  - operator;
  - manager;
  - charterer;
  - beneficial owner;
  - flag;
  - port;
  - cargo/project counterparties.

### 7.2 Where Does Screening Fit in the Workflow?

Map screening onto this real FixtureLog flow:

```text
Requirement ENQUIRY
  → SHORTLISTED
  → NEGOTIATING
  → ON_SUBS
  → FIXED
  → LOST

Fixture DRAFT
  → NEGOTIATING
  → ON_SUBS
  → FIXED
  → COMPLETED / FAILED
```

Research:

- When should screening first happen?
- What should block a fixture?
- What should warn but allow human review?
- What should be rechecked before `FIXED`?
- What audit evidence should be stored?
- Which changes should be immutable?
- How should stale screening results be handled?

### 7.3 What Public / Free / Cheap Data Sources Exist?

For every source, provide:

- link;
- jurisdiction;
- what it covers;
- access method: API, CSV, XML, downloadable file, search UI, RSS, email updates, or paid only;
- update cadence if available;
- practical fit for FixtureLog;
- limitations, licensing concerns, or operational caveats.

Do not assume enterprise APIs unless they are clearly public.

### 7.4 Are Competitors Already Doing This?

Check:

- Sea/ by Maritech;
- Veson;
- Shipfix;
- Kpler;
- Signal Ocean;
- S&P / maritime intelligence providers;
- maritime sanctions/compliance vendors;
- shipping risk-intelligence vendors;
- general sanctions-screening vendors if relevant to maritime workflows.

Classify each as:

- `table-stakes feature`;
- `rare in broker workflow tools`;
- `novel integration`;
- `unclear / not publicly visible`.

### 7.5 What Is the Narrow Product Shape FixtureLog Should Build?

Recommend the smallest credible slice that would impress SSY without overbuilding.

Cover:

- which existing entities to screen first;
- suggested risk statuses;
- where it appears in the broker dashboard / requirement / fixture flow;
- when a broker must review/override;
- what gets stored in the audit trail;
- what the copilot may say;
- what the copilot must refuse;
- what remains deterministic.

---

## 8. Hard Constraints

- Do not research generic broker dashboards.
- Do not research AIS except where sanctions/risk sources directly depend on vessel identity.
- Do not give legal advice.
- Do not recommend model training.
- Do not recommend autonomous compliance decisions.
- Do not attach time estimates.
- Do not claim FixtureLog lacks matching, recap, dashboard, weather, portal, or copilot; Stage 0 confirmed those exist.
- If public evidence is weak, label it `UNVERIFIED` or `not publicly visible`.

---

## 9. Output Format

Return the brief in this exact structure:

1. **Executive Summary**
   - 5-8 bullets.
   - State whether sanctions/operator screening is table-stakes, rare, novel, or unclear in broker workflow tools.

2. **Sanctions / Risk Sources Table**
   - Columns:
     - Source
     - Jurisdiction
     - Covers
     - Access method
     - Update cadence if known
     - Fit for FixtureLog
     - Caveats
     - Confidence label

3. **What Brokers Should Screen**
   - vessel;
   - owner;
   - operator;
   - manager;
   - charterer;
   - beneficial owner;
   - flag;
   - port/project/counterparty if relevant.

4. **Broker Workflow Map**
   - Map screening to `ENQUIRY`, `SHORTLISTED`, `NEGOTIATING`, `ON_SUBS`, `FIXED`.
   - Identify block vs warning vs manual review.

5. **Competitor / Platform Scan**
   - Table of platforms/vendors.
   - Include links.
   - Classify the visibility of sanctions/risk workflow features.

6. **Recommended FixtureLog Feature**
   - The narrowest credible product slice.
   - Must map to existing entities where possible.
   - Must say what is net-new.

7. **Data / Model Implications**
   - Conceptual fields/entities only.
   - No code.
   - Separate existing model reuse from net-new schema.

8. **AI / Copilot Implications**
   - How the broker copilot should answer using screening evidence.
   - How citations/refusals/human review should work.
   - How to avoid hallucination.

9. **Risks and Unknowns**
   - Public-data limitations.
   - Licensing/terms concerns.
   - False positives / name matching.
   - Legal advice boundary.
   - Staleness/update cadence.

10. **Hand-off to Codex**
   - Concise build-planning input for Codex.
   - Include:
     - what to build first;
     - what not to build yet;
     - which decisions remain for Manu.
   - No time estimates.

11. **Directional Verdict**
   - End with exactly one:
     - `WRONG PATH`
     - `RIGHT, BUT REFOCUS`
     - `NOVEL / UNEXPLORED`
     - `VALIDATED / EXISTING`
   - Include reasons and the concrete next move.

---

## 10. Pre-Launch Checklist

- [x] Outcome defined in one sentence.
- [x] Relevance typed as missing-data / info-gap for a confirmed product gap.
- [x] Lead decided: Claude.ai.
- [x] Directional verdict required.
- [x] Hand-off to Codex required.
- [x] No premature estimates.
- [x] Self-contained for Claude.ai with no terminal access.
