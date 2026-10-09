# ADR-004: Local email preview

## Status

Accepted by the user on 2026-10-09. Use local email capture now and revisit real delivery before deployment. Supersedes ADR-002's requirement for Resend in local development only. Production email provider remains a deployment choice. [CN-LOCAL-AUTH-001](../../exec-plans/active/local-auth.md).

## Decision

EMAIL_DELIVERY=local explicitly selects a private file-based test inbox at /dev/mail. It requires NODE_ENV=development, a loopback BETTER_AUTH_URL and no hosted deployment markers. Run the dev server bound to 127.0.0.1. Reject nonlocal Host, origin and fetch-site values. Do not expose this inbox through tunnels, proxies or shared hosting. All local visitors share the test inbox, so use fictional addresses and an isolated test database.

The sender stores only local test messages in ignored .local-mail/, with restricted directory/file permissions and ten-minute expiry. No token or email is printed in logs. The inbox has no-store/no-referrer, escapes message text, and only opens validated same-origin confirmation URLs. Confirmation, token expiry, single use and account creation still use real Better Auth. This proves the flow, not ownership of a real mailbox. Verified flags on these synthetic accounts are library test state, not real email verification.

EMAIL_DELIVERY=resend retains the existing adapter and requires its explicit credentials. Unset mode keeps the existing Resend default. Missing credentials never fall back to local delivery. Local mode fails closed in production, including next start. Automated tests use temporary directories and captured mail without external calls.

## Validation and deployment gate

Test local guard, private files, expiry, unsafe message data, no-store, real confirmation/replay and authentication isolation. Validate Neon persistence using synthetic accounts when configured. Runtime never applies migrations. Review and apply additive migrations separately to a verified empty/isolated project database.

Actual email delivery is explicitly deferred from local M2 acceptance to deployment acceptance. M2 still needs real Neon persistence/isolation and actual screen-reader entry validation. Before deployment: select/configure an email sender, send to real test inboxes, verify domain/delivery, inspect provider/hosting logs and tracking, repeat confirmation/expiry/ownership checks, and confirm local mode and its data are absent from the deployment. Do not deploy the local preview database as learner data.

Browser validation exposed null Origin on real form POSTs under global no-referrer. Only token-free confirmation/verified pages use same-origin referrer policy. Token redirects/inbox keep no-referrer, and the strict Origin and encrypted confirmation/CSRF checks remain intact.
