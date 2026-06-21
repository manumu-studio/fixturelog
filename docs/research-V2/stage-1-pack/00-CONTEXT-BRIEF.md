# Stage 1 Context Brief For Claude.ai

You are Claude.ai. You do not have terminal access. Treat this file as the project context you need
before running Stage 1 web research.

## Project

FixtureLog is an offshore shipbroking workflow demo aimed at helping Manu land the SSY Full-Stack
Developer role. The focus is offshore / OSV only: PSV, AHTS, ERRV, North Sea or comparable offshore
markets. Ignore SSY's other desks unless they directly affect offshore sanctions/operator-risk
screening.

## Current Product State From Stage 0

Stage 0 was run locally by Claude Code against the real FixtureLog codebase. It found that FixtureLog
is **not** a bare shell. It already has:

- a 15-model offshore-broking domain model;
- requirements, vessels, owners, charterers, brokers, fixtures, subjects, recaps, weather snapshots,
  and vessel positions;
- `RequirementStatus`: `ENQUIRY -> SHORTLISTED -> NEGOTIATING -> ON_SUBS -> FIXED -> LOST`;
- `FixtureStatus`: `DRAFT -> NEGOTIATING -> ON_SUBS -> FIXED -> COMPLETED / FAILED`;
- a two-stage vessel matching engine;
- weather workability verdicts;
- SUPPLYTIME-style recap generation;
- a broker dashboard;
- a charterer portal;
- a grounded, human-in-the-loop broker copilot;
- a voice agent, though voice deepening is not this stage;
- seeded vessel positions, with schema support for AIS.

## Genuine Gaps From Stage 0

The genuine remaining gaps are:

1. `/requirements` list UI is functional but visually raw.
2. `/charterers` list UI is functional but visually raw.
3. **No sanctions / operator-risk screening exists.**
4. Live AIS is not integrated yet.

Stage 1 is only about gap 3.

## Interview Evidence

Joe / SSY named sanctions/operator risk as daily brokerage decision-making:

> "We may have dealt with a certain operator before, but the next thing you know they're on a
> sanctions list, and then we can't operate with them — that's key decision-making we do as a
> brokerage every day."

## Existing Screenable Entities

Assume FixtureLog already has:

- `Owner` with `name`, `country`;
- `Charterer` with `name` (plus `sector` and contact fields);
- `Vessel` with `name`, `imo`, `mmsi`;
- `Broker`;
- `Requirement`;
- `Fixture`;
- `FixtureStatusChange` as an existing audit trail for status transitions.

Likely missing if sanctions screening needs them:

- distinct operator separate from owner;
- beneficial owner;
- ship manager;
- flag state;
- port/country risk;
- cargo/project counterparty;
- compliance case/review entity;
- screening result entity.

## AI Boundary

FixtureLog's AI boundary is:

- database and deterministic tools are source of truth;
- copilot may explain risk only from stored screening evidence and cited sources;
- copilot must not invent sanctions conclusions;
- mutating actions remain human-approved;
- high-risk decisions should be deterministic gates or review states, not free-form model judgment.

Preferred framing:

> deterministic screening + sourced explanations + human review.

Avoid:

> model training, autonomous compliance decisions, unsourced legal advice.
