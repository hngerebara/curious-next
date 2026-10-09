# Authentication proof of concept: validation

## Scope and evidence

CN-AUTH-001, [THE-13](https://linear.app/the-curious-tech-girl/issue/THE-13/build-magic-link-authentication-proof-of-concept), 2026-10-08. This is an M1 integration spike under [ADR-003](decisions/003-framework-entry-boundary.md). It does not implement the learning journey or complete M1/M1.5. [Status](../../Documentation.md) owns milestone progress. [API](api-spec.md) owns route and policy details.

The [integration suite](../../tests/access.integration.test.ts) exercises real Better Auth, Drizzle and the actual [SQL migration](../../migrations/0001-access.sql) through a disposable PGlite PostgreSQL engine. Test mail is captured in memory. No service credentials, learner records or live email are used. [Configuration tests](../../tests/runtime-config.test.ts) reject missing secrets, unsafe origins and hosted database connections without TLS configuration before provider access.

Validated behavior: hashed token records, repeated non-consuming GET scans, no account before explicit verification, one successful concurrent redemption across two library instances, expired/reused-link rejection, cross-device confirmation, origin/CSRF protection, authenticated encrypted confirmation context, secure session cookies, database session expiry, repeated logout and cross-learner record isolation. Persistent keyed-hash rate limits survive instance changes, cap concurrent requests and reset using database time. Delivery and confirmation failures return recovery states. This spike has no achievement operations.

## Mobile and keyboard walkthrough

Rendered the local application in Chrome at 320px and 1440px, without service configuration. Both layouts fit without horizontal scrolling. Fredoka 600 headings and Inter text loaded from local application assets. Screenshots below show the actual application shell, not the earlier static mockups.

1. Open /access. One labelled, blank email field and one link-request action are present. [Mobile capture](../design-artifacts/authentication/mobile-access.png), [desktop capture](../design-artifacts/authentication/desktop-access.png).
2. Enter the fictional learner@example.test address and submit. Observed the disabled “Sending your link…” button before the request completed. Unconfigured services returned unavailable feedback and the typed address remained visible. [Failure capture](../design-artifacts/authentication/mobile-unavailable.png).
3. Tab from email to the request button. Verified a visible 3px focus outline. Activate the skip link with Enter. Verified focus moves to the main landmark.
4. Open the expired-link recovery state. Recovery text and a new-link form are readable at 320px. [Recovery capture](../design-artifacts/authentication/mobile-invalid.png).
5. Attempt protected entry without configured services. The page recovered to /access?state=unavailable. Integration tests separately establish 401 for anonymous or expired sessions against the configured test database.

These checks establish reflow and a limited keyboard path. They do not establish WCAG conformance, screen-reader usability, successful browser email verification, language parity or user approval of screen designs. The confirmation/success service flow is tested at the HTTP/library boundary, not through a real inbox and browser.

## Reproduce and remaining gates

Use Node.js 24 and Python 3.12. From the repository root:

```sh
npm ci
npm run check
npm audit --audit-level=high
python3 scripts/validate_repo.py
python3 -m unittest discover -s tests -v
python3 scripts/validate_design_artifacts.py
git diff --check
```

Run `npm run dev`, then open http://127.0.0.1:3000/access. Unconfigured startup does not create accounts or send mail. Follow [README setup](../../README.md#application-setup-and-deployment) only for an isolated synthetic-data environment.

Before learner release: validate the exact node-postgres/Neon connection and concurrent transactions, real sender delivery and inbox/browser confirmation, Vercel forwarding-header trust, token-free hosting logs, service retention and cleanup, migration tracking/restore, session revocation and accessibility with assistive technology. Obtain screen, curriculum and language review. The ownership endpoint is a synthetic probe and must be removed/replaced. These are tracked in [deployment](deployment.md) and [debt](../exec-plans/tech-debt-tracker.md), rather than represented as passed checks.
