# Golden principles

## Rules

1. Evidence and versioned criteria drive progression, never lesson clicks or model confidence.
2. Accessible alternatives and translations preserve learning standards.
3. Domain logic is pure and cannot import providers, persistence, or UI.
4. Use explicit learner-scoped authorization and idempotent submissions.
5. Preserve drafts, retries and honest failure states. Never fabricate success.
6. Log through one structured adapter, with event IDs and outcome codes. No raw submission or secrets in logs.
7. Use kebab-case source filenames, PascalCase types, and descriptive identifiers. Tooling enforces filenames, not subjective naming quality.
8. Source modules stay within 300 lines. Tests and documentation within 500 lines. Split by responsibility. Exceptions require a decision and a config change.
9. Do not use empty catch blocks, suppress TypeScript checking, ignore promises deliberately, or commit debug output.
10. Update affected specs and milestone evidence in the same PR. Keep accepted debt visible.

## Related rules

Dependency directions live in [Architecture.md](../../Architecture.md). Commands, file-size enforcement and cleanup cadence live in [engineering](engineering.md) and [configuration](../governance.json).
