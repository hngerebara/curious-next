# ADR-002: Neon pilot stack proposal

## Status

2026-10-08. Neon PostgreSQL and email magic-link-only access are user decisions. The remaining stack is a recommendation awaiting acceptance and integration validation. No accounts, paid resources or runtime application have been created. Owner: engineering. Execution: [CN-FOUNDATION-001](../../exec-plans/active/foundation.md).

## Decision proposal

| Responsibility | Recommendation | Reason |
|---|---|---|
| Web application | Next.js, TypeScript, Node server runtime | Accessible React screens and server endpoints in one deployment. |
| Database | Neon PostgreSQL, accepted | Durable relational records and transactions for learner evidence. |
| Persistence adapter | Drizzle with PostgreSQL driver | Reviewed SQL migrations and typed queries behind application ports. |
| Authentication | Better Auth magic-link plugin in the server | Shared sign-up/login with control over confirmation and token handling. This is an application library, not managed authentication. |
| Email | Resend | Transactional link delivery through a server adapter. |
| Hosting | Vercel on a plan appropriate to intended use | Managed deployment for Next.js, with service costs subject to budget approval. |

Use PostgreSQL transactions for frozen submissions and evidence updates. Start with text artifacts in the database. Uploads and object storage remain deferred. AI provider/model selection requires reference-task evaluation, cost and privacy review before M3. Do not choose a model solely from familiarity.

Managed infrastructure reduces infrastructure work, but authentication policy, authorization, migrations, recovery and application monitoring remain our responsibility. Neon-managed authentication is an alternative to evaluate if it exposes the required confirmation and token controls. Do not assume those controls without testing. A separate managed identity provider adds another service and identity synchronization boundary. A Node host other than Vercel remains possible if budget or regional requirements warrant it.

## Authentication adoption conditions

Configure hashed verification-token storage explicitly. Email a CuriousNext confirmation URL. Its GET renders confirmation without consuming the token. Only an origin-checked POST redeems it through the server authentication API and propagates secure session cookies. Do not expose a generic authentication GET verifier that bypasses this confirmation route.

Proposed defaults: ten-minute expiry and one request per email per sixty seconds, with additional shared IP abuse limits. These are operational choices, not established security guarantees. Persist rate limits across instances. Keep tokens and email addresses out of logs, analytics and error messages. Apply no-store and no-referrer to confirmation pages and remove the token from the visible URL after creating a short-lived confirmation context. No third-party scripts on this page.

Adoption tests must prove single-use redemption under concurrency, hashed records, no account/profile before verified redemption, expired/reused-link handling, uniform account-existence responses, cross-device confirmation, CSRF protection, cookie propagation, logout and learner ownership. If the selected adapter fails these tests, revise the adapter before learner use. Never compensate by introducing passwords or code entry.

## Architecture and implementation gate

Keep vendor SDKs in adapters, domain rules pure, and composition in bootstrap. Next.js requires framework route files. Before creating application code, record their narrow bridging role, update the structural checker to validate their permitted dependencies, and add regression tests. The current checker does not yet permit that bridge. Do not relax dependency checks by excluding framework files.

## Consequences and acceptance

Accept the remaining provider choices, budget ceiling, deployment/database regions and retention policy before provisioning. Verify live pricing and limits at that point. Vercel Hobby is restricted to personal noncommercial use, so do not assume a commercial pilot qualifies. Confirm a sending domain, email authentication and delivery before onboarding learners. Source/rubric review and screen approval still block completion of M1/M1.5.

## References

Reviewed 2026-10-08: [Neon and Drizzle](https://neon.com/docs/guides/drizzle), [Better Auth magic links](https://better-auth.com/docs/plugins/magic-link), [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying), [Resend with Next.js](https://resend.com/docs/send-with-nextjs), [Vercel Hobby restrictions](https://vercel.com/docs/plans/hobby). Library defaults differ from our proposed policy. Recheck documentation and pin supported versions during the integration spike.
