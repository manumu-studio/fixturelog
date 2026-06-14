# AI Broker Copilot Research

## Executive Summary

FixtureLog's future AI Broker Copilot should use the LLM as a natural-language interface, not as a source of commercial truth. The model can parse messy charterer language, ask clarifying questions, choose typed tools, and explain results. Vessel identity, availability, rates, fixture status, weather values, and recap terms must come from PostgreSQL/Prisma or a deterministic backend tool.

The recommended implementation path is a Next.js App Router copilot panel backed by the Vercel AI SDK, Zod schemas, typed tool calls, human-in-the-loop approval for writes, Langfuse observability, and an eval suite covering extraction, tool-call correctness, groundedness, refusal safety, injection resistance, and recap completeness.

## Core Architecture: LLM as Interface, Backend as Truth

The central architecture is:

- The user writes a natural-language vessel requirement.
- The LLM extracts a draft and asks clarifying questions.
- The backend validates draft fields with Zod.
- Tool functions query the database, call deterministic services, or fetch weather.
- The model summarizes tool results only after the backend returns evidence.
- The user explicitly confirms before any write tool persists state.

Every commercial fact must be traceable to one of these sources:

- seeded PostgreSQL records through Prisma
- existing FixtureLog services such as FixtureMatcher, RecapFormatter, FixtureStatusPolicy, WeatherEnricher, and computeVerdict
- Open-Meteo Marine API output where weather is involved

The LLM must not invent vessels, rates, fixture terms, availability, weather, or legal/commercial claims.

## Vercel AI SDK Orchestration

The research recommends the Vercel AI SDK because it fits the existing TypeScript/Next.js stack. The relevant future capabilities are:

- chat orchestration from a Next.js route handler
- structured extraction with schema-bound outputs
- typed tool calling with Zod-compatible schemas
- client-side chat state through `useChat`
- human approval for tool calls marked with `needsApproval`
- telemetry hooks for tracing model calls and tool calls

Verify before implementation: the exact AI SDK API names and provider package versions, especially approval APIs and telemetry fields, should be checked against current official documentation before code is written.

## Structured Outputs and Zod Contracts

The safe extraction strategy has three layers:

1. Provider-native structured output or tool-use schema support where available.
2. AI SDK schema binding.
3. FixtureLog-owned Zod validation with `safeParse` before data reaches application logic or persistence.

Zod remains the application contract. Generated data should be treated as untrusted until parsed. Validation failures should produce targeted error feedback or a clarification request rather than silent coercion.

## Tool Calling Design

Future tools should return compact, evidence-focused JSON with stable IDs. They should not expose broad raw database dumps to the model. Tool descriptions should make boundaries explicit: what the tool does, what it refuses, what the input schema requires, and what error shape is returned.

Recommended read/compute tools:

- `createRequirementDraft`
- `validateRequirementCompleteness`
- `searchVessels`
- `rankVesselMatches`
- `getWeatherWindow`
- `getFixtureById`
- `generateRecapDraft`

Recommended write tools:

- `saveConfirmedRequirement`
- `confirmFixture`
- `finalizeRecap`

Write tools require explicit human approval and must not auto-execute.

## Human-in-the-Loop Confirmation

The most important safety property is that the AI proposes and the broker disposes. A future UI should show extracted fields as editable structured data, flag assumptions, surface missing fields, and require a clear confirmation action before any write.

Approval should cover:

- saving a confirmed requirement
- confirming fixture state or terms
- finalizing recap text

Denials must be logged and must not trigger silent retries.

## Observability and Evals

Langfuse is the preferred observability direction because it supports JavaScript/TypeScript, tracing, prompt/version tracking, and OpenTelemetry-style integration. Braintrust is a strong fallback for eval-first workflows and CI gating.

Verify before implementation: pricing, free tiers, retention periods, SDK APIs, and CI integration details are subject to change.

Minimum future eval categories:

- extraction accuracy
- tool-call correctness
- groundedness/faithfulness
- refusal and safety behavior
- injection resistance
- recap completeness
- regression checks on prompt/model changes

Primary golden case:

```text
Input: "I need a PSV near Aberdeen next Monday for 10 days, deck cargo, ideally under 18k a day."
Expected: vesselType PSV, region North Sea, port Aberdeen, durationDays 10, maxDayRate 18000, capabilities ["deck cargo"].
```

Negative cases should include fake vessels, missing data, prompt injection, tool-result injection, and unconfirmed recap terms.

## Safety and Hallucination Risks

The main risk is not only hallucination. The copilot also needs controls for adversarial input and data governance.

Key risks:

- invented vessel
- wrong status or availability
- unsupported rate or commercial term
- wrong weather interpretation
- recap with unconfirmed terms
- prompt injection
- tool-result injection
- commercial data leakage
- cross-actor leakage
- approval bypass
- stale tool output

Grounding checks and LLM-as-judge evaluations are useful, but commercial-critical claims need deterministic checks against record IDs and confirmed fields.

## Open-Meteo and Data Caveats

Open-Meteo Marine is suitable for a portfolio demo because it has no key requirement and provides useful marine weather variables. It is not a commercial production data agreement.

Verify before implementation:

- Open-Meteo terms and rate limits
- non-commercial usage restrictions
- forecast horizon and regional model coverage
- whether the future tool needs current conditions or date-range forecast data

Existing FixtureLog weather code is current-condition based. A future `getWeatherWindow` tool must either add a forecast/date-range adapter or clearly label itself as current-condition only.

## Implementation Packet Recommendations

Recommended future sequence:

- Post-MVP AI Broker Copilot implementation: chat endpoint, tools, structured extraction, copilot panel, and HITL confirmation.
- AI evals and observability hardening: Langfuse/Braintrust integration, eval datasets, groundedness checks, hallucination flags, and CI regression gates.

This research packet does not build those features.

## Source Links

- https://ai-sdk.dev
- https://vercel.com/blog/ai-sdk-6
- https://platform.claude.com
- https://www.anthropic.com/engineering/writing-tools-for-agents
- https://openai.com/index/introducing-structured-outputs-in-the-api
- https://zod.dev
- https://langfuse.com
- https://braintrust.dev
- https://open-meteo.com/en/docs/marine-weather-api
- https://open-meteo.com/en/terms
- https://www.ssyglobal.com/services/offshore
- https://www.bimco.org/contracts-and-clauses/bimco-contracts/supplytime-2017

## Assumptions and Verify-Before-Implementation Items

- Assumption: Vercel AI SDK remains the best orchestration fit for the Next.js stack.
- Assumption: Langfuse remains the preferred observability tool and Braintrust remains the fallback eval tool.
- Assumption: the future implementation will add auth/actor scoping before multi-user production use.
- Verify before implementation: AI SDK approval APIs, telemetry APIs, provider package versions, observability pricing, Open-Meteo commercial terms, Open-Meteo rate limits, and model/provider structured-output behavior.
