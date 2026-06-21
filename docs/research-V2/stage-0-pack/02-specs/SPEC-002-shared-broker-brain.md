# SPEC-002: Shared Broker Brain (`runBrokerBrain`) — text-first extraction

| Field | Value |
|-------|-------|
| **Status** | Ratified — ready to build |
| **Date** | 2026-06-20 |
| **Author** | Manu Murillo |
| **Implements** | [ADR-0005](../decisions/ADR-0005-text-first-shared-broker-brain.md) |
| **Build packet** | [PACKET-013](../build-packets/PACKET-013-shared-broker-brain.md) |
| **Must preserve** | [ADR-0004](../decisions/ADR-0004-copilot-human-in-the-loop.md) — human-in-the-loop write gate |
| **Version target** | v1.4.3 (patch — internal refactor + reversible flags; one user-visible change: voice panel hidden) |

---

## 1. Goal (the WHAT)

Extract the text Broker Copilot's grounding + tool-assembly + bounded-loop wiring out of the
HTTP route and into a single pure service, **`runBrokerBrain()`**, then re-point the route at it
**behind a reversible feature flag** — with **no observable change** to copilot behavior. In the
same packet, hide the (non-functional) voice panel behind its own reversible flag, and prove the
whole thing with regression tests that assert behavior is unchanged.

This is a **structural refactor**, not a feature. The "one brain" exists so future front-ends can
consume it; this packet ships exactly one consumer (the text route) and one parked surface (voice,
hidden).

## 2. Non-goals (explicit exclusions)

These are **out of scope** and each requires its own separate packet:

- ❌ **Voice integration** — wiring the voice worker to the brain, any voice tools, any voice data grounding.
- ❌ **`askKnowledgeBase` / RAG** — adding a knowledge-base tool to the copilot.
- ❌ **`iso-audit-rag`** — standing up, deploying, or calling the external RAG service.
- ❌ **Corpus creation** — assembling, chunking, or curating any shipbroking reference corpus.
- ❌ **Any change to copilot behavior** — model, prompt, tools, step cap, approval gate, scoping all stay exactly as they are.
- ❌ Deleting the voice code (it is parked behind a flag, not removed).

## 3. Current state (verified against live code, 2026-06-20)

- **Route** `src/app/api/broker/copilot/route.ts` does, in order: (1) `requireBrokerApi()` guard → `brokerId`; (2) JSON parse + `RequestBodySchema` envelope + `validateUIMessages` + `totalMessageChars` cap; (3) `getBrokerDashboard()` → `buildBrokerDataSummary()` → `buildCopilotSystemPrompt()`; (4) `buildCopilotTools({ brokerId })`; (5) `streamText({ model, system, messages: convertToModelMessages(messages), tools, stopWhen: stepCountIs(MAX_AGENT_STEPS), abortSignal })`; (6) `return result.toUIMessageStreamResponse()`. Constants `COPILOT_MODEL='claude-haiku-4-5'`, `MAX_AGENT_STEPS=5`, `MAX_MESSAGES=50`, `MAX_TOTAL_CHARS=20_000` live in the route.
- **Steps 1–2 are transport concerns** (auth, validation, abuse caps) → stay in the route.
- **Steps 3–5 are the brain** (grounding, tools, model loop) → move into `runBrokerBrain()`.
- **Step 6 is response shaping** → stays in the route (the brain returns the stream result; the route turns it into an HTTP response).
- **Tests today:** `route.test.ts` proves the route envelope (401 anon / 403 charterer / 400 malformed). `copilot-agent.test.ts` and `copilot-agent-subject-gate.test.ts` drive the loop by calling `buildCopilotTools(ctx)` + a `MockLanguageModelV3` **directly — they do not import the route**, so the loop/approval/subject-gate guarantees are independent of where the wiring lives and survive the refactor unchanged.
- **Voice** is rendered on the broker dashboard: `src/app/(app)/dashboard/page.tsx` imports `VoiceAgent` and renders `<VoiceAgent tokenEndpoint="/api/broker/voice/token" appConfig={VOICE_CONFIG} />` (line ~62). It is instructions-only and has no data/tools.

## 4. Target design

### 4.1 `runBrokerBrain()` — new pure service

New file `src/lib/services/copilot/broker-brain.ts` (`'server-only'`):

```ts
export interface RunBrokerBrainInput {
  brokerId: string;
  messages: UIMessage[];      // already validated + size-capped by the caller
  abortSignal: AbortSignal;
}

export async function runBrokerBrain(input: RunBrokerBrainInput): Promise<StreamTextResult<…>>;
```

- Owns: `getBrokerDashboard()` → `buildBrokerDataSummary()` → `buildCopilotSystemPrompt()`; `buildCopilotTools({ brokerId })`; `createAnthropic` + `streamText({ model, system, messages: await convertToModelMessages(input.messages), tools, stopWhen: stepCountIs(MAX_AGENT_STEPS), abortSignal: input.abortSignal })`.
- Owns the constants `COPILOT_MODEL` and `MAX_AGENT_STEPS` (moved out of the route; exported so tests can assert them).
- Returns the `streamText` result. **Does not** call `.toUIMessageStreamResponse()` (the route does that), and **does not** do auth, body parsing, or size caps (the route does those).
- Strict TS: no `any`, no `as`. The return type is the inferred `streamText` result — prefer letting TypeScript infer (e.g. via a small typed wrapper or `Awaited<ReturnType<…>>`) over hand-writing the generic; if a return annotation is needed, derive it, never cast.

### 4.2 Route re-point + reversible flag

- New env `COPILOT_SHARED_BRAIN` (boolean, **default `true`**) in `env.server.schema.ts`. Parse it so only the literal string `'false'` disables it (avoid the `z.coerce.boolean()` footgun where any non-empty string is truthy) — e.g. `.optional().default('true').transform((v) => v !== 'false')`.
- Route steps 3–5 become: `if (serverEnv.COPILOT_SHARED_BRAIN) { const result = await runBrokerBrain({ brokerId: guard.ctx.brokerId, messages, abortSignal: request.signal }); return result.toUIMessageStreamResponse(); }` — otherwise fall through to the **retained pre-refactor inline path** (the rollback path).
- The inline rollback path is **intentional, temporary duplication**, clearly commented as `ROLLBACK PATH — remove after bake (PACKET-013 follow-up)`. It exists so the refactor can be reverted at runtime without a redeploy. Its removal is a documented follow-up, not part of this packet.
- Steps 1–2 (auth, validation, caps) and step 6 (response shaping for the brain path) are unchanged.

### 4.3 Voice visibility flag

- New env `VOICE_AGENT_VISIBLE` (boolean, **default `false`**) in `env.server.schema.ts`, same parse style.
- `dashboard/page.tsx`: gate the render — `{serverEnv.VOICE_AGENT_VISIBLE && <VoiceAgent … />}`. Import `serverEnv` (server component, already async/server-side). Keep `VOICE_CONFIG`, the import, and all voice code; they remain referenced inside the guarded JSX so no `noUnusedLocals` error.
- No change to `voice-worker/`, the voice token route, or the `VoiceAgent` component itself.

## 5. Acceptance criteria

1. ✅ `runBrokerBrain()` exists as a pure `'server-only'` service; the route no longer contains grounding/tool/`streamText` wiring on the flag-on path; constants moved into the brain.
2. ✅ With `COPILOT_SHARED_BRAIN` unset/true, the copilot is **behaviorally identical** to before: same model, system prompt, tools, 5-step cap, HITL write approval, broker scoping, streaming response.
3. ✅ `requireBrokerApi` still gates the route (401 anonymous, 403 charterer); `brokerId` still comes from the session guard, never the body; the Zod envelope + `validateUIMessages` + char cap still run before any model call.
4. ✅ The human-in-the-loop write gate (ADR-0004) is intact: a write tool never executes without an approval; an approved illegal `ON_SUBS → FIXED` is still blocked by the real executor/policy.
5. ✅ `COPILOT_SHARED_BRAIN=false` routes through the retained inline path and passes the identical route + auth tests.
6. ✅ `VOICE_AGENT_VISIBLE` defaults false → the voice panel does not render on the dashboard; setting it true renders it (proving reversibility); all voice code remains in the repo.
7. ✅ Existing tests pass unchanged: `route.test.ts`, `copilot-agent.test.ts`, `copilot-agent-subject-gate.test.ts`.
8. ✅ New tests: a focused `runBrokerBrain()` test (grounding injected, broker-scoped tools assembled, step cap + `abortSignal` honored, via a mock model) and a flag-toggle test at the route.
9. ✅ All gates green: `npm run typecheck`, `npm run lint`, `npm run test` (coverage ≥ threshold), `npm run test:e2e`, `npm run build`. No `any`, no `as` (except `as const`), Zod at the env boundary.
10. ✅ Docs synced: ADR-0005 (this), journal entry, PR doc, CHANGELOG v1.4.3, README if the copilot/voice description changed.

## 6. Rollback

- **Runtime, no deploy:** set `COPILOT_SHARED_BRAIN=false` → route serves the copilot via the retained pre-refactor inline path. Set `VOICE_AGENT_VISIBLE=true` → voice panel reappears.
- **Code, atomic:** the packet is a single branch (`feat/shared-broker-brain` off the clean base — **not** the dirty rescue branch). `git revert` of the merge commit restores the prior state; no migration, no data change, so revert is safe and total.
- **Blast radius:** the refactor touches the copilot wiring + two flags + the dashboard render guard only. No DB schema, no API contract, no auth change. The loop/approval/subject-gate tests are route-independent, so a regression there would surface even without the route.

## 7. Verification commands

```bash
# Node 20 toolchain (nvm default is v18 — use the project's v20).
npm run typecheck          # tsc --noEmit, strict
npm run lint               # eslint . --ext .ts,.tsx (max-lines/complexity gates)
npm run test               # vitest + coverage thresholds
npm run test:e2e           # Playwright with real DB
npm run build              # next build (prod)
# Targeted, fast feedback while building:
npx vitest run src/app/api/broker/copilot/route.test.ts
npx vitest run src/lib/services/copilot/tools/copilot-agent.test.ts
npx vitest run src/lib/services/copilot/tools/copilot-agent-subject-gate.test.ts
npx vitest run src/lib/services/copilot/broker-brain.test.ts   # new
```
