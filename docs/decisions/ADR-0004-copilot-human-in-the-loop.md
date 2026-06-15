# ADR-0004: AI Broker Copilot — human-in-the-loop for every write

- **Status:** Accepted
- **Date:** 2026-06-15
- **Deciders:** Manu Murillo
- **Context tags:** ai, safety, architecture, copilot

---

## Context

The AI Broker Copilot started as a **grounded read-only chat**: a broker-only endpoint that loads the desk's real dashboard aggregate, renders it into a compact text block, and injects it as the source of truth in the system prompt. The model answers questions about the desk and is instructed to refuse anything not present in that data. It had no ability to change anything.

The natural next step is to let the broker *act* through the same chat — "advance this fixture to ON_SUBS", "generate the recap" — rather than leave the chat and go click the same buttons by hand. The moment the copilot can take an action, a new risk appears that a read-only chat never had: a language model can hallucinate an intent, misread the conversation, or be steered by a crafted prompt into proposing a write the broker never asked for. A status change or a generated recap is a real, auditable mutation of the desk. If the model could trigger that on its own, one bad turn would corrupt the record.

This ADR settles how the copilot is allowed to take actions. The deterministic write paths already exist and are already safe: the `PATCH /api/fixtures/:id/status` route enforces the legal-transition matrix and the subject-lift gate (`evaluateTransition`), and `POST /api/fixtures/:id/recap` enforces the FIXED/COMPLETED precondition. The question is purely about *who is allowed to pull the trigger, and when*.

---

## Decision

**Every write the copilot can make is human-in-the-loop: the model may only *propose* an action, and nothing mutates until the broker explicitly approves that exact proposal.** The copilot is a grounded, confirm-gated agent — never autonomous.

Concretely:

1. **Two tool classes.** Read tools (`getFixture`, `findMatches`) auto-execute inside the bounded agent loop — they have no side effects, so running them while the broker reads is safe. Write tools (`advanceFixtureStatus`, `generateRecap`) are **approval-gated**: in the AI SDK v6 tool layer they carry `needsApproval: true`, so a model tool call surfaces to the client as a proposal (a `tool-approval-request`) and the tool's `execute` runs **only** after a matching `tool-approval-response` from the broker replays through the loop.

2. **The model proposes; the broker disposes.** When the model decides a write is warranted it does not call a mutation — it emits a proposed action with a plain-language summary ("advance this fixture to FIXED. Approve?"). The UI renders Approve / Reject. Approve replays the approval and the gated `execute` fires once; Reject denies it and nothing runs.

3. **The deterministic gate is still the only door to the database.** The gated tool's `execute` does not mutate directly — it calls the same broker-scoped executor that routes through `evaluateTransition` (legal-transition matrix + subject-lift gate) and the recap precondition. So even an *approved* illegal write (e.g. `ON_SUBS → FIXED` with a still-pending subject) is rejected by the executor and relayed back as a message; nothing mutates. The model and the human can both be wrong and the policy still holds.

4. **`brokerId` is session-derived, never a tool argument.** The toolset is built from the `requireBrokerApi` guard's `brokerId` and closed over by each tool. The model cannot spoof which desk it is acting on, and the audit actor on a status change is always the real session broker.

5. **The loop is bounded.** The agent runs at most a fixed number of steps (`stopWhen: stepCountIs(MAX_AGENT_STEPS)`), so a model that keeps requesting tools cannot run away or rack up unbounded spend. History size and total characters are also capped before any model call.

6. **Broker-only, always.** The route is gated by `requireBrokerApi` (401 anonymous, 403 charterer). The charterer portal has no path to the copilot.

### Rejected options

- **Autonomous writes (the model executes mutations directly).** Rejected outright. It moves an irreversible, auditable action behind a probabilistic decision with no human checkpoint. One hallucinated or prompt-injected turn would mutate the desk. The marginal convenience (one fewer click) is not worth surrendering the human checkpoint on a real-money action.

- **"Confirm in chat" by free-text ("type YES to confirm").** Rejected. A free-text confirmation is itself model-mediated and spoofable — the model could fabricate or misattribute the confirmation. The SDK-level `needsApproval` gate is a structural pause: `execute` is *unreachable* until a typed approval response for that specific tool call exists in the messages. The guarantee is enforced by the framework, not by prompt wording, and is provable by test.

- **A separate "agent mode" toggle that relaxes the gate.** Rejected. There is no honest reason to offer a mode that removes the human checkpoint on writes; it would only exist to look more "autonomous". The product claim is grounded + confirm-gated, and the code matches the claim.

---

## Consequences

- **The core safety property is testable and tested.** `copilot-agent.test.ts` drives the real bounded loop with a deterministic mock model and proves: a proposed write surfaces an approval request and the executor is **not** called; on approval the executor runs **exactly once**; on rejection it never runs. `copilot-agent-subject-gate.test.ts` proves an approved illegal `ON_SUBS → FIXED` is still blocked by the real policy (no DB transaction). `route.test.ts` proves the route is broker-only (401 / 403). This is the contract a reviewer or interviewer can read straight off the tests.

- **Honest framing.** The copilot is described everywhere as **grounded + confirm-gated, not autonomous**. The README, CHANGELOG, and PR doc all say a write needs broker approval. We do not market it as an autonomous agent, because it is not one — and the safety story is more credible for saying so.

- **Slightly more friction by design.** Acting through the copilot costs one approval click per write. That click is the feature, not a bug: it is the point at which a human owns the mutation.

- **Reuse, not reimplementation.** The gated tools wrap the existing deterministic executors, which mirror the existing routes. There is exactly one implementation of "is this status change legal" and "can this fixture be recapped", shared by the routes and the copilot.
