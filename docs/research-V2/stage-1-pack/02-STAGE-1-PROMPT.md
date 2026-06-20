# STAGE 1 PROMPT — Sanctions / Operator-Risk Screening for FixtureLog

You are Claude.ai leading a web-research stage for FixtureLog, an offshore shipbroking demo aimed at SSY.

You have been given this context pack because you cannot access the terminal/repo:

- `00-CONTEXT-BRIEF.md`
- `01-WHY-FIRST-PILOT-FAILED.md`
- this prompt

Use those files as binding context.

## Outcome, One Sentence

Produce a source-backed research brief that tells us exactly how sanctions/operator-risk screening should work in an offshore OSV enquiry -> fixture workflow, which public/cheap data sources matter, whether competitors already do this, and the narrow product shape FixtureLog should build next.

## Research Chain Rules

1. Stay on the outcome above.
2. Only include findings that move the next product decision.
3. Provide source links for every non-obvious external claim.
4. Label claims `CONFIRMED`, `LIKELY`, `INFERENCE`, or `UNVERIFIED`.
5. Do not attach time/effort estimates.
6. End with one directional verdict: `WRONG PATH`, `RIGHT, BUT REFOCUS`, `NOVEL / UNEXPLORED`, or `VALIDATED / EXISTING`.

## Research Scope

Research only sanctions/operator-risk screening for offshore shipbroking, especially OSV / PSV / AHTS / ERRV workflows in North Sea or similar offshore markets.

### 1. Which Sanctions / Risk Lists Matter?

Research:

- OFAC SDN and maritime/vessel sanctions;
- FCDO UK Sanctions List (not the retired OFSI Consolidated List feed);
- EU consolidated list;
- UN sanctions list;
- maritime-specific advisories/watchlists;
- whether brokers/compliance teams screen vessel, owner, operator, manager, charterer, beneficial owner, flag, port, cargo/project counterparties.

### 2. Where Does Screening Fit In The Workflow?

Map screening onto:

```text
Requirement ENQUIRY
  -> SHORTLISTED
  -> NEGOTIATING
  -> ON_SUBS
  -> FIXED
  -> LOST

Fixture DRAFT
  -> NEGOTIATING
  -> ON_SUBS
  -> FIXED
  -> COMPLETED / FAILED
```

Research:

- when screening should first happen;
- what should block;
- what should warn but allow human review;
- what should be rechecked before `FIXED`;
- what audit evidence should be stored;
- how stale screening results should be handled.

### 3. What Public / Free / Cheap Data Sources Exist?

For every source, provide:

- link;
- jurisdiction;
- what it covers;
- access method: API, CSV, XML, download, search UI, RSS, email updates, or paid only;
- update cadence if available;
- fit for FixtureLog;
- limitations, licensing concerns, or practical caveats.

### 4. Are Competitors Already Doing This?

Check:

- Sea/ by Maritech;
- Veson;
- Shipfix;
- Kpler;
- Signal Ocean;
- S&P / maritime intelligence providers;
- maritime sanctions/compliance vendors;
- shipping risk-intelligence vendors;
- general sanctions-screening vendors if relevant.

Classify each as:

- `table-stakes feature`;
- `rare in broker workflow tools`;
- `novel integration`;
- `unclear / not publicly visible`.

### 5. What Is The Narrow Product Shape FixtureLog Should Build?

Recommend the smallest credible slice that would impress SSY without overbuilding.

Cover:

- which existing entities to screen first;
- suggested risk statuses;
- where it appears in broker dashboard / requirement / fixture flow;
- when broker review/override is needed;
- what gets stored in the audit trail;
- what the copilot may say;
- what the copilot must refuse;
- what remains deterministic.

## Hard Constraints

- Do not research generic broker dashboards.
- Do not research AIS except where sanctions/risk sources directly depend on vessel identity.
- Do not give legal advice.
- Do not recommend model training.
- Do not recommend autonomous compliance decisions.
- Do not attach time estimates.
- Do not claim FixtureLog lacks matching, recap, dashboard, weather, portal, or copilot.
- If public evidence is weak, label it `UNVERIFIED` or `not publicly visible`.

## Output Format

Return the brief in this exact structure:

1. **Executive Summary**
2. **Sanctions / Risk Sources Table**
   - Source
   - Jurisdiction
   - Covers
   - Access method
   - Update cadence if known
   - Fit for FixtureLog
   - Caveats
   - Confidence label
3. **What Brokers Should Screen**
4. **Broker Workflow Map**
5. **Competitor / Platform Scan**
6. **Recommended FixtureLog Feature**
7. **Data / Model Implications**
8. **AI / Copilot Implications**
9. **Risks and Unknowns**
10. **Hand-off to Codex**
11. **Directional Verdict**

The verdict must include reasons and the concrete next move.
