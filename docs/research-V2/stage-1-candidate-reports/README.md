# Stage 1 Candidate Reports

This folder stores incoming Stage 1-style sanctions/operator-risk research reports that were produced
outside the Stage 0.1 gate.

These reports are **not** approved Stage 1 outputs yet. Stage 0.1 must still run first and decide
whether `docs/research-V2/STAGE-1-PROMPT.md` and `docs/research-V2/stage-1-pack/` are ready for
Claude.ai.

After Stage 0.1 clears Stage 1, use these reports as candidate material to cross-check against:

- the Stage 0.1 decision ledger;
- the current repo model and product state;
- the final Stage 1 prompt constraints;
- source confidence labels and cited evidence.

## Current Candidate Reports

| Report | Status | Notes |
|---|---|---|
| `2026-06-20-compass-sanctions-operator-risk-research.md` | Reconciled — build planning cleared | Cross-check output: `../STAGE-1-CROSSCHECK-compass-sanctions.md`. Claims hold after two corrections/hardening notes: `Charterer` fields understated, denormalized `screeningStatus` must carry provenance/TTL, external list/yente responses require Zod parsing, and UK source must be the FCDO UK Sanctions List rather than a retired OFSI Consolidated List feed. |
