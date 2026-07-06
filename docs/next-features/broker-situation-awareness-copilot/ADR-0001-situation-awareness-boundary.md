# ADR-0001: Situation-Awareness Boundary

- **Status:** Proposed for next feature
- **Date:** 2026-07-06
- **Deciders:** Manu Murillo
- **Context tags:** copilot, external-data, situation-awareness, broker-workflow, ai-safety
- **Related:** `docs/decisions/ADR-0002-data-and-integration-strategy.md`, `docs/decisions/ADR-0004-copilot-human-in-the-loop.md`, `docs/decisions/ADR-0005-text-first-shared-broker-brain.md`

## Context

FixtureLog currently uses seeded operational data plus selected real external evidence, such as
Open-Meteo Marine weather snapshots. The app already models the offshore workflow from enquiry to
fixture and recap.

The new idea extends that workflow before the broker moves a deal toward `FIXED`. A broker may need
to know if something new appeared around the chosen vessel, operator, route, port, or region during
the last 24 to 72 hours.

The feature must be useful without overclaiming. News and social signals are noisy. AI summaries can
be wrong if they are not grounded. A broker-facing tool must therefore show evidence and stay inside
safe language.

## Decision

Build a situation-awareness copilot, not a compliance or decision engine.

The system may:

- gather recent external signals
- validate each source response
- store evidence with source and timestamp
- summarize stored evidence in natural language
- mark a digest as `NO_NEW_SIGNAL`, `HEADS_UP`, `NEEDS_BROKER_ATTENTION`, or `SOURCE_UNAVAILABLE`
- let the broker mark a digest as reviewed

The system must not:

- say a vessel is safe
- clear a party
- approve a deal
- replace broker judgement
- use a single social post as proof
- block `FIXED` in the first slice
- answer legal or compliance questions as an authority

## Source Strength Rules

| Source strength | Examples | Allowed language |
|---|---|---|
| Official | OFAC, UK Sanctions List, UKMTO, GDACS | "Official source reported..." |
| Trusted news | established local/global publishers via Event Registry or Media Cloud | "News reports indicate..." |
| Open media signal | GDELT, broad media/event detection | "Media signals mention..." |
| Social signal | X or approved social-listening provider | "A social signal appeared..." |

Social signals can only support `HEADS_UP` unless corroborated by trusted or official sources.

## State Language

Use soft state names:

- `NO_NEW_SIGNAL`
- `HEADS_UP`
- `NEEDS_BROKER_ATTENTION`
- `SOURCE_UNAVAILABLE`

Do not use:

- `CLEAR`
- `SAFE`
- `APPROVED`
- `COMPLIANT`
- `BLOCKED`

Those words imply a decision the product should not make.

## Consequences

Positive:

- The feature can use real external data without pretending to be a compliance platform.
- The broker remains in control.
- The copilot gets a clear grounding contract: answer from stored evidence only.
- Tests can verify refusal behaviour and source citation.

Trade-offs:

- The first slice is less dramatic because it does not block the workflow.
- The UI must teach source strength carefully.
- Some useful sources may remain behind licensing/API-key decisions.

## Follow-Up Decisions

- Choose the first production news source: GDELT, Event Registry / NewsAPI.ai, or Media Cloud.
- Confirm social media access and licensing before implementing a live social adapter.
- Decide whether a future version may create a pre-`FIXED` mandatory review reminder.
