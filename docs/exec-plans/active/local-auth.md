# CN-LOCAL-AUTH-001: Local magic links

## Plan lifecycle

Active M2 follow-up. [THE-18](https://linear.app/the-curious-tech-girl/issue/THE-18/add-local-magic-link-inbox-and-neon-validation). Depends on merged CN-ENTRY-001. [ADR-004](../../design-docs/decisions/004-local-email-preview.md) records the authorised local-delivery decision.

## Deliverables

Explicit local email sender, loopback-only dev inbox, local access labels, deployment rejection, environment/setup instructions, meaningful authentication and inbox tests. Validate configured Neon using synthetic data without exposing connection values. Preserve confirmation and learner ownership.

## Validation and completion

Run application/governance/artifact/calibration/audit checks, browser access-confirmation journey and private database isolation checks. Review/fix and publish a ticket-linked PR, leave unmerged. Report what completes M2: entry behavior plus Neon persistence/isolation and actual screen-reader journey. Real inbox delivery now blocks deployment rather than local M2, per user instruction. No learner release or subject review is implied.
