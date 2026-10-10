# CuriousNext architecture

## Guiding principles

Evidence is authoritative. Summaries are rebuildable projections. Diagnostic placement is provisional. Preferences never confer ability. Published curriculum, rubrics, and policies are immutable versions. Accessibility and language variants preserve objective difficulty. Personal data is learner-scoped. AI generates or assesses within boundaries, while deterministic domain policy controls progression.

Keep failures explicit. Persist submissions before assessment, use idempotent operations and atomic evidence updates, and preserve historical decisions. Practice-AI interaction and instructional assistance are separate. Never award demonstration on failed or uncertain assessment.

## Dependency directions

Application modules use `src/ui`, `src/application`, `src/domain`, `src/contracts`, `src/adapters`, and `src/bootstrap`.

- contracts: dependency-free shared types and schemas.
- domain: contracts only, pure learning/progression rules, no I/O.
- application: domain and contracts, orchestration and ports.
- adapters: application, domain, contracts, external providers and storage.
- ui: application and contracts, accessible presentation.
- bootstrap: composition of all layers, no domain rules.
- app: Next.js entries that only re-export bootstrap entry functions. No executable logic or client directives. See [ADR-003](docs/design-docs/decisions/003-framework-entry-boundary.md).

Dependencies within the same layer are allowed, except app entries must target bootstrap. Reverse imports and deep imports through barrel indirection are still subject to these rules. Dependencies outside these folders are rejected, except adjacent style/assets imported by UI. External packages in domain/contracts require explicit allowlisting. Re-exports, literal dynamic imports and CommonJS imports are checked. Computed imports are forbidden.

The initial checker intentionally supports a narrow TypeScript/JavaScript module convention: relative imports only for internal modules, no source aliases, and no multiline import statements. Record and implement AST-based checking before relaxing it. Unsupported syntax fails closed. No claim of parser completeness is made.

## Operational boundaries

Server-side auth, storage, and model adapters implement ports. UI cannot access providers directly. Model secrets never enter client bundles. Submitted text is inert and untrusted. Enforce ownership for nested reads/writes/exports. Log event IDs and outcome codes without learner messages, credentials or model keys.

The application stack is accepted in [ADR-002](docs/design-docs/decisions/002-neon-pilot-stack.md). Groq is selected for bounded course-plan generation through the [generation contract](docs/design-docs/course-generation.md). The AI-2 preview uses the configured Groq model with separate practice and assessment instructions. Durable job processing is awaited and user-triggered, with no detached promises. Criterion feedback is rendered from constrained reason codes and literal response inspection, independent calibration remains a M1 release gate. Hosted workers and retention policy remain deployment gates. See [data model](docs/design-docs/data-model.md), [golden principles](docs/design-docs/core-beliefs.md), [enforcement configuration](docs/governance.json), and [plan](Plans.md).
