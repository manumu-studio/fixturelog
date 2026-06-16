# ENTRY-011 — Broker Copilot v2: grounded chat → confirm-gated tool-using agent

**Date:** 2026-06-15
**Type:** Feature (AI)
**Version:** v1.4.0
**Branch:** `feat/copilot-agent`

## Summary

The AI Broker Copilot grows up. v1 was a **grounded read-only chat** — broker-only, fed the desk's real dashboard aggregate as the source of truth, instructed to answer only from that data and refuse anything else. v2 keeps every bit of that grounding and adds the ability to *act*: it is now a **bounded, tool-using agent** that can run read tools on its own (`getFixture`, `findMatches`) and **propose** write actions (`advanceFixtureStatus`, `generateRecap`) — but it can never mutate the desk without an explicit broker approval. The model proposes; the broker disposes. This entry is the "why" behind that line.

## Why an agent, and why confirm-gated rather than autonomous

A grounded chat answers *what is happening on my desk?* The obvious next ask is *then do it* — advance the fixture, generate the recap — without leaving the chat to click the same buttons. That is genuinely useful. But the instant the copilot can take an action, it inherits a risk a read-only chat never had: a language model can hallucinate an intent, misread the conversation, or be steered by a crafted prompt into proposing a write nobody asked for. A status change or a generated recap is a **real, auditable mutation**. Letting the model pull that trigger on its own would mean one bad turn corrupts the record.

So the decision (recorded in [ADR-0004](../decisions/ADR-0004-copilot-human-in-the-loop.md)) is: **every write is human-in-the-loop.** The model may only propose; nothing mutates until the broker approves *that exact proposal*. This is not a "type YES to confirm" prompt convention — a free-text confirmation is itself model-mediated and spoofable. It is a structural pause at the framework level: in the AI SDK v6 tool layer the write tools carry `needsApproval: true`, which makes the tool's `execute` **unreachable** until a typed approval response for that specific tool call exists in the messages. The guarantee is enforced by the SDK, not by prompt wording — which is exactly why it can be proven by a test rather than asserted in prose.

## How the safety holds, layer by layer

1. **Two tool classes.** Read tools have no side effects, so they auto-execute inside the loop while the broker reads. Write tools are approval-gated.
2. **The gate is the only door to the DB.** A gated write tool's `execute` does not mutate directly — it calls the same broker-scoped executor the deterministic routes use, which routes through `evaluateTransition` (legal-transition matrix + subject-lift gate) and the recap precondition. So even an **approved** illegal write (`ON_SUBS → FIXED` with a pending subject) is rejected and relayed back as a message; nothing mutates. The model and the human can both be wrong and the policy still holds.
3. **`brokerId` is session-derived.** The toolset is built from the `requireBrokerApi` guard's `brokerId` and closed over by each tool — never a tool argument. The model cannot spoof which desk it acts on; the audit actor is always the real session broker.
4. **The loop is bounded.** `stopWhen: stepCountIs(MAX_AGENT_STEPS)` caps the agent so a model that keeps asking for tools cannot run away; history size + total characters are also capped before any model call.
5. **Broker-only.** `requireBrokerApi` → 401 anonymous, 403 charterer. The charterer portal has no path to the copilot.

## What this release actually shipped

The agent route, the gated tools, and the proposal/approval UI were built earlier on this branch. **This entry covers the proof and the documentation**: the tests that lock the guarantee down, and the honest living-docs framing. No new feature code beyond the agent runtime already on the branch.

### The load-bearing tests

- **`copilot-agent.test.ts`** — drives the *real* bounded loop (`generateText` + `stepCountIs`) with a deterministic `MockLanguageModelV3`, never a live model. It proves: (a) tool routing — a model tool call is dispatched to the matching tool; (b) the loop terminates at the step cap even if the model loops forever (no runaway); (c) **the confirm gate** — a proposed write surfaces an approval request and the executor is *not* called; on approval it runs *exactly once*; on rejection it never runs.
- **`copilot-agent-subject-gate.test.ts`** — the end-to-end gate proof: wires the *real* executor + *real* `evaluateTransition` (only Prisma stubbed) and shows an **approved** `ON_SUBS → FIXED` with a pending subject is still blocked — the transaction never runs.
- **`route.test.ts`** — broker-only: 401 anonymous, 403 charterer, plus the Zod-boundary 400s. The reject paths return before any model call.

## Key decisions

- **Confirm-gated, never autonomous** — the central call, recorded in ADR-0004. The one approval click per write *is* the feature: it is where a human takes ownership of a real-money action.
- **Prove the guarantee with the framework, not the prompt** — test the `needsApproval` pause directly through the loop, so "no mutation without approval" is a green test, not a claim.
- **Test the gate twice** — once at the contract boundary (executor mocked as a spy: the cleanest "did it run?" proof) and once end-to-end (real policy + stubbed Prisma: "the gate actually blocks an illegal fix through the agent"). The unit suite stays fast and deterministic; the e2e suite proves the wiring.
- **Honest docs** — README/CHANGELOG/PR all describe the copilot as grounded + confirm-gated. The README's old "No runtime LLM" and "copilot dropped" lines were stale (the grounded copilot returned); reconciled to reality rather than left behind.

## Files touched

- `src/lib/services/copilot/tools/copilot-agent.test.ts` — NEW: routing, bounded loop, and the confirm-gate proof.
- `src/lib/services/copilot/tools/copilot-agent-subject-gate.test.ts` — NEW: approved-but-illegal fix blocked end-to-end.
- `src/app/api/broker/copilot/route.test.ts` — NEW: broker-only gating (401 / 403 / 400).
- Docs: `docs/decisions/ADR-0004-copilot-human-in-the-loop.md`, `docs/pull-requests/PR-1.4.0.md`, this entry, `README.md`, `CHANGELOG.md`.

## Validation

- `npm run typecheck` — green (production config). `npm run lint` — no warnings or errors.
- `npm run test` — **369 passing / 59 files** (11 new copilot tests). `npm run test:coverage` — **78.78% statements / 75% branches / 71% functions / 78.78% lines**, all above the 70/60/70/70 thresholds (not regressed). `npm run build` — compiles, `/api/broker/copilot` in the route manifest.
- The remaining 21 `npx tsc --noEmit` errors live only in pre-existing unrelated test fixtures (requirements / vessels / env-schema / portal-queries); none in any file this task added, and the project `typecheck` gate (`tsconfig.build.json`, tests excluded) is clean.
