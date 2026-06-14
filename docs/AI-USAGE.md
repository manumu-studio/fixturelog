# AI Usage in FixtureLog

## Development Process

FixtureLog was built using an AI-assisted development workflow. The developer directed the architecture, designed the data model, made all significant technical decisions, and reviewed every piece of code against acceptance criteria and quality standards before considering any feature complete.

The development approach combines the developer's domain understanding and engineering judgment with AI assistance for implementation speed. The developer wrote the specification, defined the canonical status model, designed the service layer decomposition, chose the matching algorithm approach, and validated each output against a ratified build spec. All decisions are recorded in architecture decision records under `docs/decisions/`.

Code was reviewed for correctness, tested against explicit acceptance criteria, and checked by static analysis (TypeScript strict mode, ESLint, Vitest, Playwright) before being considered done. The developer owns the output.

---

## What AI Does NOT Do at Runtime

No AI system is involved in the application's runtime behavior. Every function the app performs during request handling is deterministic and fully traceable:

- **`RecapFormatter`** is a pure deterministic function. Given a fixture's structured terms, it always produces the same SUPPLYTIME 2017 recap text. There is no language model involved — output is a template render over typed data.

- **`FixtureMatcher`** is a weighted, explainable algorithm. Stage 1 applies explicit hard filters. Stage 2 computes a composite score from three named factors (distance, rate fit, capability margin) with documented default weights. Every score is derivable by inspection. No machine learning, no embedding similarity, no model inference.

- **`computeVerdict()`** is a set of fixed threshold comparisons. Wave height and swell height are compared against documented North Sea operating limits to produce `WORKABLE`, `MARGINAL`, or `NOT_WORKABLE`. The logic is a small pure function — no prediction, no probabilistic output.

- There is no AI-generated content anywhere in production data. All vessel records, charterer records, fixture data, and rate benchmarks are deterministic seed data authored by the developer.

---

## Planned Runtime AI

`docs/specs/SPEC-002-ai-broker-copilot.md` defines a future AI Broker Copilot. That work is not built in v1.0.x. The planned design keeps the LLM as an interface while PostgreSQL, Prisma, existing services, and typed backend tools remain the source of truth.

The future copilot must require human confirmation before any write, must refuse unsupported commercial claims, and must be evaluated for extraction accuracy, groundedness, refusal behavior, injection resistance, and recap completeness before it becomes a runtime feature.

---

## Philosophy

AI assistance accelerates implementation without replacing engineering judgment. The value of FixtureLog lies in the domain modeling decisions, the architectural choices (service layer decomposition, status machine design, the subject-gated transition), and the quality bars enforced (strict TypeScript, Zod validation at every boundary, hermetic tests). Those were made by the developer; they did not emerge from a model.

Transparency over mystification: this document exists so that any reviewer knows exactly what role AI plays (development tooling) versus what the application does itself (deterministic algorithms over structured data).
