# CuriousNext API specification

## Status and authority

Draft M1 contract, no endpoints implemented. [Accepted stack](decisions/002-neon-pilot-stack.md), [security](security.md), [domain](domain-model.md), [data model](data-model.md) own their respective policies. Routes below are CuriousNext interfaces, not a promise to expose every vendor endpoint. Owner: engineering.

## Shared conventions

JSON requests are schema-validated with bounded body sizes. Successful responses use `{ data, requestId }`. Errors use `{ error: { code, message }, requestId }`, without stack traces or private provider details. Use 400 for malformed input, 401 for missing session, 404 for inaccessible resources, 409 for version/idempotency conflicts and 429 for abuse limits. Private responses use no-store. Every private operation derives learner identity from a verified server session. Never accept a client-supplied learner ID as authority.

Mutations validate origin and CSRF protection. Idempotency keys are scoped to learner and operation, with a persisted request hash. Reusing a key with a different payload returns 409. Resource versions support optimistic concurrency. Logs contain request IDs and outcome codes, not submitted content or tokens.

## Public authentication, M2

| Route | Input | Behavior |
|---|---|---|
| POST /api/access/request | `{ email, destination }` | Validate email and allowlisted destination enum (onboarding or learning). Return the same 202 acknowledgement for existing/new accounts. Apply persistent abuse limits. Queue or await delivery safely. Do not return a token. |
| GET /access/confirm | Opaque email-link token | Render explicit confirmation. No redemption or learner creation on GET. Establish an expiring confirmation context and remove the token from the address bar. |
| POST /api/access/confirm | Confirmation context and CSRF proof | Redeem once, create the verified account if needed, set secure HttpOnly session cookie, redirect to a server-approved destination. Invalid/expired/reused links return a neutral recovery state. |
| GET /api/session | Cookie | Return minimal learner/session state, or 401. Validate the session server-side. |
| POST /api/access/logout | Cookie and CSRF proof | Revoke current session and clear cookie. Repeated logout is safe. |

Provider-specific error translation and delivery recovery must not reveal whether an email is registered. Resend requests never create learning evidence. No password, social sign-in or numeric-code endpoints. Authentication integration tests are release gates, not covered by current repository tests.

## Course entry, M2

| Route | Input | Output |
|---|---|---|
| PUT /api/profile/goal | `{ goalText, explanationLevel, teachingLanguage, sessionMinutes, version }` | Saved goal/preferences and new version. Minutes: 10, 20 or 40. Language selection respects reviewed availability. |
| GET /api/courses/suggestions | Session | Two supported courses with relevance and prerequisites. Unsupported goals receive an honest boundary. |
| POST /api/enrollments | `{ courseVersionId }`, idempotency key | Owned enrollment and optional diagnostic choice. |
| POST /api/enrollments/:id/placement | `{ mode: "skip" }` or diagnostic answers, version | Beginning or provisional recommended module and reason. No achievement/evidence award. |
| GET /api/recommendation | Session and enrollment | One primary action, at most two alternatives, time estimate and evidence-based reason. |

## Attempt and evidence boundary, M3 onward

Persist practice-AI interactions separately from assistant assistance. Draft-saving, assistance events, submit, assessment retry, recall and transfer receive concrete schemas when their milestone starts. Submission freezes task/rubric/policy versions and records the idempotency key before calling the assessor. Assessment jobs must survive process interruption through a durable queue/outbox, not unawaited background promises.

A successful validated assessment commits assessment, criterion-linked evidence, capability projection and recommendation atomically. Failure retains the attempt without a new demonstration. Export and nested-resource queries verify ownership. Diagnostic placement, independent demonstration, recall and transfer stay distinct. The [logical interfaces](data-model.md) remain authoritative until the next contract slice specifies these routes.

## Validation before implementation acceptance

Test request limits, invalid enums, missing/expired sessions, cross-learner access, same-key retries, different-payload conflicts and concurrent updates. Test the complete magic-link flow including automated GET scans and cross-device use. Trace diagnostic skip through a saved recommendation. Replace this draft with tested route schemas and compatibility rules as code is added.
