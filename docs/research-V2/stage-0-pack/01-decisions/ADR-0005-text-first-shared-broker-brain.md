# ADR-0005: Text-first shared broker brain — extract one brain, keep voice hidden, defer RAG

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Manu Murillo
- **Context tags:** ai, architecture, copilot, voice, rag, scope
- **Supersedes / relates to:** [ADR-0004](ADR-0004-copilot-human-in-the-loop.md) (the human-in-the-loop write gate this decision must preserve)

---

## Context

FixtureLog ships two AI surfaces that grew up apart:

- A **mature text Broker Copilot** — a broker-only endpoint (`POST /api/broker/copilot`) that grounds Claude in the desk's real dashboard aggregate, runs a bounded multi-step tool loop over broker-scoped read/write tools, and gates every write behind explicit broker approval (ADR-0004). Built on the Vercel AI SDK. This is the most senior, domain-credible signal in the project.
- A **separate, currently-visible LiveKit voice panel** (`VoiceAgent` on the broker dashboard, a Python worker under `voice-worker/`) that is **instructions-only**: it has no grounding, no tools, and no connection to the desk's data. It was scaffolded with the deliberate seam that "tools land later."

A proposal emerged to **unify both surfaces behind one shared "broker brain"** and to **reuse the `iso-audit-rag` pipeline as an `askKnowledgeBase` tool**. Rather than build on instinct, the idea was put through a deep-research adversarial evaluation (report: [VOICE-COPILOT-RAG-UNIFICATION-DEEP-RESEARCH-REPORT.md](../research/VOICE-COPILOT-RAG-UNIFICATION-DEEP-RESEARCH-REPORT.md), run 2026-06-19). This ADR records the decisions that research produced, so the build that follows has a ratified contract to point at.

The research separated two axes — **production soundness** and **portfolio value** — and reached different verdicts on the brain refactor, on voice, and on RAG. Those verdicts only matter if they are written down before code is touched; that is what this ADR is for.

---

## Decision

### 1. Extract one shared "broker brain" service — text-first.

The grounding + tool-assembly + bounded-loop wiring that currently lives inline in `POST /api/broker/copilot` is extracted into a single pure service, `runBrokerBrain()`, in `src/lib/services/copilot/`. The **text copilot is re-pointed at it**. This is the "one brain, two front-ends" pattern done the sound way: a surface (the HTTP route) owns transport, auth, and request validation; the brain owns grounding, tools, and the model loop. The refactor is **behavior-preserving** — same model, same system prompt, same tools, same 5-step cap, same human-in-the-loop write gate, same broker scoping.

### 2. Voice stays hidden. We do NOT deepen it now.

The voice panel is hidden from the dashboard (behind a reversible flag, code retained in the repo). Research verdict on voice is a **qualified no for portfolio value**: a hollow voice surface reads as scope-creep and dilutes the deterministic, correctness-first core that an internal-tooling shop like SSY actually values. Voice is not deleted — it is parked — but it is not a visible product surface and receives no new wiring in this line of work.

### 3. Never proxy voice through the five-step text loop.

If voice is ever built, it must **share the data/tool layer, not the conversational loop.** Routing a real-time voice turn through the text copilot's 5-step agentic loop is the **anti-pattern** the research flagged: each step is an LLM round-trip plus a tool call plus a network hop, and a 5-step loop routinely blows the sub-1s voice latency budget (human turn gaps ~200 ms; production voice-to-voice targets ~700–800 ms; conversation degrades past ~1.5–2 s). A voice agent, if built, calls the **same shared read-only tools directly** (in-process LiveKit function tools, 1–2 step cap, terse prompt, streaming `ChatChunk`s, cascade STT→LLM→TTS, **read-only**) — it does not call `runBrokerBrain()`'s loop. This constraint is ratified now so a future build cannot quietly take the easy, wrong path.

### 4. RAG (`askKnowledgeBase`) is deferred until a curated corpus exists.

`askKnowledgeBase` (reusing `iso-audit-rag` as a routed tool) is the **stronger of the two ideas**, but its value is dominated by a **curated shipbroking reference corpus that does not yet exist** — not by the (already solid) hybrid + RRF pipeline. Standing up the tool against an empty or weak corpus would produce confident, ungrounded answers — the exact failure the text copilot was built to avoid. RAG is therefore **out of scope** for the brain refactor and becomes its own packet, gated on the corpus being assembled and chunked first.

### Rejected options

- **Unify voice + text now, behind a shared agent loop.** Rejected on both axes: latency (anti-pattern #3) and portfolio dilution. The convenience of one code path does not survive the physics of a real-time voice turn.
- **Build `askKnowledgeBase` in the same packet as the refactor.** Rejected. It couples a low-risk, dependency-free refactor to a high-variance corpus-curation effort and an external service (`iso-audit-rag`). One PR, one story: the refactor ships clean; RAG gets its own packet when the corpus is ready.
- **Delete the voice code.** Rejected. The research says park, not kill — a future read-only, data/tool-sharing voice demo remains a legitimate Stage 2 if a demo is ever wanted. Hiding behind a reversible flag keeps that door open at zero ongoing cost.
- **Make the refactor irreversible (no flag).** Rejected. Even a behavior-preserving refactor of a live, money-adjacent surface should ship behind a runtime toggle so it can be rolled back without a redeploy.

---

## Consequences

- **The shipped text copilot improves structurally with zero behavior change.** `runBrokerBrain()` becomes the single, testable seam that any future front-end (a second route, a worker, a job) consumes — the "one brain" is real, even while there is only one front-end today.
- **The narrative stays honest.** We can say "voice and text are two thin front-ends over one deterministic, audited brain" *only once the brain is extracted* — and we will only say it about surfaces that actually share the data/tool layer. Until voice is built that way, voice stays hidden and we do not claim it.
- **The latency constraint is now a written contract, not tribal knowledge.** A future session (or a future me) cannot rationalize proxying voice through the loop; this ADR is the refusal.
- **RAG has a clear, unblocked path the day a corpus exists** — and a clear reason it is not being built before then.
- **Reversibility is a first-class property.** The refactor lands behind `COPILOT_SHARED_BRAIN`; voice visibility behind `VOICE_AGENT_VISIBLE`. Both can be flipped from the environment with no code change.

This ADR is implemented by **PACKET-013** ([build packet](../build-packets/PACKET-013-shared-broker-brain.md), [SPEC-002](../specs/SPEC-002-shared-broker-brain.md)), which covers **only** the brain extraction, the route re-point, voice hiding, the feature flag, and regression tests. Voice integration, `askKnowledgeBase`, `iso-audit-rag`, and corpus creation are explicitly out of that packet and require separate packets.
