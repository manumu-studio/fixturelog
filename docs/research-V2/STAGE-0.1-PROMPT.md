# STAGE 0.1 PROMPT — Decision Ledger & First-Round Coverage

> **Audience:** Claude Code / Codex in-project agent.
> **Mode:** No web. Read-only research over local artifacts.
> **Project:** FixtureLog → SSY offshore-broking demo.
> **Stage:** 0.1, completing the two Stage 0 passes that remained pending.
> **Status:** Must run before Stage 1 is sent to Claude.ai.

---

## 0. Why This Stage Exists

Stage 0 produced the grounded current-state teardown and the directional verdict:

> `RIGHT, BUT REFOCUS` — FixtureLog is already a near-complete offshore-broking tool, so the chain
> collapses to sanctions/operator-risk screening, AIS sourcing, and two UI-polish tasks.

However, Stage 0 explicitly left two passes pending:

- **Pass A:** Decision-Memory Step 0 from ADRs/specs.
- **Pass C:** First-round research coverage map.

Stage 0.1 completes those passes before Stage 1 goes to Claude.ai. This prevents Stage 1 from
repeating settled research or reopening ratified decisions.

---

## 1. Outcome, One Sentence

Produce the missing decision ledger and first-round coverage map so the Stage 1 sanctions prompt can run with binding decisions, superseded material, and already-settled research clearly separated from genuinely unresolved questions.

---

## 2. Inputs To Read, In This Order

1. `docs/research-V2/RESEARCH-CHAIN-PROTOCOL.md`
2. `docs/research-V2/STAGE-0-OUTPUT-grounding.md`
3. `docs/research-V2/CODEX-HANDOFF-research-decision-system.md`
4. `docs/incidents/INCIDENT-AI-confabulated-task-premise.md`
5. `docs/research-V2/stage-0-pack/01-decisions/`
6. `docs/research-V2/stage-0-pack/02-specs/`
7. `docs/research-V2/stage-0-pack/03-first-round-research/`
8. `docs/research-V2/STAGE-1-PROMPT.md`

Do not use the web. Do not infer missing facts from memory.

---

## 3. Method

### Pass A — Decision-Memory Step 0

From the ADRs and specs, produce three lists:

1. **Binding decisions**
   - Already ratified.
   - Not open for Stage 1 to re-decide.
   - Include file path evidence for each.

2. **Superseded / obsolete material**
   - Older plans, assumptions, prompts, or research directions that must not be executed.
   - Include what superseded them.

3. **Genuinely unresolved questions**
   - Only questions that remain eligible for Stage 1 or later stages.
   - Separate sanctions, AIS, UI polish, voice/RAG, and interview-logistics questions.

### Pass C — First-Round Coverage Map

From the first-round research folder, summarize what is already answered.

For each item, include:

- claim or topic;
- confidence label: `CONFIRMED`, `LIKELY`, `INFERENCE`, or `UNVERIFIED`;
- source file path;
- whether Stage 1 should reuse it, ignore it, or avoid re-researching it.

### Stage 1 Readiness Check

Compare the result against `docs/research-V2/STAGE-1-PROMPT.md`.

Return:

- what in the Stage 1 prompt is already correct;
- what must be edited before Claude.ai sees it;
- what Stage 1 must not research because it is already settled;
- whether Stage 1 can launch after this 0.1 pass.

---

## 4. Required Output

Create:

```text
docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md
```

The output must use this structure:

1. **Executive Summary**
   - 5-8 bullets.
   - Say whether Stage 1 is cleared, blocked, or needs edits.

2. **Binding Decisions**
   - Table: Decision · Evidence path · Why it matters to Stage 1.

3. **Superseded / Obsolete Material**
   - Table: Material · Superseded by · What not to do.

4. **Unresolved Questions**
   - Table: Question · Stage · Why unresolved · Who should lead.

5. **First-Round Coverage Map**
   - Table: Topic · What is already known · Confidence · Source · Stage 1 instruction.

6. **Stage 1 Prompt Audit**
   - Keep / edit / remove recommendations for `STAGE-1-PROMPT.md`.

7. **Updated Stage 1 Handoff**
   - The exact delta, if any, that should be applied before sending to Claude.ai.

8. **Directional Verdict Check**
   - Confirm whether Stage 0's `RIGHT, BUT REFOCUS` still holds.
   - If it changes, explain why with evidence.

---

## 5. Hard Constraints

- No web.
- No implementation.
- No product design beyond Stage 1 readiness.
- No time/effort estimates.
- Do not rewrite point-in-time research history.
- Do not present any claim without a confidence label or file evidence.
- Do not resolve the AI-confabulation incident unless the output explicitly completes its required re-anchor items.

---

## 6. Pre-Launch Checklist

- [x] Outcome defined in one sentence.
- [x] Relevance typed: missing decision ledger + first-round coverage map.
- [x] Lead decided: Claude Code / Codex, because this is repo-grounding.
- [x] Directional verdict check required.
- [x] Hand-off to Stage 1 required.
- [x] No premature estimates.

---

## 7. Exit Gate — Do Not Move To Stage 1 Or A New Session Until

Stage 0.1 is not complete until all of these exist:

1. `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md`
   - Contains binding decisions.
   - Contains superseded/obsolete material.
   - Contains genuinely unresolved questions.
   - Contains first-round coverage map.
   - Contains Stage 1 readiness verdict.

2. `docs/research-V2/STAGE-1-PROMPT.md`
   - Updated if Stage 0.1 finds edits are needed.
   - Still marked draft if Stage 0.1 blocks launch.
   - Marked ready only if Stage 0.1 clears launch.

3. `docs/research-V2/stage-1-pack/`
   - Updated with the exact context Claude.ai needs.
   - Includes the reason the first pilot failed, so Claude.ai does not duplicate broad/bare-shell research.

4. Session handoff
   - If closing the session, the continuation prompt must say one of:
     - `Stage 0.1 CLEARED Stage 1 — next action: paste stage-1-pack into Claude.ai.`
     - `Stage 0.1 BLOCKED Stage 1 — next action: fix the listed blocker.`

The thing we need before moving on is therefore not a feeling of completion; it is the Stage 0.1
output plus an updated Stage 1 pack that a fresh agent or Claude.ai can use without rediscovery.
