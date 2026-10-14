# ADR-006: Goal-first generated tutor preview

## Status

Accepted for implementation under the user's 2026-10-14 approved CN-TUTOR-001 expansion. This changes the product entry scope while preserving independent curriculum/provider review before learner release.

## Decision

Support common educational goals through versioned learner-owned generated paths, diagnostics, lesson blocks and draft criteria. Keep the new engine alongside AI-2/CY-2 so old work, rubrics and evidence retain their original meaning. Adults choose explanation depth and visual presentation separately from ability estimates, with English and 10/20/40-minute sessions.

Generate and validate each lesson before use, retain its references/provider/content hash, then freeze application, teach-back and assistance before assessment. Deterministic policy requires complete literal criterion coverage and the guided activity result for successful supported-practice evidence. This preview never awards independent implementation, retention, certificates or legacy capability from generated guided work. Failures and uncertainty remain explicit, while same-frozen retry/replay cannot duplicate evidence.

Reference packs currently provide agent-reviewed source summaries and snapshot hashes for selected common topic families, with other generated introductions explicitly unreviewed. References and model fluency do not establish source fidelity or general curriculum approval. No cross-user private goal/answer reuse or automatic public course publication occurs.

## Consequences

Additive owned JSONB records and locked revisions permit versioned content and recovery without rewriting legacy data. Metadata retains complete task/history provenance, while public projections remove private answer keys. Explicit teaching preference changes affect future lessons, and saved lessons remain stable. New reference packs, independent assessments and learner release require reviewed standards and separate acceptance. Existing M4 scoring disagreements, actual screen-reader, M5/M6 and hosted deployment gates remain open.
