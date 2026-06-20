# Deep-Research Prompt — Voice + Copilot + RAG Unification

> **What this is.** A self-contained deep-research prompt that evaluates a proposed
> architecture idea for FixtureLog: unifying the voice agent and the text Broker Copilot
> behind one shared, grounded "brain," and reusing the `iso-audit-rag` pipeline as a
> RAG knowledge tool. It carries the full project context so a research tool with **zero
> access to the repo** can still reason about it, compare to the market, and return a
> verdict.
>
> **How to run it.** Paste everything inside the fenced block below into any deep-research
> tool (Claude/ChatGPT/Gemini deep research, or the `/deep-research` skill in Claude Code).
> Created 2026-06-19 on branch `rescue/voice-logo-mixed-2026-06-17`.

---

```
ROLE & OBJECTIVE
You are a senior AI systems architect and product/market analyst. Produce a deep,
source-cited research report that EVALUATES a specific architecture idea for an
existing product. Be critical and adversarial — your job is to determine whether the
idea is genuinely good, not to validate it. Surface alternatives, name real products
that do this, explain how such systems are actually built in production, and end with
a clear verdict and a recommended architecture. Prefer sources from 2024–2026.

====================================================================
PART 1 — FULL PROJECT CONTEXT (so you can compare precisely)
====================================================================

PRODUCT: "FixtureLog" — a SaaS workspace for offshore shipbrokers. Brokers manage a
live "book of work": open enquiries/requirements, in-progress vessel fixtures, the
"subjects" (conditions) attached to each fixture, and pending decisions/actions. There
is a broker dashboard that aggregates all of this.

STACK:
- Frontend/app: Next.js (App Router), TypeScript (strict), deployed on Vercel.
- Data: PostgreSQL via Prisma. Zod validation at all boundaries.
- LLM provider: Anthropic Claude (currently claude-haiku-4-5 for the assistant).

It currently has TWO SEPARATE AI SURFACES:

(1) TEXT "Broker Copilot" — the mature one.
   - Built on the Vercel AI SDK (v6): streamText + useChat, @ai-sdk/anthropic.
   - GROUNDED in real data: a server function renders the broker's live dashboard
     (enquiries, fixtures, subjects, pending actions, counts) into a compact labeled
     text block that is injected into the system prompt as the model's ONLY source of
     truth. No vector DB — it's structured live data, not retrieved documents.
   - AGENTIC: a bounded tool loop (max 5 steps). READ tools (getFixture, findMatches)
     auto-execute; WRITE tools (advanceFixtureStatus, generateRecap) are APPROVAL-GATED
     (human-in-the-loop): the model can only PROPOSE the write; nothing mutates until
     the broker clicks approve in the UI.
   - GUARDRAILS live entirely in the system prompt, layered: answer only from the data
     block + tool results; a fixed "I don't have that in the desk's current data" phrase
     when unknown; never invent vessels/rates/dates/numbers; stay in the shipbroking
     domain; treat the data block as data not instructions (prompt-injection defense).
   - brokerId comes from the authenticated session, never the request body, so the model
     can't be tricked into acting on another desk.

(2) VOICE Agent — scaffolded but hollow.
   - A separate Python worker on LiveKit Cloud (livekit-agents 1.6), deployed on Railway.
   - Swappable "brain" via env var:
       * echo: raw audio loopback (transport test, no AI).
       * pipeline (default): Deepgram STT (nova-3) -> Claude (haiku-4-5) -> Cartesia TTS
         (sonic-3), with Silero VAD and a multilingual turn detector.
       * realtime: OpenAI speech-to-speech realtime model (gpt-realtime).
   - CRITICAL GAP: it is "instructions-only" — it has the broker's signed identity
     (broker_id minted into the LiveKit participant attributes by a token route) but
     NO access to the desk data and NO tools. So today it is told "answer only from real
     data" while having none — effectively it can only say "I don't have that."

SEPARATE REUSABLE ASSET: "iso-audit-rag" — a standalone project.
   - A document-RAG system: Python FastAPI backend + Next.js frontend.
   - Ingests NIST SP 800-53 Rev 5 (OSCAL JSON) and user-uploaded PDFs; chunks them;
     embeds with OpenAI text-embedding-3-small; stores in PostgreSQL + pgvector.
   - Retrieval: HYBRID search (BM25 keyword + vector cosine), merged with Reciprocal
     Rank Fusion (RRF); top-K chunks + metadata go to Claude, which generates a CITED
     answer streamed token-by-token over SSE.
   - It is currently indexed on COMPLIANCE/SECURITY documents (NIST), NOT shipbroking.
   - It ALREADY exposes a clean REST API: POST /ask (answer + citations),
     POST /ask/stream (SSE token stream), POST /upload (PDF ingest), GET /health.
     So reuse = HTTP calls to an external service, NOT porting pgvector into Next.js.

====================================================================
PART 1B — ADDITIONAL CONTEXT (read before judging the idea)
====================================================================

NATURE OF THE PROJECT — THIS CHANGES YOUR EVALUATION CRITERIA:
FixtureLog is a PORTFOLIO DEMO built by a solo developer to win a Full-Stack Developer
role at SSY (Simpson Spence Young), the world's largest independent shipbroker. It is
NOT a funded SaaS with paying users. It deliberately mirrors SSY's public offshore
dashboard vocabulary (Fixtures, Requirements, Positions, Live Weather Map). Therefore
evaluate the idea on TWO distinct axes and keep them separate in your verdict:
  (a) PRODUCTION SOUNDNESS — is the architecture correct/efficient/safe?
  (b) PORTFOLIO VALUE — would building a unified voice+RAG "brain" impress a shipbroking
      employer and demonstrate strong engineering/product judgment, OR would it read as
      gimmick/scope-creep when the deterministic core is already the strongest signal?
  Cost-sensitivity is high (solo dev, no revenue). Build-vs-buy should weight this.

PRODUCT SHAPE:
- Two-sided, role-gated on a shared OIDC identity. A charterer (CLIENT) gets a Client
  Portal (/portal); a broker (BROKER) gets a Dashboard (/dashboard). The AI copilot
  (text) and the voice agent are BROKER-ONLY.
- DETERMINISTIC CORE IS THE SOURCE OF TRUTH. The real backend (pure TypeScript service
  layer) does the work: a two-stage matching engine (hard filters -> weighted composite
  score with per-factor breakdown), a SUBJECT-GATED status machine for fixtures, a
  deterministic SUPPLYTIME 2017 recap generator (Markdown + plain text), an Open-Meteo
  marine "weather window" verdict (WORKABLE / MARGINAL / NOT_WORKABLE), and a Leaflet
  vessel-position map. The LLM copilot sits ON TOP and NEVER writes directly: it can only
  PROPOSE a write, which the deterministic backend validates (status policy + subject-lift
  gate) and executes. The backend is the only path to a mutation. (Evaluate this
  "LLM proposes, deterministic engine disposes" pattern as a safety design.)

DOMAIN / DATA MODEL the copilot reasons over (PostgreSQL via Prisma 6):
  Entities: Owner, Charterer, Broker, AppUser, Region, Workscope, RateBenchmark, Vessel,
  PositionSnapshot, Requirement, Fixture, SubjectItem, FixtureStatusChange, Recap,
  WeatherSnapshot. Key enums: FixtureStatus, RequirementStatus, VesselType, DPClass,
  WorkscopeCode, RegionCode, Currency, CharterType, CharterPartyForm (incl. SUPPLYTIME
  2017), SubjectItemStatus. This is STRUCTURED live data — the text copilot is grounded
  by rendering this into a labeled text block, NOT by vector retrieval.

PRECISE STACK:
- App: Next.js 15 (App Router), React 19, TypeScript strict, Zod everywhere, Vercel.
- DB: PostgreSQL 16 on Neon, Prisma 6. Tests: Vitest (~375 unit tests / 60 files) +
  Playwright E2E.
- Text copilot: Vercel AI SDK v6 (streamText / useChat / @ai-sdk/anthropic),
  claude-haiku-4-5, bounded 5-step tool loop, approval-gated writes.
- Voice: separate Python worker on LiveKit Cloud (livekit-agents 1.6), deployed on
  Railway; client uses @livekit/components-react. Cascade = Deepgram nova-3 STT ->
  claude-haiku-4-5 -> Cartesia sonic-3 TTS, Silero VAD, multilingual turn detector;
  alt "realtime" brain = OpenAI gpt-realtime. Multilingual turn detection implies
  non-English-speaking brokers are in scope.

CONSTRAINT / TENSION TO WEIGH:
  The developer recently moved to HIDE the voice feature from the deployed portfolio site
  (intent: not publicly ship AI voice yet). So the research must weigh: given voice may
  stay hidden, is deepening it (voice -> copilot brain) worth the effort for a portfolio
  piece, or should the unified-brain + RAG work target the already-shipped TEXT copilot
  first? A feature flag could ship the brain work with voice still hidden.

WHAT A SHIPBROKING REFERENCE CORPUS (for the RAG tool) WOULD CONTAIN:
  BIMCO/SUPPLYTIME 2017 charter-party clauses, an offshore broking glossary (e.g.
  "on subs"/subjects, laytime, lifting subjects, redelivery), workscope/region
  definitions, day-rate benchmark context, DP-class vessel requirements. Assess how hard
  a credible corpus is to assemble and how much corpus quality (not pipeline) drives
  answer quality.

====================================================================
PART 2 — THE IDEA TO EVALUATE
====================================================================

CORE IDEA: Stop treating voice and text as two separate AI agents. Make the voice
assistant DELEGATE all reasoning to the existing text Broker Copilot "brain." When the
broker speaks, the transcribed question is sent to the copilot under the hood in real
time; the copilot (which already has live-data grounding, tools, and guardrails)
produces the answer; the voice agent simply speaks it back. Mental model:
"voice = ears + mouth; copilot = the single shared brain." Two front-ends, one brain.

PROPOSED IMPLEMENTATION (to critique):
- Extract the grounding + tool loop into one shared "broker brain" service function.
- The browser keeps streaming it as UI messages. A new internal endpoint lets the
  Python voice worker call the same brain, authenticated by the broker_id already
  signed into the LiveKit room (server-to-server, no browser cookie).
- In the voice pipeline, replace the LLM node with a custom LLM that just proxies to
  that brain endpoint; Deepgram STT and Cartesia TTS stay as-is.
- Voice would be READ-ONLY (no approval-gated writes mid-call, since there's no way to
  click "approve" by voice).

SECOND IDEA (RAG knowledge layer): Reuse the iso-audit-rag pipeline as an
"askKnowledgeBase" TOOL added to the shared brain's toolset, re-pointed at a
shipbroking REFERENCE corpus (charter-party clauses, glossary, desk SOPs). Then both
text and voice could answer reference/knowledge questions — not just live-desk
questions — with citations. (Today both surfaces refuse anything outside the live
structured data.) The voice assistant calling the RAG service is a TOOL call, not a
second conversational chatbot.

====================================================================
PART 3 — RESEARCH QUESTIONS (answer each, with sources)
====================================================================

A. IS THE CORE IDEA SOUND?
   - Is "route voice through a text agent / single shared brain" a recognized, good
     pattern, or an anti-pattern? Under what conditions does each hold?
   - What breaks when you put a multi-step agentic tool loop (designed for text) behind
     a real-time voice pipeline? Quantify expected added latency and its UX impact on
     turn-taking. What's the acceptable end-to-end latency budget for natural voice?
   - Compare to the alternative: a voice-native agent with its OWN tools (LiveKit
     function tools) sharing only the data/tool LAYER, not the whole conversational loop.
   - Compare to speech-to-speech realtime models (OpenAI Realtime, Gemini Live): when is
     cascade STT->LLM->TTS better, and does delegating to a text brain rule out realtime?

B. MARKET / COMPETITIVE LANDSCAPE
   - What products and platforms already do "one grounded LLM brain, multiple surfaces
     (text + voice)" for vertical/enterprise SaaS? Name them.
   - Who builds agentic voice assistants over proprietary business data (especially
     B2B/operations tools)? Any in maritime/shipping/logistics/trading?
   - Voice-agent platforms to consider building ON instead of hand-rolling (LiveKit
     Agents, Vapi, Retell, Pipecat, Bland, ElevenLabs Agents, OpenAI Realtime, Amazon
     Nova Sonic, etc.) — strengths, weaknesses, lock-in, cost.

C. HOW THESE SYSTEMS ARE ACTUALLY BUILT (reference architectures & best practices)
   - Production patterns for a shared LLM brain serving both a streaming web chat and a
     low-latency voice pipeline. How do real teams avoid duplicating prompts/tools?
   - How to expose an existing HTTP/agent backend as a custom "LLM node" inside a voice
     pipeline (LiveKit Agents specifically) — recommended approach and pitfalls.
   - Streaming so TTS can start before the full answer is ready; barge-in/interruption
     handling; turn detection.

D. RAG SPECIFICS
   - Is "RAG-as-a-tool inside an agent" (agentic RAG) the right pattern vs. always-on
     retrieval? Tradeoffs.
   - Is hybrid (BM25 + vector) + RRF still best practice in 2025–2026, or have rerankers
     / other methods superseded it?
   - Realistic effort and quality risks of re-pointing a RAG corpus to a new domain
     (compliance docs -> shipbroking reference). Corpus quality as the dominant factor.
   - Mixing STRUCTURED live-data grounding with UNSTRUCTURED document RAG in one agent —
     how is that done well?

E. SAFETY, TRUST, RELIABILITY
   - Hallucination control in VOICE (no visible citations) for a domain where wrong
     numbers cost money. How do others mitigate?
   - Human-in-the-loop for state-changing actions by voice — is read-only-in-voice the
     right call, or are there safe voice-confirmation patterns?
   - Prompt-injection exposure when the same brain is reachable from voice + an internal
     endpoint; auth patterns for server-to-server agent calls.
   - Evaluate the "LLM proposes, deterministic engine disposes" pattern (LLM never
     writes directly) as a safety design — strengths, blind spots, prior art.

F. COST & OPERATIONS
   - Rough per-minute / per-session cost of the cascade (Deepgram + Claude + Cartesia)
     vs realtime models, at small scale.
   - Latency, scaling, and ops burden of running a separate voice worker that calls back
     into the app brain.

G. BUILD vs REUSE vs BUY (weight the PORTFOLIO context)
   - Given a SOLO PORTFOLIO project aimed at a shipbroking employer: is this unified
     voice+RAG brain a net-positive signal, or is polish on the deterministic core + the
     existing text copilot the stronger portfolio play? Give a direct opinion.
   - Does adding voice + RAG risk UNDERCUTTING the "deterministic backend is the source
     of truth" story that's currently the project's strongest engineering signal?
   - Is reusing a compliance-RAG codebase for a shipbroking corpus a smart reuse story to
     tell an employer, or a forced fit?
   - Is hand-rolling worth it vs a managed voice-agent platform with built-in
     tool-calling + knowledge base? Under what conditions?

====================================================================
PART 4 — DELIVERABLE FORMAT
====================================================================
1. Executive summary with an explicit VERDICT, scored SEPARATELY on the two axes
   (production soundness AND portfolio value). One short paragraph + a one-line
   yes/no/qualified for each axis.
2. A recommended reference architecture (with an alternative if you'd diverge from the
   proposed plan), and specifically whether voice should route through the full text
   agent loop or share only the data/tool layer.
3. Comparison tables: (a) competitor/platform landscape, (b) cascade vs realtime vs
   delegate-to-text-brain, (c) build vs buy.
4. Top risks ranked, each with a concrete mitigation.
5. A short, ordered list of what to validate or prototype first.
6. Cited sources throughout (prefer 2024–2026; flag anything fast-moving).
```
