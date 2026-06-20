# FixtureLog: Adversarial Evaluation of the "Unified Voice + RAG Brain" Idea

> **Source:** deep-research report run 2026-06-19 from
> [VOICE-COPILOT-RAG-UNIFICATION-DEEP-RESEARCH-PROMPT.md](VOICE-COPILOT-RAG-UNIFICATION-DEEP-RESEARCH-PROMPT.md).
> Two axes kept separate throughout: (a) production soundness and (b) portfolio value.
> Sources favor 2024–2026; fast-moving areas flagged. Artifact id: compass_wf-3fdb25db.

## TL;DR
- **Production soundness: QUALIFIED YES for the brain *refactor*, QUALIFIED NO for routing live voice through the full multi-step text agent loop.** Extracting one shared "broker brain" service is sound. But putting a text-optimized 5-step agentic tool loop *inside* a real-time voice turn routinely blows the sub-1s voice latency budget. Voice should share the DATA/TOOL layer, not the whole conversational loop.
- **Portfolio value: QUALIFIED NO for deepening voice; YES for the brain refactor shipped to the already-live text copilot behind a feature flag.** The deterministic core + the approval-gated "LLM proposes, deterministic engine disposes" text copilot is already the rarest, most senior signal in the project. A hollow voice surface risks reading as gimmick/scope-creep.
- **The `askKnowledgeBase` RAG-as-a-tool idea is the stronger of the two ideas** — but its value is dominated by the *new shipbroking corpus you must curate*, not the (already solid) hybrid + RRF pipeline.

## Key findings
1. "One brain, two front-ends" is a recognized good pattern — but the standard implementation shares the **data/tool layer, not the entire agent loop**. Putting a text-optimized multi-step loop behind voice is the anti-pattern.
2. Voice has a hard, physics-level latency budget a multi-step loop violates. Human turn gaps ~200 ms; production voice targets sub-700–800 ms voice-to-voice; conversation breaks down beyond ~1.5–2 s. A 5-step loop (each step = LLM round-trip + tool call + a network hop back into the app) easily adds multiple seconds.
3. Cascade (STT→LLM→TTS) is correct here, not realtime S2S — and delegating to a text brain does NOT rule out realtime later. Cascade gives transcripts (audit), per-stage observability, vendor swap-ability, mature tool-calling — all of which matter in a money-sensitive broker domain.
4. Agentic *voice* over proprietary chartering-desk data is a near-empty market category (whitespace) in 2025–2026. Every major maritime data platform ships text/structured AI; the one voice-centric maritime product targets shipboard crew safety, not the broking desk; voice freight-negotiation agents exist only in road trucking.
5. SSY is a Microsoft-stack, internal-tooling shop that buys/invests in shipping-tech rather than building customer-facing SaaS — so deterministic correctness and engineering judgment matter more than novelty.
6. Hybrid (BM25 + vector) + RRF remains a strong 2025–2026 baseline, but best practice adds a cross-encoder reranker as a second stage. Re-pointing a corpus to a new domain is cheap in code; answer quality is dominated by corpus/chunking quality.
7. Read-only-in-voice is the right safety call. Wrong numbers cost money and voice has no visible citations; the text write-approval gate is hard to replicate safely mid-call.

## Details (condensed)

**A. Core idea sound?** Share a grounding + tool layer, keep the LLM/agent thin. The blocker for proxying the 5-step loop is latency: human turn gaps ~200 ms (Stivers 2009 PNAS; Levinson & Torreira 2015); industry targets sub-800 ms (Retell/Vapi), 500–700 ms voice-to-voice envelope (Coval). A single cascade pass already lands ~700 ms–1.2 s; a 5-step loop multiplies the LLM/tool/round-trip portion → multi-second dead air. **Better:** expose the deterministic engine's read ops as a small set of LiveKit *function tools* the voice agent calls directly (one hop), voice-tuned prompt, 1–2 step cap. Cascade is correct (transcripts are load-bearing for brokers); a "half-cascade" path keeps realtime forward-compatible.

**B. Market.** "One grounded brain, multiple surfaces" is increasingly standard as a shared tool/data layer (LiveKit Agents, Vapi, Retell, ElevenLabs Conv AI 2.0, Pipecat, Bland). Agentic voice over proprietary data is common in support and road freight (VoiceInfra, Parade CoDriver) but **maritime chartering is whitespace**: Shipfix/Veson, Kpler Chartering, Signal Ocean (SSY minority stake), Seaber, Gaspar AI all ship text/structured AI; mariVoice is the only voice product and targets shipboard crew. Novelty is contested near-term, not a durable moat.

**C. How built.** Extract one shared tool/grounding module imported by both web handler and voice worker, but keep *two thin presentation layers* (voice prompts terse, no markdown, 1–3 sentences). LiveKit custom LLM node: point an OpenAI-compatible plugin's `base_url` at your endpoint OR override `llm_node`; the node must **stream `ChatChunk`s** so TTS starts early — a blocking call that returns the full answer destroys the latency advantage. Co-locate worker + models + brain endpoint. Barge-in needs VAD + TTS cancellation under ~200 ms + cancellation of in-flight generation.

**D. RAG.** RAG-as-a-tool (agentic, routed) is right for a *reference* KB — most broker questions are live structured data, not docs; always-on retrieval adds latency + irrelevant chunks. Keep voice retrieval to ≤1 tool call (agentic loops cite 2–10 s). Hybrid + RRF is a strong baseline; +cross-encoder reranker is the highest-ROI upgrade (T2-RAGBench: Hybrid+Cohere Rerank Recall@5 0.816 vs 0.695 for Hybrid+RRF, +17.4%). Corpus/chunking dominates quality (MDPI Bioengineering 2025: adaptive chunking 87% vs 50% fixed-size). Mix structured + doc RAG via **routing**, not always-both.

**E. Safety.** Ground strictly; speak the source ("according to the SUPPLYTIME recap…"); keep voice read-only; push high-stakes/low-confidence numbers to the visible dashboard ("let me put that on your screen"). Read-only-in-voice is right. Server-to-server: OAuth 2.1 client-credentials, least-privilege read-only service token, mTLS; brokerId only from signed LiveKit attributes. OAuth does NOT stop prompt injection (cf. EchoLeak CVE-2025-32711) — treat retrieved docs as untrusted, narrow read tools, writes off the voice path.

**F. Cost/ops.** Cascade ~$0.06–0.20/min (prompt-cache the grounding block — it's re-sent every turn); OpenAI Realtime ~$0.45–0.50 per 5-min call (more expensive, less controllable). A stateful Python LiveKit worker on Railway is a long-running process (different deploy/scale/observability + a new network hop + warm-keep cost) — real ongoing cost for a no-revenue solo dev → ship the brain refactor to text first, gate voice.

**G. Build vs reuse vs buy.** For this portfolio: hand-rolled brain refactor + reused RAG tool is defensible **provided voice stays scoped and feature-flagged**. Buying (Vapi/Retell) is fastest but undercuts the "I built the hard parts" narrative and adds per-minute cost.

## Portfolio verdict (direct)
- **Unify voice+RAG vs polish the core + text copilot?** Polishing wins. The deterministic matching engine, subject-gated state machine, SUPPLYTIME recap, and "LLM proposes, engine disposes" copilot are rare, senior, domain-credible signals — exactly what an internal-tooling, correctness-obsessed shop like SSY values. Over-engineering reads as poor scope judgment.
- **Does voice+RAG undercut the source-of-truth story?** Yes *if* voice answers freely; it *reinforces* the story only if voice is explicitly read-only and defers to the engine. Frame: "voice and text are two thin front-ends over one deterministic, audited brain" — but only if implemented as data/tool sharing, not loop sharing.
- **Reusing the compliance-RAG codebase — smart or forced?** Smart reuse *as an engineering story* (clean HTTP API, hybrid+RRF, citations, SSE). Be honest the *value* is the new corpus; overselling pipeline novelty is the forced-fit trap.
- **Given voice is hidden, deepen it?** No — not as a visible surface. But **do the brain refactor** (it improves the shipped text copilot, ships behind a flag with voice hidden). **Do the refactor; gate the voice.**

## Recommendations (staged)
**Stage 1 — now (high ROI, low risk):**
1. Extract the shared "broker brain" as a pure service (grounding renderer + validated read/write tools); re-point the *text* copilot at it. Feature-flagged; voice stays hidden.
2. Add `askKnowledgeBase` (reused RAG) as one *routed* tool in the text copilot first. Curate a small, clean shipbroking corpus (charter-party clauses, glossary like "on subs," desk SOPs). Effort goes into chunking/corpus quality, not the pipeline.

**Stage 2 — only if you want a voice demo, only as data/tool sharing:**
3. Voice = LiveKit voice-native agent calling the *same shared read-only tools* directly (in-process), terse prompt, 1–2 step cap — NOT a proxy to the 5-step text loop. Keep cascade. Keep voice read-only.
4. Stream `ChatChunk`s so TTS starts early; co-locate; thinking-sound masking only as fallback.

**Stage 3 — hardening (if voice ever ships public):** reranker if retrieval misses; OAuth 2.1 + least-privilege + mTLS; push any spoken number + citation to the screen.

## Top risks (ranked) + mitigations
1. **Latency: 5-step loop behind voice → dead air.** → data/tool sharing, 1–2 step cap, streaming; never proxy the full loop.
2. **Portfolio dilution: hollow voice undercuts the core signal.** → keep voice flagged/hidden; ship brain refactor + text-side RAG; frame as "two thin front-ends, one audited brain."
3. **RAG quality from a weak corpus.** → corpus curation + adaptive chunking + reranker, not a bigger model.
4. **Voice speaks a wrong number, no visible citation.** → read-only voice; speak the source; push critical figures to screen.
5. **Prompt injection via retrieved docs reaching an authed brain.** → docs untrusted; narrow read tools; writes off voice; identity only from signed attributes.
6. **Ops cost of a stateful worker for a no-revenue project.** → defer the worker; text-first; flag the voice.

## Validate/prototype first (ordered)
1. Brain-extraction refactor behind a flag, wired to the text copilot — prove "one brain, two front-ends" with zero voice.
2. `askKnowledgeBase` routed tool in the text copilot, against a small hand-curated corpus — measure groundedness/citation accuracy.
3. Latency spike test: simulate the data/tool-sharing voice path (1–2 steps, streaming), measure p95 voice-to-voice against ~700 ms–1.2 s **before** building more.
4. Reranker A/B only if step 2 shows retrieval misses.
5. Only then, a thin read-only LiveKit voice demo — still feature-flagged.

**Thresholds that flip the call:** if data/tool-sharing voice p95 > ~1.2 s, don't ship voice publicly — invest in text. If RAG groundedness is poor, fix corpus/chunking + reranker, not the model. If you start adding voice *writes*, stop.

## Caveats
Fast-moving: voice-agent pricing, model names/versions, S2S-vs-cascade — 2025–2026 snapshots that will drift. Latency numbers are budget guidance — measure your own. Market-novelty rests on absence of evidence as of mid-2026; incumbents signal movement toward NL interfaces. SSY posture drawn from job posts/trade press. Evaluation assumes the goal is a portfolio signal, not a funded product.
