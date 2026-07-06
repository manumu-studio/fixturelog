# INCIDENT-P001 - Stale Landing E2E Blocks Husky Pre-Push

**Severity:** SEV-4
**Status:** Resolved
**Opened:** 2026-07-06

## Problem

### Symptoms

`npx playwright test` fails during the Husky `pre-push` hook:

- `e2e/landing.spec.ts` expects the old locked build headline, "Two junior assistants are being built..."
- The restored landing now renders the product workflow headline, "From enquiry to recap..."

### Impact

Developers cannot push the PR branch while the pre-push hook runs the full E2E suite.

### Prior Incident Search

No prior incident registry existed in this worktree. Searched existing docs with:

- `landing.spec`
- `Two junior assistants`
- `locked build`
- `pre-push`
- `Playwright`
- `e2e`

No active or resolved incident matched this failure.

### Hypothesis

The E2E specs were not updated after the landing page was restored from the temporary locked/private build page to the public product workflow page.

### Suspected Files

- `e2e/landing.spec.ts`
- `e2e/smoke.spec.ts`

### Blocked

Pushing the PR branch with Husky enabled.

## Resolution

### Fixed

Updated the E2E landing and smoke specs to assert the restored public product landing:

- `e2e/landing.spec.ts`
- `e2e/smoke.spec.ts`

The specs now check for the workflow headline, key metrics, product links, and absence of the superseded private-build copy.

### Verification

- `npx playwright test e2e/landing.spec.ts e2e/smoke.spec.ts` — 5/5 passed
- `npx playwright test` — 7/7 passed

### Contributing Factors

The app landing page was restored correctly, but E2E tests still described the temporary locked/private build surface.

### Lessons

When replacing a temporary public surface, update both unit tests and browser smoke tests in the same packet.

### Action Items

- [x] Update stale landing E2E assertions.
- [x] Re-run full Playwright suite.
