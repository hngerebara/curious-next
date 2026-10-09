# ADR-003: Framework entry boundary and authentication spike

## Status

Accepted implementation decision, 2026-10-08. Applies to the authorised M1 authentication proof of concept. Owner: engineering. [CN-AUTH-001](../../exec-plans/active/authentication.md).

## Decision

Next.js framework entries live in src/app. They only re-export entry functions from src/bootstrap, with an optional literal Node runtime declaration. A structural check rejects executable logic, client directives, external imports and direct dependencies on other layers in these entries. No layer imports app. Bootstrap composes adapters and application ports. All other dependency directions remain unchanged.

Keep the narrow import convention for this slice. Add rejection tests before adding framework files. Framework glue is checked rather than ignored. Source modules retain the 300-line limit.

The M1 spike uses Better Auth, Drizzle and a PostgreSQL adapter. Synthetic integration tests use PGlite, with the same schema and authentication configuration. Live Neon transactions and Resend delivery remain separate verification steps requiring configured services. Test email is captured in memory only inside the test harness. Normal application mode never publishes a test inbox or raw links.

Email GET creates an encrypted short-lived confirmation cookie and redirects to a clean URL. It does not redeem the token. Confirmation POST verifies origin and a CSRF value bound to that context before invoking the private library API. No public vendor catch-all handler is mounted. Session reads validate the database session. A sample owned record demonstrates isolation without claiming learning persistence.

## Consequences

This is an integration spike, not M2 completion or learner release. User screen review, curriculum approval, live service verification, budget and retention remain open. Pin dependencies and include type checking, security tests and production build in both validation workflows. Do not provision paid resources or send real email during local review.
