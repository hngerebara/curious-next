# CuriousNext deployment specification

## Status

Draft M1 runbook, no environment provisioned or application deployed. [ADR-002](decisions/002-neon-pilot-stack.md) proposes providers. Owner: engineering. Provider acceptance, billing, region, retention and recovery targets remain open. [Security](security.md) owns privacy controls.

## Environments and secrets

Use separate development/test, staging and production databases and credentials. Preview deployments use synthetic data only. Do not branch production learner data into previews. Restrict preview access and email recipients. Automated tests use a fake email adapter by default.

Server-only configuration: DATABASE_URL (pooled application connection), DATABASE_URL_UNPOOLED (migration connection), BETTER_AUTH_SECRET, BETTER_AUTH_URL, RESEND_API_KEY and EMAIL_FROM. No secrets in NEXT_PUBLIC variables, source, screenshots or CI output. Migration credentials belong only to controlled deployment jobs. The application database role must not own schema changes. Document rotation and revocation during provisioning.

Use a Node runtime and a Drizzle driver that passes interactive transaction and concurrent token-redemption tests. Do not assume every serverless driver has identical transaction semantics. Choose database and hosting regions together after latency and data-handling review. Check current provider limits, commercial terms and combined database/email/hosting cost before purchasing.

## Build and release

Current CI validates repository documents, structural rules, checker tests, static design artifacts and PR metadata. It does not build an application that does not exist. Add pinned Node/package versions, dependency lockfile, type checking, affected behavioral/security tests and production build to both CI and manual PR workflows when M2 starts.

Future release order: validate the exact commit, apply reviewed backward-compatible migrations, deploy staging, exercise magic links and learner isolation with synthetic accounts, then obtain release approval. PRs remain open and unmerged under the per-slice workflow. Provisioning and deployment are separate from creating a PR.

## Reliability and recovery

Use versioned SQL migrations and expand/contract changes. Keep the prior application compatible during migration. Never run destructive schema changes automatically from application startup. Rollback application code separately from data migration. Test restore into an isolated database and verify learner evidence before declaring recovery ready. Define retention and recovery objectives with the owner before first learner use.

Use durable assessment jobs before M3. Bound provider timeouts, retries and spend. Observe outcome codes and queue age without logging learner content. Monitor link delivery failures, invalid/redemption rates and database failures. Show honest interrupted-session and unavailable-assessment states. No demonstration award on infrastructure failure.

## Acceptance checklist

- Provider choices, budget, regions and retention approved.
- Sender domain verified, email authentication configured and delivery tested.
- Secrets scoped, rotation documented and session revocation tested.
- Transaction, migration and restore tests passed.
- Staging keyboard/screen-reader entry journey and cross-learner tests passed.
- Runtime logging reviewed for credentials, tokens and learner text.

These steps are planned, not completed. [Status](../../Documentation.md), [foundation plan](../exec-plans/active/foundation.md).
