---
id: INCIDENT-P09-precommit-comment-token
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

# INCIDENT-P09-precommit-comment-token — Pre-Commit Hook Flags Comment Token

---

## Problem

### Symptoms
The pre-commit hook blocked the commit after matching a standalone assertion token inside a comment, even though typecheck, lint, and tests were green.

### Impact
- **Users affected:** none, dev only
- **Features broken:** none
- **Data at risk:** no
- **Workaround exists:** yes, reword the comment

### Reproduction Steps
1. Stage the PACKET-009 portal branch.
2. Run `git commit -m "feat(portal): add client portal and vessel gallery"`.
3. Observe the hook failure.

### Evidence
```text
Checking for forbidden type assertions in staged diffs...
Forbidden assertion token found in new/changed lines:
+// validates and returns. Dates are emitted ... ISO strings.
husky - pre-commit script failed (code 1)
```

### Files Suspected
| File | Why suspected |
|------|--------------|
| `src/lib/services/portal/portal-mappers.ts` | New comment contains the matched token |

### Root Cause Hypothesis
The hook scans staged additions for the token without distinguishing code from comments.

### What's Blocked
- Commit and push for `feat/client-portal`.

---

## Resolution

### Contributing Factors
1. **Factor:** The hook checks plain staged text.
   - **How it contributed:** Comment text triggered a rule meant for TypeScript assertions.
   - **Why it wasn't caught earlier:** The hook only runs during commit.

### Files Changed
| File | Change | Why |
|------|--------|-----|
| `src/lib/services/portal/portal-mappers.ts` | Reworded the comment | Keeps the hook focused on code-risk signals |

### Fix Approach
The comment now reads without the matched token while preserving meaning.

### Regression Risk
- Low. Documentation-only wording in a source comment.

### Testing Done
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `git diff --cached --check`

### Timeline
| Time (UTC) | Event |
|------------|-------|
| 12:30 | Commit hook blocked the commit |
| 12:31 | Incident recorded |
| 12:32 | Comment reworded |
| 12:33 | Incident resolved |

### Lessons Learned
**What went well:**
- The hook caught the risky token before push.

**What could be better:**
- The hook could ignore comments in a future tooling improvement.

**Where we got lucky:**
- The fix required only a wording change.

### Action Items
| Action | Owner | Deadline | Status | Tracking |
|--------|-------|----------|--------|----------|
| Consider comment-aware hook parsing | Manu | Later hardening | BACKLOG | Roadmap/tooling |

---

## Conclusion

The pre-commit hook blocked a harmless comment token. The comment wording changed, the branch verification remains green, and the commit can proceed.
