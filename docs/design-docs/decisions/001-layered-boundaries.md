# ADR-001: Layered boundaries and conservative checks

## Status

Accepted, 2026-10-07.

## Decision

Use contracts, domain, application, adapters, ui, and bootstrap with dependencies defined in [Architecture.md](../../../Architecture.md). Introduce Python standard-library checks before choosing the application stack. Narrow import conventions fail closed until AST enforcement is introduced.

## Consequences

Enforcement exists at repository bootstrap without npm dependencies. The checker validates declared source layout and common import forms, not semantic behavior. M1 must revisit parser integration and framework composition. This restriction is explicit technical debt rather than a claim of perfect architectural validation.
