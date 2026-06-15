# PR — v1.4.0 — AI Broker Copilot v2 (grounded + confirm-gated agent)

**Branch:** `feat/copilot-agent` → `main`
**Type:** Feature (minor release — v2 of an existing feature; the grounded copilot can now take actions, with confirmation. No breaking change to any deterministic route.)

## What this PR does

Upgrades the AI Broker Copilot from a **grounded read-only chat (v1)** to a **grounded, confirm-gated, tool-using agent (v2)**. The copilot keeps every bit of its v1 grounding — broker-only, fed the desk's real dashboard aggregate as the source of truth, instructed to answer only from that data — and adds the ability to *act*:

- **Read tools auto-run.** `getFixture` and `findMatches` execute inside the bounded agent loop with no confirmation (they have no side effects).
- **Write tools are proposed, never auto-run.** `advanceFixtureStatus` and `generateRecap` are **approval-gated**: the model can only *propose* the action with a plain-language summary, and the write executes **only after the broker clicks Approve**. Reject denies it; nothing mutates.
- **The model proposes; the broker disposes.** The copilot is never autonomous. Every mutation has a human checkpoint.

### The guarantee this PR proves

The single most important property — **a write tool can never mutate state without an explicit broker approval** — is now locked down by an explicit test, not just an assertion in prose:

- `src/lib/services/copilot/tools/copilot-agent.test.ts` — drives the *real* bounded loop (`generateText` + `stepCountIs`) with a deterministic `MockLanguageModelV3`, never a live model. Proves **tool routing** (a model tool call reaches the matching tool), the **bounded loop** (terminates at the step cap even when the model loops forever), and the **confirm gate** (a proposed write surfaces an approval request and the executor is *not* called; on approval it runs *exactly once*; on rejection it never runs).
- `src/lib/services/copilot/tools/copilot-agent-subject-gate.test.ts` — end-to-end gate proof with the *real* executor + *real* `evaluateTransition` (only Prisma stubbed): an **approved** `ON_SUBS → FIXED` with a still-pending subject is still blocked — the DB transaction never runs.
- `src/app/api/broker/copilot/route.test.ts` — the route is broker-only: **401** anonymous, **403** charterer (both return before any model call), plus Zod-boundary **400**s.

## Why it was needed

A grounded chat answers *what is happening on my desk?* The natural next ask is *then do it* — without leaving the chat to click the same buttons. But the moment a language model can take an action, it can hallucinate an intent or be steered by a crafted prompt into proposing a write nobody asked for, and a status change or recap is a real, auditable mutation. The answer is a structural human-in-the-loop gate: the model proposes, the broker approves, and only the deterministic policy ever writes to the DB. Full rationale and rejected options in **[ADR-0004](../decisions/ADR-0004-copilot-human-in-the-loop.md)**.

This is honestly **v2 of an existing feature**, framed as grounded + confirm-gated — **not** an autonomous agent.

## How the safety holds

- **The deterministic gate is the only door to the DB.** A gated write tool's `execute` calls the same broker-scoped executor the existing routes use (`evaluateTransition` legal-transition matrix + subject-lift gate; recap FIXED/COMPLETED precondition). An approved-but-illegal write is rejected and relayed back as a message; nothing mutates.
- **`brokerId` is session-derived, never a tool argument** — the toolset is built from the `requireBrokerApi` guard and closed over by each tool, so the model cannot spoof which desk it acts on; the audit actor is always the real session broker.
- **The loop is bounded** (`stopWhen: stepCountIs(MAX_AGENT_STEPS)`) and history size + total characters are capped before any model call.

## How to verify

```bash
npm run typecheck && npm run lint && npm run test   # 369 unit tests, 59 files
npm run test:coverage                               # 78.78 / 75 / 71 / 78.78 (≥ 70/60/70/70 thresholds)
npm run build                                         # /api/broker/copilot in the route manifest
npm audit --audit-level=high && npm audit --omit=dev --audit-level=high   # 0 high
```

Manual (dev, broker session on `/dashboard`): open the copilot, ask "advance fixture X to ON_SUBS" → the copilot replies with a **proposal card** (Approve / Reject), and nothing changes yet. Click **Reject** → "Action rejected", no change. Ask again and click **Approve** → the status changes exactly once. Ask to fix a fixture that still has a pending subject and approve → the copilot relays the subject-lift rejection and the status does **not** change. An anonymous or charterer caller hitting `POST /api/broker/copilot` gets 401 / 403.

## Deployment notes

1. **No migration.** This PR adds tests + docs on top of the agent runtime already on the branch; no schema change.
2. **Env.** The copilot requires `ANTHROPIC_API_KEY` (server-only, `sk-ant-…`). Local/CI builds compile on the dev placeholder; production must set a real key in the Vercel secret store (the production guard rejects the placeholder).
3. **Living docs reconciled.** The README's stale "No runtime LLM" / "copilot dropped" lines are corrected to describe the shipped grounded + confirm-gated copilot; CHANGELOG gains the v1.4.0 entry.

## Scope guard

Tests + docs only. No new feature code beyond the agent runtime already delivered on this branch.
