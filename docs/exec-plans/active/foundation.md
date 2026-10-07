# CN-FOUNDATION-001: Pilot foundation decisions

## Plan lifecycle

Active preparation for M1 and M1.5 entry-flow review. Owner: engineering. Created 2026-10-08. Ticket: [THE-12](https://linear.app/the-curious-tech-girl/issue/THE-12/review-entry-flow-and-prepare-m1-decisions). Milestone evidence lives in [Documentation.md](../../../Documentation.md).

## Deliverables

Prepare the [Neon stack proposal](../../design-docs/decisions/002-neon-pilot-stack.md), [API draft](../../design-docs/api-spec.md) and [deployment draft](../../design-docs/deployment.md). Preserve magic-link-only access. Correct static homepage login navigation and record the reviewed scope in the [handoff](../../design-docs/screen-handoff.md). No provisioning or application code in this slice.

## Validation and remaining decisions

Run repository validation, checker tests, artifact checks and full diff self-review. Publish a ticket-linked PR and leave it open. Static preview checks do not test live authentication.

Before M1 completion: accept remaining providers and budget, choose regions/retention/recovery targets, validate the authentication adapter, implement framework bridge enforcement, review curriculum sources and calibrate both reference rubrics. Before M2: complete remaining alternate-state designs and user design review. This preparation slice does not close either milestone.
