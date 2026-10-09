# CuriousNext API specification

## Status and authority

The M1 authentication spike below is implemented and integration-tested locally. M2 goal/course-plan preview routes are implemented locally. Recommendations, lessons and assessment remain proposed. [Accepted stack](decisions/002-neon-pilot-stack.md), [security](security.md), [domain](domain-model.md), [data model](data-model.md) own their respective policies. Live Neon/Resend and deployment validation remain pending. Owner: engineering.

## Shared conventions

JSON requests are validated with bounded body sizes. Successful JSON responses use `{ data, requestId }`. Errors use `{ error: { code }, requestId }`, without stack traces or private provider details. UI code maps stable error codes to accessible text. Use 400 for malformed input, 401 for missing session, 404 for inaccessible resources, 409 for future version/idempotency conflicts, 429 for abuse limits and 503 for unavailability. Private responses use no-store. Every private operation derives learner identity from a verified server session. Never accept a client-supplied learner ID as authority.

Mutations validate exact origin. Link confirmation additionally validates an unpredictable CSRF value against an authenticated encrypted HttpOnly cookie. Idempotency keys and optimistic concurrency apply to course-plan preview writes. Reusing a key with a different payload returns 409. Logs contain event IDs and outcome codes, not submitted content or tokens.

## Implemented M1 authentication spike

| Route | Input | Behavior |
|---|---|---|
| POST /api/access/request | `{ email }` | Normalise/validate email, enforce a 4 KiB body limit, return the same 202 acknowledgement for existing/new learners. Apply shared database limits before sending. 429 for limits, 503 for delivery/configuration failure. Destination fields are rejected until course entry exists. |
| GET /access/confirm | `?token=...` | Encrypt token and random CSRF value into a 10-minute confirmation cookie, then 303 to /access/confirm/ready with a clean URL. Repeated GET scans do not redeem, create accounts or create sessions. |
| GET /access/confirm/ready | Confirmation cookie | Render the explicit confirmation button, or recover to the request form if context is absent/expired. |
| POST /api/access/confirm | JSON or form `{ csrf }`, confirmation cookie | Validate origin/context, then redeem once through Better Auth. Set the verified session cookie and 303 to /access/verified. Invalid/expired/reused links recover neutrally. Outage/limit states retain confirmation context for retry until it expires. |
| GET /api/access/session | Session cookie | Return minimal verified learner state or 401, using database session validation without a cookie cache. |
| POST /api/access/logout | Session cookie, same origin, JSON/form body | Revoke the session and clear its cookie. Repeated logout returns safely. |
| GET /api/access/record?id=... | Session cookie and synthetic record ID | Ownership probe for the integration spike. Return only an owned record or 404. No public record-creation route. Remove/replace this probe before learner release. |

Policy v1: magic links expire in 10 minutes and database token identifiers are hashed. Sessions last 24 hours without sliding refresh. Per-email resend cooldown is 60 seconds. IP windows are 10 minutes, with 10 link requests and 30 confirmations. Email/IP limit keys use keyed hashes. Atomic database upserts share limits across processes. Vercel forwarding-header trust is disabled unless explicitly configured on Vercel. Untrusted local clients share one bucket. Hosted header trust, cleanup, retention and delivery require release review, see [authentication evidence](authentication-review.md).

## Public authentication, M2

Planned extension of the spike to the onboarding/learning destinations. The verified page links to /onboarding, but destination-aware email links and learning routes remain deferred.

| Route | Input | Behavior |
|---|---|---|
| POST /api/access/request | `{ email, destination }` | Validate email and allowlisted destination enum (onboarding or learning). Return the same 202 acknowledgement for existing/new accounts. Apply persistent abuse limits. Queue or await delivery safely. Do not return a token. |
| GET /access/confirm | Opaque email-link token | Render explicit confirmation. No redemption or learner creation on GET. Establish an expiring confirmation context and remove the token from the address bar. |
| POST /api/access/confirm | Confirmation context and CSRF proof | Redeem once, create the verified account if needed, set secure HttpOnly session cookie, redirect to a server-approved destination. Invalid/expired/reused links return a neutral recovery state. |
| GET /api/access/session | Cookie | Return minimal learner/session state, or 401. Validate the session server-side. |
| POST /api/access/logout | Cookie and CSRF proof | Revoke current session and clear cookie. Repeated logout is safe. |

Provider-specific error translation and delivery recovery must not reveal whether an email is registered. Resend requests never create learning evidence. No password, social sign-in or numeric-code endpoints. The M1 spike tests the authentication boundary with Better Auth and PGlite. Hosted driver/delivery and end-to-end course-entry checks remain release gates.

## Course entry, M2

| Route | Input | Output |
|---|---|---|
| GET /api/profile/goal | Session | Current immutable goal revision and latest saved plan. |
| PUT /api/profile/goal | `{ goalText, explanationLevel, teachingLanguage, sessionMinutes, version, clarification? }` | Saved goal/preferences and new version. Minutes: 10, 20 or 40. Language selection respects reviewed availability. |
| POST /api/course-plans | Owned goal revision ID, idempotency key | Validated personalised proposal, clarification, unsupported or explicit generation/failure state. See [course generation](course-generation.md). |
| GET /api/course-plans/:id | Session | Owned saved plan, no new model call. |
| POST /api/enrollments | `{ planId }`, idempotency key | Owned immutable preview enrollment and optional diagnostic choice. |
| GET /api/enrollments/:id | Session | Owned saved enrollment and placement. |
| POST /api/enrollments/:id/placement | `{ mode: "skip" }`, `{ mode: "beginning" }` or `{ mode: "diagnostic", answers: [four yes/no strings] } | Beginning or provisional recommended module and reason. No achievement/evidence award. |
| GET /api/recommendation (planned) | Session and enrollment | One primary action, at most two alternatives, time estimate and evidence-based reason. |

## Attempt and evidence boundary, M3 onward

Persist practice-AI interactions separately from assistant assistance. Draft-saving, assistance events, submit, assessment retry, recall and transfer receive concrete schemas when their milestone starts. Submission freezes task/rubric/policy versions and records the idempotency key before calling the assessor. Assessment jobs must survive process interruption through a durable queue/outbox, not unawaited background promises.

A successful validated assessment commits assessment, criterion-linked evidence, capability projection and recommendation atomically. Failure retains the attempt without a new demonstration. Export and nested-resource queries verify ownership. Diagnostic placement, independent demonstration, recall and transfer stay distinct. The [logical interfaces](data-model.md) remain authoritative until the next contract slice specifies these routes.

## Validation before implementation acceptance

Test request limits, invalid enums, missing/expired sessions, cross-learner access, same-key retries, different-payload conflicts and concurrent updates. Test the complete magic-link flow including automated GET scans and cross-device use. Trace diagnostic skip through a saved recommendation. Replace this draft with tested route schemas and compatibility rules as code is added.
