# Building the AI Broker Copilot in FixtureLog: Implementation, Safety, Observability & Evals

## TL;DR
- Build the copilot on the **Vercel AI SDK** as the orchestration layer, with the LLM acting strictly as a natural-language interface: it extracts requirements, asks clarifying questions, and calls typed backend tools, while the **PostgreSQL/Prisma database and tool functions remain the single source of truth** for vessel data, availability, weather and rates.
- Force structured data with **Zod schemas + AI SDK `generateObject`/tool `inputSchema`** (provider-native structured outputs under the hood), validate every LLM output and tool input with `safeParse` + retry, and never persist a fixture or recap without an explicit human-in-the-loop confirmation step.
- For a 5-day portfolio demo, use **Langfuse** (open-source, genuine TS/Node SDK, free Hobby tier of 50,000 units/month with 30-day retention, one-line Vercel AI SDK OpenTelemetry integration) as the primary observability/eval tool and **Braintrust** (best TS eval ergonomics, CI gating) as the fallback; ship a small but real eval suite covering extraction accuracy, tool-call correctness, groundedness and recap completeness.

## Key Findings

1. **The architecture that wins the interview is "LLM as interface, backend as truth."** Every commercial fact (vessel exists, vessel type/capability, availability, region/port match, fixture status, weather-window suitability, rate/budget fit, recap completeness) is decided by a deterministic tool backed by seeded Postgres data or the Open-Meteo Marine API — never by the model's own knowledge. This is both a safety property and the single clearest signal of engineering judgment you can show SSY's offshore tech lead.

2. **The Vercel AI SDK is the right orchestration layer for a TypeScript/Next.js stack.** It provides `generateText`, `generateObject`/`streamObject`, `streamText`, first-class tool calling with Zod `inputSchema`, the `useChat` React hook, and — in AI SDK 6 — a built-in `needsApproval` flag for human-in-the-loop tool approval. It is provider-agnostic, so you can run Anthropic Claude (tool use) or OpenAI (structured outputs) behind the same code.

3. **Structured output is a solved problem when you stack three layers:** provider-native constrained decoding (OpenAI Structured Outputs / Anthropic tool use with `strict`), the AI SDK's schema enforcement, and your own Zod `safeParse` with an error-feedback retry loop. Do not trust any single layer.

4. **Langfuse is the best-fit observability tool for this demo:** MIT-licensed, self-hostable, genuine JS/TS SDK, free Hobby cloud tier, and it captures Vercel AI SDK traces automatically through OpenTelemetry with a single span processor. Braintrust is the strong fallback for eval-first workflows and CI gating with an excellent TypeScript SDK (`braintrust` + `autoevals`).

5. **Hallucination control is layered, not magic:** ground every claim in a tool result, force the model to cite the tool/record it used, refuse when data is missing, run groundedness/faithfulness evals (LLM-as-judge comparing claims to tool outputs), and keep a complete audit log so any answer can be traced back to its evidence.

6. **SSY genuinely has an offshore broking division**, which makes this demo unusually well-targeted. SSY (rebranded from Simpson Spence and Young in October 2023) calls itself the world's largest independent shipbroker; it launched a dedicated offshore division in 2023, opened an Aberdeen office, and in January 2025 expanded its "Offshore Vessels division." Its offshore proposition spans Oil, Gas, Subsea, Renewables and Newbuilding. Map every feature to the real offshore workflow: charterer requirement → vessel shortlist → fixture → recap (a SUPPLYTIME-style recap) → weather window.

## Details

### 1. Product architecture: from user message to final response

**Stack.** Next.js (App Router) front end + React; a Node.js backend chat endpoint (Next.js Route Handler or Server Action); PostgreSQL via Prisma; the Vercel AI SDK (`ai` + a provider package like `@ai-sdk/anthropic` or `@ai-sdk/openai`) as orchestration; Zod for schemas; Open-Meteo Marine API for real weather; Langfuse for tracing/evals.

**The pipeline (single turn):**

1. **User message** arrives in the copilot side panel (`useChat` from `@ai-sdk/react`). The raw message text is preserved verbatim in the DB before anything else.
2. **Chat endpoint** (`/api/chat`) loads the session and prior messages from Postgres, builds the system prompt (with grounding rules), and calls `streamText`/`generateText` with the tool set and `experimental_telemetry: { isEnabled: true }`.
3. **The model decides** whether to (a) ask a clarifying question, (b) call a tool, or (c) answer. With `tool_choice: auto` (Anthropic) the model chooses each turn; the system prompt nudges it to investigate via tools before answering.
4. **Tool calls execute on the server.** Each tool validates its LLM-supplied input with Zod `safeParse`, runs a deterministic Prisma query or Open-Meteo fetch, and returns a compact, high-signal JSON result (stable IDs, only the fields the model needs to reason about the next step — per Anthropic's tool-design guidance).
5. **The AI SDK feeds tool results back** into the model (the tool loop / `ToolLoopAgent`), which then composes a grounded natural-language answer that references the evidence (vessel IDs, rates, wave heights) returned by tools.
6. **Structured artifacts** (extracted requirement, recap draft) are produced via `generateObject` or an `Output.object` schema and validated again with Zod.
7. **Human-in-the-loop:** writes (save requirement, save fixture, finalise recap) are gated. The model proposes; the user confirms in the UI; only then does a write tool run.
8. **Everything is logged**: messages, tool calls (inputs/outputs/latency/errors), extracted drafts, eval scores and hallucination flags go to Postgres (source of truth for the app) and to Langfuse (observability).

Per the Vercel AI SDK docs, `generateObject` "uses the AI provider's structured output mode (JSON mode for OpenAI, tool-use for Anthropic) to ensure the response always matches your schema. If the initial response fails validation, the SDK automatically retries with corrective prompting." This is exactly the behaviour you want for requirement extraction.

**Anthropic tool use** (per platform.claude.com): the model returns `stop_reason: "tool_use"` with one or more `tool_use` blocks; your code executes them and returns `tool_result` blocks. Adding `strict: true` to tool definitions makes Claude's tool inputs match your schema exactly. **OpenAI Structured Outputs** (per OpenAI's docs) guarantees schema adherence via `response_format: { type: "json_schema", strict: true }` or `strict: true` on a function. Per OpenAI's launch post *Introducing Structured Outputs in the API*: "On our evals of complex JSON schema following, our new model gpt-4o-2024-08-06 with Structured Outputs scores a perfect 100%. In comparison, gpt-4-0613 scores less than 40%." (Treat this as a historical August 2024 launch benchmark, not a guarantee.) The AI SDK abstracts both providers behind one API.

### 2. What the LLM may and may not do

**Allowed (interface tasks):**
- Parse a free-text charterer message into a structured requirement draft.
- Ask follow-up questions when required fields are missing.
- Decide which backend tool to call and with what arguments.
- Summarise and explain tool outputs in plain English ("These three PSVs match because…").
- Draft recap text *after* the user confirms the underlying fixture details.

**Forbidden (truth-claiming tasks):**
- Invent or alter vessel names, specs, availability, location, day-rates or weather values.
- Assert a vessel is available/suitable without a tool result that says so.
- Save a requirement, fixture or recap without explicit user confirmation.
- Make commercial recommendations not supported by returned evidence.

**How to enforce it — system prompt design.** The research consensus (Microsoft Azure AI, Parasoft, MachineLearningMastery, multiple arXiv surveys) is consistent: ground the model in supplied facts, instruct it to only use tool data, give it an explicit "say I don't know / I need to check" escape hatch, set temperature low (~0) for extraction, and use structured outputs to constrain format. A workable system-prompt skeleton:

- **Role:** "You are a shipbroking copilot. You help brokers turn charterer requirements into vessel shortlists and recaps."
- **Hard grounding rule:** "You must NOT state any vessel, availability, rate or weather fact unless it appears in a tool result from this conversation. If you don't have a tool result, call the relevant tool or tell the user you need to check."
- **Clarify-first rule:** "If required fields (vessel type, region/port, start date, duration) are missing, ask one concise clarifying question instead of guessing."
- **Confirmation rule:** "Never call a write/save tool until the user has explicitly confirmed the details you displayed."
- **Citation rule:** "When explaining a shortlist, reference the vessel IDs and the specific fields (rate, deck area, location) returned by the tools."

This maps to the "ICE" method (Instructions, Constraints, Escalation) Microsoft recommends, plus chain-of-verification patterns.

### 3. Tool calling design

Anthropic's tool-design guidance (the "Writing effective tools for agents" engineering post and the Define-tools docs) gives the rules to follow: **clear, detailed descriptions matter more than anything**; consolidate related operations; use meaningful names; return only high-signal fields with stable IDs; provide `input_examples` for complex schemas; return informative error messages (`is_error: true`) so the model can recover. Validate the model's tool input in your own code before executing. (Anthropic notes that even small refinements to tool descriptions can produce large accuracy gains — e.g. their SWE-bench improvements from refined descriptions.)

Proposed tool set (each with purpose / input schema / output schema / validation / errors / logging):

| Tool | Purpose | Input (Zod) | Output | Key validation | Errors | Log |
|---|---|---|---|---|---|---|
| `createRequirementDraft` | Turn message into structured requirement | `{ rawMessage: string }` | `RequirementDraft` (vesselType, region, port, startDate, durationDays, maxDayRate, capabilities[], missingFields[]) | Enum vessel types; ISO dates; positive duration | — (pure extraction) | input, output draft, confidence |
| `validateRequirementCompleteness` | Check required fields present | `RequirementDraft` | `{ complete: boolean, missing: string[] }` | Required set: type, region/port, start, duration | — | which fields missing |
| `searchVessels` | Find candidate vessels in DB | `{ vesselType, region/port, availableFrom, durationDays, maxDayRate? }` | `Vessel[]` (id, name, type, deckAreaM2, region, availFrom/To, dayRate, capabilities) | Region/port must exist in DB; type enum | empty result is valid, not error | query, result count, IDs |
| `rankVesselMatches` | Score/sort candidates vs requirement | `{ requirementId, vesselIds[] }` | `RankedMatch[]` (vesselId, score, reasons[]) | vesselIds must exist | unknown vessel → error | scores, reasons |
| `getWeatherWindow` | Real marine forecast for port/date range | `{ lat, lon, startDate, endDate }` | `{ daily: [{date, waveHeightMax, ...}], suitable: boolean, limitFactor }` | Coords in range; date window ≤ forecast horizon | API/network error → `is_error` | request URL, raw response, verdict |
| `getFixtureById` | Fetch a fixture's current status | `{ fixtureId }` | `Fixture` (status, vessel, charterer, terms) | UUID format; existence | not found → error | id, status |
| `generateRecapDraft` | Draft recap text from confirmed fixture | `{ fixtureId }` (must be confirmed) | `RecapDraft` (structured fields + text) | Fixture must exist and be user-confirmed | refuse if unconfirmed | draft fields, completeness |

The weather tool is the one place real external data enters. **Open-Meteo Marine API** (`/v1/marine`, no API key for non-commercial use) returns hourly `wave_height`, wave period/direction (wind/swell/combined) and sea-surface temperature. Per Open-Meteo's announcement (Patrick Zippenfenig): "The Marine Weather API is using global wave models from the German Weather Service (DWD) with 28 km resolution and European models with 5 km resolution. Both models update twice daily and provide forecasts for 7 days." (Note: the 5 km European model itself "forecasts only 3 days" before the global model takes over.) For the Aberdeen example this matters: "The 5 km European model covers the United Kingdom, southern coasts of Norway, the Mediterranean sea, France and Western Africa until Mauritania," and "For API calls with a coordinate in Europe, the high resolution 5 km model will be selected automatically." Your tool should convert wave-height thresholds into a deterministic "suitable / marginal / unsuitable" verdict (e.g. PSV cargo ops limited above a configured significant wave height) so the *backend* — not the LLM — decides suitability.

### 4. Structured output / schema strategy

Recommended approach for this stack, in priority order:

1. **Define every structured shape as a Zod schema** (single source of truth for both the LLM contract and your TypeScript types via `z.infer`). Zod is a "TypeScript-first validation library" and its `safeParse` returns a discriminated union you handle without try/catch.
2. **Pass the Zod schema to the AI SDK** — `generateObject({ schema })` for extraction and `tool({ inputSchema })` for tool args. The SDK converts it to provider-native structured output (OpenAI json_schema strict / Anthropic tool use) and retries on validation failure.
3. **Re-validate with `safeParse` in your own code** after generation and on every tool input — defence in depth. Models "wrap, prefix, suffix and annotate" JSON, so parse defensively.
4. **Retry with error context** when validation fails: feed Zod's specific issue messages back to the model ("Expected ISO date at startDate"). One community write-up reports this resolves the large majority of validation failures on the second attempt for capable models; treat that as indicative, not guaranteed (date: June 2026, subject to change).
5. **Deterministic post-processing** for anything safety-critical: normalise dates, coerce numbers, snap regions/ports to known DB enums. Never let a free-text region reach a query unmapped.

This stack gives you provider-portability (Anthropic ↔ OpenAI) and a guarantee that nothing malformed reaches Postgres.

### 5. Hallucination risk map

For each failure mode: how it happens / severity / prevention / detection / user-facing fallback.

| Failure mode | How it happens | Severity | Prevention | Detection | Fallback |
|---|---|---|---|---|---|
| **Invented vessel** | Model names a vessel not in DB | Critical | Only render vessels from `searchVessels`; never let model emit vessel names freely | Cross-check every vessel ID/name in answer against tool output (groundedness eval) | "No matching vessels in the system" |
| **Wrong vessel status** | Model says "available" without checking | Critical | Availability only from DB tool | Faithfulness judge vs tool result | Show actual status badge from DB |
| **Wrong location/region** | Model assumes port matches region | High | Snap to DB region/port enums; deterministic match | Compare claimed region to vessel record | Ask to confirm region |
| **Wrong weather interpretation** | Model misreads forecast / invents wave height | High | Backend computes suitability verdict, not LLM | Compare narrative to `getWeatherWindow` output | Show raw forecast chart + verdict |
| **Wrong day-rate estimate** | Model guesses a market rate | High (commercial) | Rates only from DB; forbid market estimates in prompt | Numeric check vs vessel record | "Rate not available; shown from records only" |
| **Unsupported shortlist explanation** | "Reasons" not backed by data | Medium | `rankVesselMatches` returns explicit reasons; model must reuse them | Judge: is each reason traceable to a field? | Show structured reasons table |
| **Missing required fields** | Model proceeds with gaps | Medium | `validateRequirementCompleteness` gate | Completeness eval | Ask clarifying question |
| **Overconfident recommendation** | Strong claim on thin data | Medium | Prompt for calibrated language; surface confidence | LLM-as-judge tone/confidence check | Add uncertainty note |
| **Recap with unconfirmed terms** | Recap includes terms user never agreed | Critical (legal) | `generateRecapDraft` only on confirmed fixture; HITL | Diff recap fields vs confirmed fixture | Block save; highlight unconfirmed fields |

Underpinning techniques (from the grounding/RAG literature): retrieval/tool-grounding turns "recall from memory" into "answer from these facts" (Parasoft/Azure); **faithfulness/groundedness** = every claim in the answer must be inferable from the provided context (Datadog, Future AGI, Maxim). Use claim-extraction + verification against tool outputs as your core hallucination metric. Note the subtle trap (Future AGI): a faithfulness judge passes a wrong attribution if the context happens to support it — so for citations, check the cited record ID directly, not just surface plausibility.

### 6. Observability tools compared (2025–2026; pricing subject to change — verified June 2026)

| Tool | License / self-host | TS/Node SDK | Tracing | Prompt/version mgmt | Datasets/Evals | Free tier | 5-day demo fit |
|---|---|---|---|---|---|---|---|
| **Langfuse** | MIT, fully self-hostable | Yes (genuine JS/TS SDK v4+, OTel-based) | Yes | Yes | Yes (LLM-as-judge, datasets) | Hobby: free (no card), exactly 50,000 units/mo, 30-day retention, 2 seats, hard cap (no overage) | **Best** — one-line Vercel AI SDK OTel integration |
| **Braintrust** | Proprietary SaaS (self-host enterprise) | Yes (`braintrust` + `autoevals`, first-class TS) | Yes | Yes | **Best-in-class**, CI gating via GitHub Action | Free tier (generous span allowance, often cited ~1M spans) | Strong fallback — eval-first |
| **LangSmith** | Proprietary (self-host enterprise only) | Yes | Yes | Yes | Mature evals | Free Developer: ~5k traces/mo, 1 user | Good, but best with LangChain |
| **Arize Phoenix** | OSS (Elastic 2.0), self-host | Yes (OpenInference/OTel) | Yes | Limited | Strong eval templates | Free self-host (unlimited) | Good if you want OTel-native + self-host |
| **Helicone** | Apache 2.0, self-host | Proxy (base-URL change) | Request/response | Basic | Basic | Free ~10k req/mo | Fastest to log, shallow for agents |
| **Traceloop / OpenLLMetry** | Apache 2.0 SDK | Yes | OTel instrumentation | — | — | — | Portable ingest layer, not a full UI |
| **W&B Weave** | Proprietary | Yes | Yes | Yes | Yes | Free tier | Overkill unless already on W&B |

**Recommendation: Langfuse primary, Braintrust fallback.** Langfuse wins for this project because: (1) it's MIT/self-hostable so nothing about the demo is locked to a vendor; (2) it has a real TS SDK (not Python-only); (3) the Vercel AI SDK integration is literally adding a `LangfuseSpanProcessor` to an OpenTelemetry `NodeSDK` and setting `experimental_telemetry: { isEnabled: true }` on your AI SDK calls — traces, tool calls, token costs and latency appear automatically; (4) the free Hobby tier (50,000 units/month, 30-day retention) covers a demo comfortably. Use Braintrust if you want the slickest TypeScript eval-in-CI experience (`Eval()` + `autoevals` scorers + GitHub Action posting results on PRs).

### 7. Eval strategy

Build a small but real eval suite. Categories and concrete offshore-broking test cases:

**Extraction accuracy.** Golden input/expected pairs. The flagship case:
- *Input:* "I need a PSV near Aberdeen next Monday for 10 days, deck cargo, ideally under 18k a day."
- *Expected extraction:* `vesselType: "PSV"` (Platform Supply Vessel), `region: "North Sea"`, `port: "Aberdeen"`, `startDate: <next Monday, resolved to ISO>`, `durationDays: 10`, `maxDayRate: 18000`, `currency: "GBP"`, `capabilities: ["deck cargo"]`, `missingFields: []` (or `["redelivery port"]` depending on your required set).
- Score with field-level exact/normalised match (dates normalised; `£18k` → 18000).

Additional extraction cases: "AHTS, West Africa, 30 days, anchor handling, open dates" (looser dates → `missingFields: ["startDate"]`); "something for a survey job off Norway next month" (ambiguous type → model should ask, not guess).

**Tool-call correctness.** Assert the model calls the right tool with the right args: the Aberdeen case should trigger `searchVessels({vesselType:"PSV", port:"Aberdeen", durationDays:10, maxDayRate:18000})`, not answer from memory. Score: correct tool selected, args schema-valid, args semantically correct.

**Groundedness/faithfulness.** Take the final answer + the tool outputs as context; run an LLM-as-judge that extracts each claim and checks it's supported. Catch invented vessels/rates. (Pattern from Datadog/Future AGI/Braintrust autoevals `Factuality`.)

**Hallucination/refusal-safety.** Negative cases: "Find me the cheapest rig off Brazil" when DB has none → expected: graceful "no matches", **not** an invented vessel. "What's the day rate for the Skandi Aberdeen?" with no record → expected refusal/"not in records."

**Recap completeness.** Given a confirmed fixture, the recap draft must contain all required SUPPLYTIME-style fields (see §9/§11). Score: % of required fields present and matching the confirmed fixture; **zero unconfirmed terms** (hard fail if present).

**Regression evals for prompt changes.** Run the whole suite on every prompt/model change in CI. Braintrust's GitHub Action posts a comment with score deltas; Langfuse supports datasets + scores via SDK/API. Block merges that drop extraction accuracy or groundedness below threshold (e.g. extraction ≥ 0.9, groundedness = 1.0 on the negative set).

Implementation: with Braintrust, an eval is `Eval("name", { data, task, scores: [Factuality, customExtractionScorer] })` in a `.eval.ts` file run via `npx braintrust eval`. With Langfuse, push a dataset and attach LLM-as-judge or code evaluators to the traces.

### 8. Human-in-the-loop confirmation flow

The pattern (AI SDK 6 + general HITL research):
1. Model extracts a requirement → UI shows it as **editable structured fields**, with assumptions highlighted (e.g. "next Monday → 2026-06-15 — correct?") and missing fields flagged.
2. User edits/confirms. The **original raw message is preserved** alongside the confirmed version.
3. Only on confirmation does the `saveRequirement` write tool run.
4. Same gate for fixtures and recaps: `generateRecapDraft` produces a draft; the broker reviews; a `finalizeRecap` write tool runs only after explicit approval.
5. The final accepted version, the user's corrections, and a diff vs the model's proposal are all logged.

AI SDK 6 makes this ergonomic: set `needsApproval: true` on a tool (or a function of its input) and handle the approval in `useChat` via the tool-invocation state + `addToolApprovalResponse`. By default tools auto-run; approval pauses execution until the user decides. This is the single most important safety feature to demo: *the AI proposes, the broker disposes.*

### 9. Database / audit-log model (Prisma / PostgreSQL)

Core principle: the app DB is the source of truth and the audit trail; observability (Langfuse) is a parallel, not a replacement. Proposed models:

```prisma
model ChatSession {
  id            String   @id @default(cuid())
  userId        String
  createdAt     DateTime @default(now())
  messages      Message[]
  requirements  RequirementDraft[]
}

model Message {
  id          String   @id @default(cuid())
  sessionId   String
  role        MessageRole            // enum: USER | ASSISTANT | TOOL | SYSTEM
  content     String                 // raw text preserved verbatim
  parts       Json?                  // AI SDK message parts (text, tool calls)
  createdAt   DateTime @default(now())
  toolCalls   ToolCall[]
  session     ChatSession @relation(fields: [sessionId], references: [id])
}

model ToolCall {
  id          String   @id @default(cuid())
  messageId   String
  toolName    String
  input       Json
  output      Json?
  isError     Boolean  @default(false)
  errorText   String?
  latencyMs   Int?
  createdAt   DateTime @default(now())
}

model RequirementDraft {
  id            String   @id @default(cuid())
  sessionId     String
  rawMessage    String                 // original charterer text
  extracted     Json                   // structured fields as extracted
  confirmed     Json?                  // user-confirmed version
  missingFields String[]
  status        DraftStatus @default(DRAFT)   // DRAFT | CONFIRMED | DISCARDED
  confidence    Float?
  createdAt     DateTime @default(now())
}

model EvalResult {
  id          String   @id @default(cuid())
  targetType  String                 // 'message' | 'requirement' | 'recap'
  targetId    String
  metric      String                 // 'extraction' | 'groundedness' | ...
  score       Float
  passed      Boolean
  detail      Json?
  createdAt   DateTime @default(now())
}

model HallucinationFlag {
  id          String   @id @default(cuid())
  messageId   String
  type        String                 // 'invented_vessel' | 'unsupported_claim' | ...
  evidence    Json
  resolved    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model UserCorrection {
  id            String   @id @default(cuid())
  requirementId String
  field         String
  fromValue     Json?
  toValue       Json?
  createdAt     DateTime @default(now())
}
```

Audit best practices (Prisma community guidance): a single unified audit/log table or per-entity history; capture who/what/when; consider a Prisma client extension or middleware so writes are logged automatically; use enums (e.g. `MessageRole`) for type safety; index foreign keys. For richer automatic change-tracking you could use a Prisma extension/`$transaction` to write an audit row alongside each mutation (or a tool like Bemi for context-aware Postgres audit trails), but for a demo explicit `ToolCall`/`UserCorrection` rows are clearer and easier to narrate.

### 10. UI design — copilot, not chatbot

The dashboard stays primary; the AI is a **copilot side panel**, not a full-screen chatbot. This maps to the "side-panel / inline copilot" generative-UI pattern (CopilotKit's `CopilotSidebar`, assistant-ui). Key elements:
- **Dashboard remains the main surface**; the copilot lives in a collapsible right-hand panel.
- **Extracted requirement as editable structured fields** (not buried in chat text), with assumptions and missing fields highlighted.
- **Vessel shortlist rendered as cards with evidence** — each card shows the DB fields (deck area, region, availability, day-rate) that justify the match, plus the ranked reasons from `rankVesselMatches`.
- **Weather window as a chart** with the backend's suitability verdict, not a sentence the LLM wrote.
- **Warnings when data is missing/uncertain** (amber banners) and a clear **confirm** affordance for any save.

For implementation you can use the AI SDK's `useChat` with tool-invocation rendering (map each tool call to a React component — "generative UI"), or CopilotKit/assistant-ui if you want pre-built copilot primitives. The constrained "controlled generative UI" pattern (agent picks which pre-built component to show; never invents layout) is the safest and is exactly what you want here — the model chooses *which* vessel card to render, your code owns *how* it renders. (Note: AI SDK RSC-based generative UI is currently paused; the team recommends client-side `useChat` with tool invocations.)

### 11. Implementation plan (packets)

**PACKET-002 — AI Broker Copilot Research + Safety Spec**
- *Goals:* lock the architecture ("LLM as interface"); define tool contracts (Zod schemas) and the system prompt; write the hallucination risk map and the eval plan; choose Langfuse.
- *Non-goals:* no production hardening; no multi-user auth.
- *Files:* `docs/ai-safety-spec.md`, `lib/ai/schemas.ts` (Zod), `lib/ai/system-prompt.ts`, `docs/eval-plan.md`.
- *Tests:* Zod schema unit tests; prompt snapshot test.
- *Acceptance:* every tool has purpose/input/output/validation/errors/logging documented; the allowed-vs-forbidden list is explicit.
- *Demo script:* walk the interviewer through the spec and *why* the DB is the source of truth.

**PACKET-003 — AI Broker Copilot Implementation**
- *Goals:* working copilot — chat endpoint, tool set, `generateObject` extraction, vessel search/rank, Open-Meteo weather tool, HITL confirmation, recap draft.
- *Non-goals:* full eval automation (that's 004).
- *Files:* `app/api/chat/route.ts`, `lib/ai/tools/*.ts`, `lib/ai/extract.ts`, `components/copilot/*`, Prisma schema + seed (`prisma/seed.ts` with realistic OSV fleet, ports, fixtures), `lib/weather/open-meteo.ts`.
- *Tests:* tool unit tests (search returns seeded vessels; weather verdict deterministic); extraction integration test on the Aberdeen case; HITL gate test (no save without confirm).
- *Acceptance:* the Aberdeen message produces a correct structured requirement, a real shortlist from seeded data, a real weather window from Open-Meteo, and a recap only after confirmation; no write occurs without approval.
- *Demo script:* type the Aberdeen message → show extraction → clarify missing field → show shortlist with evidence → show weather window → confirm fixture → generate recap.

**PACKET-004 — Evals + Observability Hardening**
- *Goals:* Langfuse tracing live; eval suite (extraction, tool-call, groundedness, refusal, recap completeness); regression run in CI; hallucination flags surfaced in UI.
- *Non-goals:* large-scale load testing.
- *Files:* `instrumentation.ts` (LangfuseSpanProcessor), `evals/*.eval.ts`, `.github/workflows/evals.yml`, `lib/ai/judges/*.ts` (groundedness judge).
- *Tests:* eval suite runs green on golden set; CI fails on injected regression (e.g. prompt that drops grounding).
- *Acceptance:* traces visible in Langfuse with tool calls + costs; eval scores recorded to `EvalResult`; a deliberately bad prompt is caught by CI.
- *Demo script:* show a Langfuse trace of one conversation; show the eval dashboard; show a regression being blocked.

### 12. Interview talking points (for Joe Alexander, offshore tech lead, SSY)

- **"The LLM is an interface, not a database."** Every commercial fact comes from Postgres or Open-Meteo via a typed tool; the model never invents vessels, rates or weather. This is the headline.
- **AI-first thinking with engineering judgment.** I used the LLM where it's genuinely good (understanding messy charterer English, drafting recaps) and kept deterministic code where correctness matters (availability, capability match, suitability verdicts).
- **Structured outputs + backend validation.** Zod schemas are the contract; the AI SDK enforces them at the provider level; I re-validate with `safeParse` and retry with error feedback — nothing malformed reaches the DB.
- **Human-in-the-loop.** The broker confirms every requirement and every recap before anything is saved; the original message is always preserved. The AI proposes, the broker disposes.
- **Observability and evals.** Langfuse traces every conversation (tool calls, latency, cost); a real eval suite (extraction, groundedness, refusal, recap completeness) runs in CI and blocks regressions — I treat prompt changes like code changes.
- **It maps to the real offshore workflow.** Charterer requirement → vessel shortlist → fixture → recap → weather window mirrors how an OSV desk actually works, and the recap models SUPPLYTIME-style fields. SSY launched a dedicated offshore division in 2023 with an Aberdeen office and expanded its Offshore Vessels division in 2025 (covering Oil, Gas, Subsea, Renewables and Newbuilding), so this isn't a toy domain — it's your domain.

## Glossary of AI terms

- **Hallucination** — when an LLM produces confident-sounding output that isn't supported by real data (e.g. inventing a vessel or a day-rate). The core risk this whole design exists to contain.
- **Groundedness / faithfulness** — the property that every claim in an answer can be traced back to (is "inferable from") the supplied context/tool outputs. Measured by extracting each claim and checking it against the evidence.
- **Eval** — an automated test for an LLM feature: a dataset of inputs + expected behaviour, scored by exact-match, heuristics, or an LLM-as-judge. Run in CI like unit tests.
- **Trace** — the full recorded timeline of one request through the system (the message, the model calls, the tool calls, the final answer), viewable in an observability tool like Langfuse.
- **Span** — one operation within a trace (a single model call, a single tool execution, a DB query), with its own inputs, outputs, latency and metadata. A trace is a tree of spans.
- **Tool call (function calling)** — the model emitting a structured request to run one of your defined functions (e.g. `searchVessels`) with arguments; your code executes it and returns the result for the model to use.
- **Structured output** — model output constrained to a defined schema (JSON Schema / Zod), so it's reliably parseable. Achieved via provider features (OpenAI Structured Outputs, Anthropic tool use) plus your own validation.
- **Human-in-the-loop (HITL)** — a design where the system pauses for human review/approval before consequential actions (saving a requirement, finalising a recap). In AI SDK 6, the `needsApproval` flag implements this.
- **Confidence score** — a number indicating how sure the model/system is about an output (e.g. extraction confidence). Use it to flag low-confidence results for human review; never treat it as ground truth.
- **Audit log** — an immutable record of what happened: messages, tool calls, extracted drafts, user corrections, confirmed versions. Lets you reconstruct and defend any answer the system gave.

## Recommendations

**Stage 1 (Day 1–2): Spec + skeleton.** Lock the "LLM as interface" architecture, write the Zod schemas and system prompt, seed a realistic OSV dataset (PSVs/AHTS, North Sea + West Africa ports, day-rates, availability windows, a couple of fixtures). Stand up `useChat` + `/api/chat` with one tool (`createRequirementDraft`) end-to-end. **Benchmark to proceed:** the Aberdeen message extracts correctly and round-trips to the UI.

**Stage 2 (Day 2–4): Full tool loop + HITL.** Add `searchVessels`, `rankVesselMatches`, `getWeatherWindow` (real Open-Meteo), `getFixtureById`, `generateRecapDraft`, and the confirmation gates. Wire Langfuse tracing from the start. **Benchmark:** full demo flow works and no write happens without confirmation.

**Stage 3 (Day 4–5): Evals + polish.** Build the eval suite, add the groundedness judge, run it in CI, surface hallucination flags in the UI, polish the copilot panel. **Benchmark:** extraction ≥ 0.9 and groundedness = 1.0 on the negative set; a deliberately weakened prompt is caught.

**Thresholds that change the plan:** if extraction accuracy is low, switch the extraction model to a stronger one and add `input_examples`/few-shot before adding more tools. If groundedness ever fails on the negative set (invented vessel), stop and tighten the prompt + add a hard post-check that every vessel mentioned exists in the last tool output — this is the one bug that would actually embarrass you in the interview. If the 5-day budget slips, cut breadth (fewer tools) before cutting the safety story (HITL + groundedness eval), because the safety story is what differentiates you.

**Model choice:** use Anthropic Claude (tool use + `strict`) or OpenAI (Structured Outputs) — both work behind the AI SDK. Pick whichever you have a key for; keep the provider swappable via the AI SDK so you can say "it's provider-agnostic."

**The recap data model (SUPPLYTIME-aligned).** Model your `Fixture`/`RecapDraft` on BIMCO SUPPLYTIME 2017 — the industry-standard OSV time-charter party — whose PART I "boxes" are effectively a structured recap: vessel name + IMO, owner/disponent owner, charterer, hire rate per day + currency, period of hire (+ extension options), delivery port + date, redelivery port + notice, laycan/cancelling date & time, mobilisation fee, demobilisation fee, fuel/bunkers clause, area of operation + restricted service, plus invoicing/payment/off-hire/law. End the recap with **"subjects"** (subject to survey, subject board approval/BOD, subject details) and treat a fixture as binding only once all subjects are lifted — a detail that will land well with a shipbroking audience.

## Caveats

- **Pricing and free-tier details change.** All observability pricing above was gathered around June 2026 from vendor pages and third-party comparisons and should be re-verified before relying on it. Langfuse Hobby (free, no credit card, exactly 50,000 units/mo, 30-day retention, 2 seats, hard cap with no overage), Braintrust free tier span allowance, LangSmith free Developer (~5k traces), and Helicone (~10k req/mo) are the figures cited by current sources but are subject to change.
- **Vercel AI SDK is moving fast.** AI SDK 6 introduced `needsApproval`, `ToolLoopAgent`, stabilised structured outputs with tool calling, and DevTools; some APIs referenced (e.g. `Output.object`, `experimental_telemetry`) carry "experimental" status and exact signatures may shift. Pin your version and check the docs at ai-sdk.dev.
- **Open-Meteo is free for non-commercial use only** and forecasts ~7 days for marine (5 km European model only 3 days before the global 28 km model takes over); a real SSY product would need a commercial marine data agreement and a longer horizon. For a portfolio demo it's ideal and genuinely "real external data."
- **Groundedness judges are imperfect.** LLM-as-judge can miss subtle errors and a faithfulness judge can pass a wrong attribution that the context happens to support; for commercial-critical claims (rates, vessel identity) back the judge with deterministic checks against record IDs.
- **This is a demo, not a fixture system of record.** Recaps drafted here are illustrative; a binding fixture is only formed when all "subjects" are lifted, and nothing in the demo should be presented as a legally concluded charter.
- **SSY's offshore division is relatively new and still expanding** (launched 2023, expanded 2025); describe it accurately as a dedicated offshore vessels division rather than a decades-old desk. Company facts (rebrand date, division launch, office locations) were gathered from SSY press materials and trade press and should be sanity-checked against ssyglobal.com before the interview.

### Primary sources to cite
- **Vercel AI SDK:** ai-sdk.dev (generateObject, tool calling, telemetry); vercel.com/blog/ai-sdk-6 (needsApproval, ToolLoopAgent).
- **Anthropic:** platform.claude.com (tool use overview, implement tool use); anthropic.com/engineering/writing-tools-for-agents.
- **OpenAI:** developers.openai.com (Structured Outputs); openai.com/index/introducing-structured-outputs-in-the-api.
- **Zod:** zod.dev (basics, safeParse, z.infer).
- **Langfuse:** langfuse.com/pricing, langfuse.com/integrations/frameworks/vercel-ai-sdk.
- **Braintrust:** braintrust.dev/docs/evaluation; github.com/braintrustdata/autoevals.
- **Arize Phoenix / Helicone / LangSmith:** comparison sources (firecrawl.dev, laminar.sh, braintrust.dev articles).
- **Hallucination/groundedness:** datadoghq.com/blog/ai/llm-hallucination-detection; futureagi.com; getmaxim.ai.
- **Open-Meteo Marine:** open-meteo.com/en/docs/marine-weather-api; openmeteo.substack.com.
- **Offshore domain:** ssyglobal.com/services/offshore; bimco.org (SUPPLYTIME 2017); balticexchange.com (chartering negotiations); shipownersclub.com (fixtures "on subs"); clarksons.com (PSVs).