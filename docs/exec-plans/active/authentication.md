# CN-AUTH-001: Magic-link authentication proof of concept

## Plan lifecycle

Active M1 integration spike, created 2026-10-08. Owner: engineering. [THE-13](https://linear.app/the-curious-tech-girl/issue/THE-13/build-magic-link-authentication-proof-of-concept). [Status](../../../Documentation.md).

## Deliverables

Implement the accepted Next.js/Neon/Drizzle/Better Auth/Resend stack's authentication boundary, governed framework entries, reviewed migrations and an accessible email/confirmation shell. Keep course-entry and learner achievement outside this spike. [Decision](../../design-docs/decisions/003-framework-entry-boundary.md), [API](../../design-docs/api-spec.md), [security](../../design-docs/security.md).

## Validation

Test non-consuming GET scans, concurrent single-use redemption, hashed token records, no user before verification, expired/reused links, neutral account-existence responses, persistent abuse limits, cross-device confirmation, origin/CSRF rejection, cookies, logout and sample-record ownership. Run type checking and production build. Inspect mobile loading/error states and keyboard focus. Record limitations for live Neon/Resend and usability review. Publish a reviewed PR and leave it unmerged.

Local implementation and 18 application checks passed. [Validation walkthrough](../../design-docs/authentication-review.md) records mobile/desktop captures, keyboard checks and release limitations. This plan remains active for published-commit CI/review and live driver/delivery verification. It does not block independent curriculum-reference review or require the user to approve screens while on a phone.
