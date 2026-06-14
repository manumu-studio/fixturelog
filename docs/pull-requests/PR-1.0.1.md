# PR-1.0.1 — AI Broker Copilot Safety Spec

**Branch:** `docs/ai-broker-copilot-safety-spec` → `main`
**Version:** `1.0.1` docs-only anchor
**Date:** 2026-06-14
**Status:** Ready for review

---

## Summary

Adds the planned AI Broker Copilot architecture and safety specification. This does not build a copilot. It defines how a future implementation should introduce AI safely: the LLM acts as the broker-facing interface, while PostgreSQL, Prisma, deterministic services, and typed backend tools remain the source of truth.

The current runtime remains deterministic in v1.0.x.

---

## What Changed

### New Documents

- `docs/specs/SPEC-002-ai-broker-copilot.md`
  - Product goal and non-goals
  - LLM-as-interface architecture
  - structured output strategy
  - read/compute tool contracts
  - HITL-gated write tool contracts
  - provider-neutral `ToolResult<T>`
  - hallucination, adversarial, and data-governance risk model
  - observability and eval strategy
  - future audit/data model
  - UI and human-in-the-loop flow

- `docs/research/AI-BROKER-COPILOT-RESEARCH.md`
  - cleaned research source covering Vercel AI SDK, Zod contracts, tool calling, Langfuse/Braintrust, evals, Open-Meteo caveats, and HITL confirmation.

### Updated Living Docs

- `README.md` — adds planned AI Broker Copilot section and SPEC-002 reference.
- `docs/roadmap/ROADMAP.md` — adds public post-MVP AI implementation/evals phases and removes internal packet labels.
- `docs/architecture/PROJECT-CONTEXT.md` — adds planned copilot architecture overview and removes internal packet labels.
- `docs/AI-USAGE.md` — keeps "no runtime AI today" true while documenting the planned future copilot.
- `CHANGELOG.md` — adds v1.0.1 docs-only entry.
- `CONTEXT.md` — updates local working state.
- `docs/GLOSSARY.md` — adds the missing `OTHER` vessel type.
- `docs/journal/ENTRY-006.md` — records decisions and validation.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| LLM as interface, backend as truth | Prevents unsupported commercial claims and keeps deterministic services authoritative. |
| Write tools require explicit approval | Requirements, fixtures, and recaps are consequential; the broker must approve before persistence. |
| Provider-neutral `ToolResult<T>` | Keeps domain tools independent from any specific LLM provider or SDK wire format. |
| Public docs avoid internal packet labels | Current-state docs should read as product documentation, not implementation scaffolding. |
| No `package.json` bump | The change is docs-only; v1.0.1 is a changelog/PR/journal anchor, not a runtime package version. |

---

## Non-Goals

- No `/api/chat`
- No AI SDK packages
- No model/provider keys
- No Prisma migration
- No React copilot UI
- No runtime AI
- No `package.json` or lockfile change

---

## Verification

```bash
for f in \
  docs/specs/SPEC-002-ai-broker-copilot.md \
  docs/research/AI-BROKER-COPILOT-RESEARCH.md \
  docs/journal/ENTRY-006.md \
  docs/pull-requests/PR-1.0.1.md; do
  test -f "$f" && echo "OK       $f" || { echo "MISSING  $f"; exit 1; }
done

rg -n "source of truth|human-in-the-loop|Langfuse|eval|hallucination|prompt injection|needsApproval|ToolResult" \
  docs/specs/ docs/research/ docs/roadmap/ README.md

if rg -n 'PACKET-[0-9]' README.md docs/roadmap/ROADMAP.md docs/architecture/PROJECT-CONTEXT.md docs/AI-USAGE.md 2>/dev/null; then
  echo "internal PACKET label in a public doc -- use public wording"; exit 1
else echo "no PACKET labels in public docs"; fi

NON_DOCS=$(git diff --name-only | grep -vE '^(docs/|README|CHANGELOG|CONTEXT\.md)' || true)
if [ -n "$NON_DOCS" ]; then echo "non-docs changes:"; echo "$NON_DOCS"; exit 1; else echo "docs-only"; fi

if git diff --name-only | grep -q '^package\.json$'; then
  echo "package.json changed -- docs-only packet must keep it at 1.0.0"; exit 1
else echo "package.json untouched"; fi

npm run typecheck
npm run lint
```

---

## Review Notes

- The copilot is planned, not built.
- Current runtime remains deterministic.
- Public/current-state docs intentionally avoid internal packet labels.
- Historical journal and PR documents are not rewritten.

