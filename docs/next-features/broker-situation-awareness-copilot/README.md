# Broker Situation Awareness Copilot

## Status

Build-ready planning pack for the next FixtureLog feature.

This folder turns the SSY interview PoC into implementation-ready documentation. It does not claim
the feature is already built.

## Product Summary

FixtureLog already proves the core offshore broking workflow:

1. A charterer creates an enquiry.
2. The broker reviews vessel options.
3. The matcher creates a shortlist.
4. The broker negotiates the fixture.
5. The fixture moves through `ON_SUBS` toward `FIXED`.
6. Weather, screening, subjects, status changes, and recap evidence are stored.

The situation-awareness copilot extends that workflow at the moment before commitment.

It asks:

> Has anything new appeared in the last 24 to 72 hours around this vessel, operator, route, port, or
> region that the broker should see before deciding?

The broker still decides. The copilot only gives context.

## Why This Feature Exists

Joe mentioned a real brokerage risk: an operator can become sanctioned or risky, and then the broker
cannot operate with them. That insight creates a product direction beyond matching.

The next feature is not a compliance engine. It is a broker-facing awareness layer:

- pull recent external signals
- validate and store the evidence
- summarize it in natural language
- show source and timestamp
- let the broker decide relevance

## Non-Overclaiming Boundary

Use:

- `No new signal`
- `Heads-up`
- `Needs broker attention`
- `Source unavailable`

Avoid:

- `Safe`
- `Approved`
- `Cleared`
- `Blocked`
- `Compliant`
- `Predicted risk`

Core sentence:

> The feature gives context, not clearance.

## Folder Map

| File | Purpose |
|---|---|
| `README.md` | Product framing and build-readiness index. |
| `ADR-0001-situation-awareness-boundary.md` | Decision record for scope, language, source strength, and AI boundaries. |
| `TECHNICAL-DESIGN.md` | Architecture, service boundaries, source adapters, copilot flow. |
| `SOURCE-STRATEGY.md` | Real data source tiers and first-source recommendations. |
| `API-DATA-MODEL.md` | Proposed endpoints, schemas, tables, enums, and response shapes. |
| `IMPLEMENTATION-PLAN.md` | Task-by-task build plan with files, interfaces, tests, and docs. |
| `TEST-PLAN.md` | Verification plan for source parsing, evidence storage, summaries, and refusal behaviour. |

## Binding Decisions

- Preserve ADR-0004: every real write remains human-in-the-loop.
- Preserve ADR-0005: RAG is deferred unless there is a curated corpus.
- The first implementation is report-only. It does not block `FIXED`.
- All external data enters through Zod-validated source adapters.
- Social media is an early signal only. It never creates a strong conclusion by itself.
- Natural-language answers must be generated from stored evidence.

## Ready-To-Build Scope

The first build should produce:

- a `SignalDigest` table
- a `SignalEvidence` table
- a source-adapter interface
- keyless or low-friction adapters first
- a broker-only route to refresh a digest
- a broker-only route to read the latest digest
- a fixture detail panel showing the digest
- a read-only copilot tool that summarizes stored evidence
- tests proving the copilot refuses legal/commercial decisions

## Deferred Scope

- autonomous decisions
- legal/compliance clearance
- workflow blocking from social/news signals
- live AIS dependency
- paid social-listening integration before licensing is confirmed
- RAG over a weak or uncurated corpus
- voice integration

## Interview Framing

> FixtureLog started as a demo to show that I understand the offshore workflow. This feature is the
> next step. It takes the vessel that is already being considered and checks whether anything new has
> appeared around it in the last 24 to 72 hours. The copilot summarizes the evidence in natural
> language, with sources and timestamps. The broker still decides if it matters.
