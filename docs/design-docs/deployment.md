# CuriousNext deployment specification

## Status

Draft M1 runbook. A user-provided Neon test database is configured and locally validated, no application is deployed. [ADR-002](decisions/002-neon-pilot-stack.md) records the accepted stack. Owner: engineering. Billing, region, retention and recovery targets remain open. [Security](security.md) owns privacy controls.

## Environments and secrets

Use separate development/test, staging and production databases and credentials. Preview deployments use synthetic data only. Do not branch production learner data into previews. Restrict preview access and email recipients. Automated tests use a fake email adapter by default.

Server-only configuration: DATABASE_URL (pooled application connection), DATABASE_URL_UNPOOLED (migration connection), BETTER_AUTH_SECRET, BETTER_AUTH_URL, RESEND_API_KEY, EMAIL_FROM, AI_PROVIDER, GROQ_API_KEY and GROQ_MODEL. Course generation requires explicit model configuration, separate API billing and a recorded live evaluation. No purchases were made. Live evaluation results are recorded in the milestone ledger. No secrets in NEXT_PUBLIC variables, source, screenshots or CI output. Migration credentials belong only to controlled deployment jobs. The application database role must not own schema changes. Document rotation and revocation during provisioning.

Use Node.js 24 and Drizzle's node-postgres driver with Neon pooled application connections. Hosted HTTPS origins require a PostgreSQL URL with sslmode=require, verify-ca or verify-full. Connection, query and statement timeouts are bounded. Synthetic PGlite tests establish local token-redemption behavior, the actual Neon driver passed local confirmation, persistence, restart and ownership checks in CN-LOCAL-AUTH-001. Hosted concurrency/restore acceptance remains pending. Choose database and hosting regions together after latency and data-handling review. Check current provider limits, commercial terms and combined database/email/hosting cost before purchasing.

## Build and release

Both CI and the manual slice workflow install locked dependencies under Node.js 24, generate route types, type-check, run authentication integration/configuration tests and build the application. They also check dependency advisories, repository structure, documentation freshness, checker tests, static artifacts and PR metadata. Neither workflow provisions services or sends real email.

Future release order: validate the exact commit, apply reviewed backward-compatible migrations, deploy staging, exercise magic links and learner isolation with synthetic accounts, then obtain release approval. PRs remain open and unmerged under the per-slice workflow. Provisioning and deployment are separate from creating a PR.

## Reliability and recovery

Use versioned SQL migrations and expand/contract changes. Keep the prior application compatible during migration. Never run destructive schema changes automatically from application startup. Rollback application code separately from data migration. Test restore into an isolated database and verify learner evidence before declaring recovery ready. Define retention and recovery objectives with the owner before first learner use.

The migrations are migrations/0001-access.sql followed by migrations/0002-course-plans.sql and migrations/0003-enrollment-preferences.sql, each applied once through a controlled migration role. See [setup commands](../../README.md#application-setup-and-deployment). Track applied migration checksums in the eventual deployment job before adding incremental migrations. No hosted migration or restore was executed in this slice.

Use durable assessment jobs before M3. Bound provider timeouts, retries and spend. Observe outcome codes and queue age without logging learner content. Monitor link delivery failures, invalid/redemption rates and database failures. Show honest interrupted-session and unavailable-assessment states. No demonstration award on infrastructure failure.

The Resend call aborts after 10 seconds. An ambiguous delivery timeout does not trigger an automatic duplicate send. The learner receives retry feedback and the durable cooldown applies. Application logs suppress submitted content and Better Auth logs. Next development request logging excludes the token-bearing confirmation route. Hosting access logs, monitoring and third-party email-link tracking require inspection before real link delivery. Do not enable analytics or click tracking on authentication links. Define expired token/session/abuse-window cleanup with retention before learner release.

## Acceptance checklist

- Stack accepted. Budget, regions and retention require approval.
- Sender domain verified, email authentication configured and delivery tested.
- Secrets scoped, rotation documented and session revocation tested.
- Transaction, migration and restore tests passed.
- Staging keyboard/screen-reader entry journey and cross-learner tests passed.
- Runtime logging reviewed for credentials, tokens and learner text.

These steps are planned, not completed. [Status](../../Documentation.md), [foundation plan](../exec-plans/active/foundation.md).

Local development uses [ADR-004](decisions/004-local-email-preview.md) and EMAIL_DELIVERY=local. It is blocked in production. Real email delivery remains a release gate, with no requirement to use Resend specifically.

Temporary demo exception: `DEMO_LOGIN_ENABLED=true` replaces email login with a privately configured `DEMO_LOGIN_PASSWORD` (minimum 16 characters). It uses Better Auth sessions and a separate shared demo account, with origin checks, bounded requests and five attempts per client per 15 minutes. The configured demo password is intentionally visible on the login page only while demo mode is enabled, as explicitly requested for public testing. All demo visitors share saved work and must use fictional information. Existing accounts are preserved. This mode does not satisfy personal-account email verification or learner release acceptance. Set the flag to false to restore the email delivery requirements.

Hosted path generation has a bounded 60-second provider deadline inside a 75-second recovery lease, while the browser allows 90 seconds. Repeated 25-second failures on the first deployed preview matched the previous adapter deadline rather than the host maximum. The revised policy changes the pinned path configuration, so create an updated path after deploying it. Longer provider delays still fail safely and do not change learning evidence.
