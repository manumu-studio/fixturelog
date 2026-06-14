# Entry 6

**Date:** 2026-06-14
**Type:** Documentation / architecture spec
**Branch:** `docs/ai-broker-copilot-safety-spec`
**Version:** `1.0.1` docs-only anchor (`package.json` remains `1.0.0`)
**PR:** `PR-1.0.1`

## Summary

Created the AI Broker Copilot safety and architecture specification. This is a docs-only packet: it does not add runtime AI, install AI packages, change Prisma, or modify application code. The output defines how a future copilot should work: the LLM acts as the interface, while PostgreSQL, Prisma, existing service-layer logic, Open-Meteo, and typed backend tools remain the source of truth.

## Why

FixtureLog already demonstrates the deterministic offshore broking workflow: requirement intake, vessel matching, fixture status, recap generation, weather evidence, and a regional map. The next credible step is to show how AI would be introduced responsibly without weakening those guarantees.

The key design question was not "how do we add chat?" It was "how do we let a broker use natural language while preventing the model from inventing commercial facts or writing unconfirmed data?"

## Files Created

- `docs/specs/SPEC-002-ai-broker-copilot.md` — planned copilot architecture, tool contracts, HITL flow, risk model, eval strategy, and future audit/data model
- `docs/research/AI-BROKER-COPILOT-RESEARCH.md` — cleaned research source for AI SDK orchestration, structured outputs, observability, evals, and safety caveats
- `docs/pull-requests/PR-1.0.1.md` — PR documentation for this docs-only change

## Files Modified

- `README.md` — added future AI Broker Copilot section and SPEC-002 references
- `docs/roadmap/ROADMAP.md` — added public post-MVP AI phases and removed internal `PACKET-NNN` labels
- `docs/architecture/PROJECT-CONTEXT.md` — added planned copilot architecture overview and removed internal `PACKET-NNN` labels
- `docs/AI-USAGE.md` — clarified no runtime AI today; added planned future HITL copilot note
- `CHANGELOG.md` — added v1.0.1 docs-only entry
- `CONTEXT.md` — updated local working context
- `docs/GLOSSARY.md` — added `OTHER` vessel type definition

## Key Decisions

- **Docs-only version anchor** — v1.0.1 is recorded in CHANGELOG, PR doc, and journal only. `package.json` stays `1.0.0` because no runtime feature or package change shipped.
- **LLM as interface, backend as truth** — every commercial fact must come from Prisma, deterministic services, or a typed tool result.
- **Write tools are HITL-gated** — future tools such as `saveConfirmedRequirement`, `confirmFixture`, and `finalizeRecap` require explicit approval and cannot auto-execute.
- **Provider-neutral tool errors** — domain tools return FixtureLog `ToolResult<T>`, while SDK/provider mapping happens at the adapter boundary.
- **Public-doc cleanup** — public/current-state docs use product wording and no internal `PACKET-NNN` labels.
- **No runtime AI claim** — AI-USAGE and README explicitly keep v1.0.x runtime behavior deterministic.

## Validation

- Public-doc label guard passes for README, roadmap, project context, and AI usage.
- SPEC-002 and cleaned research source exist.
- No `src/`, `prisma/`, dependency, env, package lock, or `package.json` version changes.
- Typecheck and lint are expected to remain green because the change is docs-only.

