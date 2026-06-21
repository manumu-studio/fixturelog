---
id: INCIDENT-BUILD-research-snapshot-typecheck
date: 2026-06-20
severity: SEV-4
status: RESOLVED
packet: PUBLIC-BUILD-LOCK
branch: rescue/voice-logo-mixed-2026-06-17
environment: local
detected_by: developer
related_incidents:
  - INCIDENT-LINT-generated-artifacts
fix_pr: null
---

# INCIDENT-BUILD-research-snapshot-typecheck — Research Snapshot Blocks Next Build

---

## Problem

### Symptoms

- `npm run build` compiles the app successfully, then fails during Next.js type validation.
- `pnpm run build` reproduced the same failure under Node `v18.20.8` / pnpm `9.12.3`.
- The failing file is a copied Stage-0 evidence snapshot, not active runtime source:
  `docs/research-V2/stage-0-pack/06-current-state/seed.ts`.
- Exact error:

```text
./docs/research-V2/stage-0-pack/06-current-state/seed.ts:352:17
Type error: Object is possibly 'undefined'.

350 |     data: {
351 |       requirementId: req1.id,
352 |       vesselId: vesselByName['Normand Pioneer'].id,
    |                 ^
```

### Impact

- **Users affected:** none directly; local/deploy build pipeline affected.
- **Features broken:** production build verification.
- **Data at risk:** no.
- **Workaround exists:** yes; exclude research snapshot artifacts from source validation.

### Reproduction Steps

1. Keep `docs/research-V2/stage-0-pack/06-current-state/seed.ts` in the repo.
2. Run `npm run build`.
3. Observe Next.js type validation failing on the copied snapshot file.

### Evidence

```text
npm run build
✓ Compiled successfully in 13.1s
Linting and checking validity of types ...
Failed to compile.
./docs/research-V2/stage-0-pack/06-current-state/seed.ts:352:17
Type error: Object is possibly 'undefined'.
```

```text
pnpm run build
WARN Unsupported engine: wanted {"node":">=20.0.0"} current {"node":"v18.20.8","pnpm":"9.12.3"}
Failed to compile.
./docs/research-V2/stage-0-pack/06-current-state/seed.ts:352:17
Type error: Object is possibly 'undefined'.
```

### Files Suspected

| File | Why suspected |
|------|--------------|
| `docs/research-V2/stage-0-pack/06-current-state/seed.ts` | Copied research artifact is being treated as active TypeScript source. |
| `tsconfig.json` / `tsconfig.build.json` | May not exclude research snapshot directories from Next's type validation path. |
| `next.config.ts` | Build may need source-validation scope adjusted if tsconfig exclusion is insufficient. |

### Root Cause Hypothesis

> Research snapshot TypeScript files under `docs/research-V2/` are included by Next.js build type validation even though they are evidence artifacts, not runtime/build source. The active source lint config was already narrowed, but production build validation still sees the snapshot.

### What's Blocked

- Clean `npm run build`.
- Final verification for the public build lock patch.

---

## Resolution

### Contributing Factors

1. The copied Stage-0 research pack intentionally preserved TypeScript source snapshots under
   `docs/research-V2/stage-0-pack/06-current-state/**`.
2. The root `tsconfig.json` used by `next build` included every `**/*.ts` and `**/*.tsx` file in
   the repository, excluding only `node_modules` and `prisma`.
3. `tsconfig.build.json` already scoped typecheck to active app source, but Next.js production
   validation reads the root Next TypeScript config, so the build still saw the copied snapshot.
4. The pnpm/Node 18 warning and workspace-root warning made the failure look environment-specific,
   but the root cause was still TypeScript scope.

### Was the Hypothesis Correct?

Yes. The copied research snapshot was treated as active build TypeScript by the root Next
TypeScript config. Excluding `docs/research-V2/**` from `tsconfig.json` removed the non-runtime
snapshot from production build validation while leaving active app source under strict checks.

### Files Changed

| File | Change | Why |
|------|--------|-----|
| `tsconfig.json` | Added `docs/research-V2/**` to `exclude`. | Prevent Next production validation from compiling copied research evidence snapshots. |
| `.gitignore` | Unignored this incident record while keeping other private incident logs ignored. | Ensure the registry row can point at a committed incident document. |
| `docs/incidents/INCIDENT-BUILD-research-snapshot-typecheck.md` | Added recurrence evidence and resolution details. | Preserve the diagnostic trail. |
| `docs/incidents/INCIDENT_REGISTRY.md` | Move incident from Active to Resolved. | Keep the incident registry current. |
| `next.config.ts` | Follow-up: pinned `outputFileTracingRoot` and `turbopack.root` to the project directory. | Remove misleading Next workspace-root warnings caused by unrelated lockfiles above the repo. |

### Fix Approach

Keep the copied Stage-0 pack intact as evidence, but remove it from the active TypeScript build
scope. The runtime source remains covered by `tsconfig.build.json`, Next build validation, ESLint,
and production build.

### Regression Risk

- Low if the fix only excludes copied research/evidence snapshots.
- Remaining risk: a future copied source snapshot outside `docs/research-V2/**` could reintroduce
  this pattern unless new evidence packs follow the same exclusion rule.

### Testing Done

- [x] `npm run build` passes.
- [x] `pnpm run build` passes under Node `v18.20.8` / pnpm `9.12.3` after the fix; the existing
  unsupported-engine warning remains because the project requires Node `>=20.0.0`.
- [x] `npm run build` passes under Node `v20.20.2`, the project target runtime.
- [x] Follow-up: `npm run build` under Node `v20.20.2` no longer emits the Next workspace-root warning after pinning the project root in `next.config.ts`.
- [x] Follow-up: `npm run dev` under Node `v20.20.2` starts Turbopack with the FixtureLog project directory and no workspace-root warning.
- [x] `npm run typecheck` passes.
- [x] `npx eslint . --ext .ts,.tsx` exits 0 with six existing warnings in `prisma/seed.ts`.
- [ ] Unit/integration tests not rerun; no runtime code path changed.

### Timeline

| Time (UTC) | Event |
|------------|-------|
| 09:54 | Detected during `npm run build`. |
| 09:54 | Incident filed before further fix work. |
| 10:17 | Added `docs/research-V2/**` to root `tsconfig.json`; `npm run build` passed. |
| 10:20 | User reported same symptom from `pnpm run build` under Node 18; recurrence evidence added. |
| 10:21 | Re-ran `pnpm run build`, `npm run typecheck`, and ESLint locally; all relevant gates passed. |
| 10:24 | Re-ran `npm run build` under Node `v20.20.2`; build passed on the target runtime. |
| 11:40 | Follow-up from pasted terminal log: pinned Next workspace root in `next.config.ts`; `npm run build` and `npm run dev` no longer emit the workspace-root warning. |

### Lessons Learned

**What went well:**
- Production build caught a non-runtime TypeScript inclusion before handoff.

**What could be better:**
- Research snapshot directories should be excluded from build/lint validation when created.

**Where we got lucky:**
- The failure is dev/build-only and does not affect runtime data.

### Action Items

| Action | Owner | Deadline | Status | Tracking |
|--------|-------|----------|--------|----------|
| Exclude research snapshot artifacts from production build validation. | Manu/Codex | 2026-06-20 | DONE | this incident |
| Use Node 20 for project commands to avoid pnpm unsupported-engine warnings. | Manu | 2026-06-20 | TODO | toolchain note |
| Pin Next workspace root to avoid parent-lockfile misdetection. | Manu/Codex | 2026-06-20 | DONE | `next.config.ts` |

---

## Conclusion

Resolved. The production build failure was caused by copied research TypeScript snapshots being
included by root Next.js TypeScript validation. The fix excludes `docs/research-V2/**` from the root
TypeScript scope; both npm and pnpm build paths now pass locally. The Node 18 unsupported-engine
warning is still a separate toolchain hygiene issue, not the cause of this incident.

---

## Follow-up: Pre-commit Snapshot Scan Recurrence (2026-06-20)

### Symptoms

During CP-026 docs preservation, `git commit -m "docs: preserve sanctions research chain"` failed
because the Husky pre-commit assertion scan treated copied research snapshot files under
`docs/research-V2/stage-0-pack/06-current-state/**` as active staged TypeScript:

```text
🚫 Checking for forbidden 'as' type assertions in staged diffs...
🔴 Forbidden 'as' type assertion(s) found in new/changed lines:
+      mainTerms: (mainTerms as unknown) as Prisma.InputJsonValue,
+ * `current` object — never trust this external data with `as Type`.
husky - pre-commit script failed (code 1)
```

### Recurrence Classification

This is a recurrence of the same root pattern: copied Stage-0 source snapshots are evidence artifacts,
but local quality tooling treats them like active source. The prior build/typecheck scope fix was
correct, but the pre-commit staged-diff hook still sees newly added snapshot TypeScript.

### Resolution For CP-026

Do not skip hooks and do not rewrite the point-in-time snapshot. For the docs-preservation commit,
leave the raw `stage-0-pack/06-current-state/**` snapshot tree unstaged and commit the packaged
`stage-0-pack.zip` plus the markdown research chain. The zip preserves the full evidence bundle
without forcing the pre-commit hook to parse copied TypeScript as active code.

### Follow-up Action

If the raw current-state snapshot tree must be committed unpacked later, adjust the pre-commit
quality hook to exclude `docs/research-V2/stage-0-pack/06-current-state/**` from staged TypeScript
assertion scans, matching the existing `tsconfig.json` build-scope exclusion.
