---
id: INCIDENT-P09-coverage-threshold-drop
date: 2026-06-15
severity: SEV-4
status: RESOLVED
packet: PACKET-009
branch: feat/client-portal
environment: local
detected_by: developer
related_incidents: []
fix_pr: null
---

# INCIDENT-P09-coverage-threshold-drop — Pre-Push Coverage Gate Fails

---

## Problem

### Symptoms
The pre-push hook blocked `git push -u origin feat/client-portal`. Typecheck and all tests passed, but v8 coverage fell below the configured 70% global line/function/statement gates.

### Impact
- **Users affected:** none, dev only
- **Features broken:** none
- **Data at risk:** no
- **Workaround exists:** no, the branch must meet the gate

### Reproduction Steps
1. Commit PACKET-009.
2. Run `git push -u origin feat/client-portal`.
3. Observe the pre-push coverage failure.

### Evidence
```text
Test Files  49 passed (49)
Tests  331 passed (331)
Statements   : 67.72%
Functions    : 67.18%
Lines        : 67.72%
ERROR: Coverage for lines (67.72%) does not meet global threshold (70%)
ERROR: Coverage for functions (67.18%) does not meet global threshold (70%)
ERROR: Coverage for statements (67.72%) does not meet global threshold (70%)
```

### Files Suspected
| File | Why suspected |
|------|--------------|
| `src/lib/services/portal/portal-mappers.ts` | Pure mapper file had 0% coverage |

### Root Cause Hypothesis
PACKET-009 added pure portal serialization logic without a focused unit test, pulling global coverage below the existing gate.

### What's Blocked
- Push and PR creation for `feat/client-portal`.

---

## Resolution

### Contributing Factors
1. **Factor:** New pure portal service files entered coverage scope with limited direct tests.
   - **How it contributed:** Typecheck and behavior tests passed, but global coverage fell below the existing gate.
   - **Why it wasn't caught earlier:** The full coverage command runs in pre-push, after the normal unit suite.

### Files Changed
| File | Change | Why |
|------|--------|-----|
| `src/lib/services/portal/portal-mappers.test.ts` | Added pure DTO serialization coverage | Covers mapper functions and ISO/null behavior |
| `src/lib/services/portal/broker-queries.test.ts` | Added broker dashboard aggregate coverage | Covers broker pending-action derivation |
| `src/lib/services/portal/portal-queries.test.ts` | Added charterer portal query coverage | Covers scoped reads, detail, create, dashboard derivation |
| `README.md`, `CHANGELOG.md`, `docs/roadmap/ROADMAP.md`, `docs/architecture/PROJECT-CONTEXT.md`, `docs/pull-requests/PR-1.3.0.md`, `docs/journal/ENTRY-009.md`, `docs/journal/ENTRY-010.md` | Updated verification counts | Keeps living docs synced to final gate output |

### Fix Approach
Add focused unit tests for deterministic service code instead of weakening coverage thresholds.

### Regression Risk
- Low. Tests exercise pure mappers and mocked Prisma service boundaries.

### Testing Done
- [x] `npm run test -- src/lib/services/portal/portal-mappers.test.ts`
- [x] `npm run test -- src/lib/services/portal/broker-queries.test.ts`
- [x] `npm run test -- src/lib/services/portal/portal-queries.test.ts`
- [x] `npm run test:coverage` — 52 files / 343 tests; 79.03% statements, 72.97% branches, 72.14% functions, 79.03% lines

### Timeline
| Time (UTC) | Event |
|------------|-------|
| 12:33 | Push blocked by coverage gate |
| 12:34 | Incident recorded |
| 12:36 | Mapper test added; statements/lines cleared, functions still low |
| 12:37 | Broker aggregate test added; functions still low after denominator shift |
| 12:39 | Portal query tests added |
| 12:40 | Full coverage gate passed |

### Lessons Learned
**What went well:**
- The pre-push gate caught the missing direct service coverage before PR creation.

**What could be better:**
- Run `npm run test:coverage` before the first ship attempt on large packets.

**Where we got lucky:**
- The uncovered code had deterministic service boundaries, so the fix stayed small.

### Action Items
| Action | Owner | Deadline | Status | Tracking |
|--------|-------|----------|--------|----------|
| Add coverage to the pre-commit checklist for broad packets | Manu | Next packet | DONE | PR-1.3.0 |

---

## Conclusion

The branch failed the pre-push coverage gate after PACKET-009 added new portal services. Focused service tests restored coverage above all thresholds, and living docs now reflect the final 343-test suite.
