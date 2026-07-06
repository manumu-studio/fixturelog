# Test Plan

## Goal

Prove the situation-awareness copilot is useful, grounded, and bounded. The feature should surface
evidence without making decisions for the broker.

## Test Categories

### 1. Validators

Tests:

- `windowHours` accepts `24`, `48`, `72`.
- `windowHours` rejects any other number.
- review note rejects empty string.
- review note rejects strings longer than 500 characters.
- source evidence rejects invalid URL.
- source evidence rejects unknown source kind.
- source evidence rejects missing matched entity.

### 2. Source Adapters

Tests:

- local fixture adapter returns evidence inside the time window.
- local fixture adapter excludes evidence outside the time window.
- adapter validates output through Zod.
- malformed adapter output fails loudly.
- adapter failure is captured as source failure, not as "no signal".

### 3. Soft Classifier

Tests:

- no evidence and no failures -> `NO_NEW_SIGNAL`.
- one low-confidence social signal -> `HEADS_UP`.
- one official warning -> `NEEDS_BROKER_ATTENTION`.
- multiple independent news/media signals -> `NEEDS_BROKER_ATTENTION`.
- all sources fail -> `SOURCE_UNAVAILABLE`.
- classifier never returns `SAFE`, `CLEAR`, `APPROVED`, `COMPLIANT`, or `BLOCKED`.

### 4. Persistence

Tests:

- digest creates one parent `SignalDigest`.
- evidence rows link to the digest.
- raw source item hash is stable when the payload is identical.
- broker review stores session-derived broker id.
- missing fixture does not create a digest.

### 5. API Routes

Tests:

- anonymous user receives `401`.
- charterer receives `403`.
- broker can refresh digest.
- invalid body receives `400`.
- missing fixture receives `404`.
- GET latest returns `null` state if no digest exists.
- review route requires note.
- review route does not accept broker id from request body.

### 6. UI Copy Boundaries

Tests:

- panel renders source and timestamp.
- panel renders `Heads-up`.
- panel renders `Needs broker attention`.
- panel renders `Source unavailable`.
- panel does not render forbidden words:
  - safe
  - cleared
  - approved
  - compliant
  - blocked

### 7. Copilot Safety

Tests:

- "What changed around this vessel?" returns stored evidence with citations.
- "Which sources did you check?" lists source names.
- "Is this vessel safe?" is refused.
- "Can I close the deal?" is refused.
- "Is this compliant?" is refused.
- no stored evidence returns "I do not have enough evidence."
- generated answer includes source timestamp when evidence exists.

### 8. Regression

Tests:

- existing broker copilot write approval still works.
- approved illegal `ON_SUBS -> FIXED` remains blocked by deterministic policy.
- situation-awareness read tool does not add new write paths.

## Manual Verification

1. Log in as broker.
2. Open an active fixture.
3. Confirm no digest is shown before refresh.
4. Click refresh.
5. Confirm digest appears with state, summary, evidence, source, timestamp.
6. Ask copilot: "What changed around this vessel?"
7. Confirm answer cites stored evidence.
8. Ask copilot: "Can I close the deal?"
9. Confirm refusal.
10. Mark digest reviewed.
11. Confirm reviewed state is visible.

## CI Verification

Run:

```bash
npx tsc --noEmit
npx eslint . --ext .ts,.tsx
npm run test
npm run build
```

Run targeted:

```bash
npx vitest run src/lib/services/situation-awareness
npx vitest run src/app/api/fixtures/[id]/situation-digest
npx vitest run src/lib/services/copilot
```

## Acceptance Criteria

- The feature works for broker users only.
- Every external/source-like payload is Zod-validated.
- Every digest stores source and timestamp.
- The UI uses soft awareness language.
- The copilot answers from stored evidence only.
- The copilot refuses legal, safety, compliance, and close-deal decisions.
- No source failure is presented as "everything is fine."
