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
| GET /api/enrollments/:id | Session | Owned saved enrollment, placement and preferences. |
| GET /api/enrollments/:id/diagnostic | Session | Draft scenario questions/options with version, no answer keys. |
| PATCH /api/enrollments/:id/preferences | Session, expected version and explanation/language/time | Saved preferences with optimistic concurrency and retry safety. |
| POST /api/enrollments/:id/placement | `{ mode: "skip" }`, `{ mode: "beginning" }` or `{ mode: "diagnostic", diagnosticVersion, answers: [one option ID per selected objective] } | Beginning or provisional recommended module and reason. No achievement/evidence award. |
| GET /api/recommendation | Session and enrollment | One primary action, at most two alternatives, time estimate and evidence-based reason. |

## Attempt and evidence boundary, M3 onward

CN-ATTEMPT-001 implements English AI-2 v2 preview only. Every route requires a verified session. Mutations require exact Origin. Idempotency-Key is 16-80 ASCII letters/digits/underscore/hyphen. Bodies are bounded to 32 KiB with exact fields. Inaccessible nested records return 404, conflicts return 409. Private results use no-store.

| Route | Input and behavior |
|---|---|
| GET /api/learning?enrollmentId=... | Owned enrollment, AI-2 history, saved capability/evidence/next action. No writes or model calls. |
| POST /api/learning | `{ enrollmentId, mode: practice/independent }` plus key. Create/reuse a pinned AI-2 attempt. New work uses a new key and attempt. Independent tasks rotate through twelve pinned fictional source packs with identical requirements, without reuse across the learner’s enrollments. After twelve, practice stays available and additional fresh proof needs reviewed content. |
| GET /api/attempts/:id | Owned draft, variant, conversation, help, frozen submission/job/history. |
| PATCH /api/attempts/:id | `{ revision, draft: { prompt, checklist, explanation } }`. Optimistic revision, identical retry, preserved revision history. |
| POST /api/attempts/:id/variant | `{ explanationLevel }`. Reuse/save authored English variant and hash, same objective/task/rubric, no default change. |
| POST /api/attempts/:id/practice | `{ revision }` plus key. Persist saved prompt/source before model call, one live lease per attempt, bounded retries. No instructional assistance. |
| POST /api/attempts/:id/help | `{ kind: hint/worked_solution, confirm: true }` plus key. Store authored support before delivery, irreversibly mark assisted. Reject after submission. |
| POST /api/attempts/:id/submit | `{ revision }` plus key. Freeze saved work, complete conversation and assistance, task/rubric/policy snapshots and create durable job. Requires completed practice response and no pending generation. |
| POST /api/attempts/:id/assess | `{}`. Claim/reclaim a 45-second durable job lease, await assessment, max three claims. Failed/uncertain retries use the frozen snapshot. Terminal success reuses result. Stale completions cannot commit. |
| POST /api/attempts/:id/review | `{}`. Record an idempotent optional request without a promise of a reviewer or blocked learning. |

Prompt limit 4,000 characters, checklist/explanation 2,000 each, 12 practice requests per attempt, three calls per request and ten calls per learner per ten minutes. Assessment has three claims per job and six calls per learner per ten minutes. Providers use 25-second timeouts and bounded response parsing. Expired final leases persist explicit failure. No scheduler is configured in this preview, returning learners explicitly resume processing. An autonomous hosted worker is a deployment gate.

Assessment structured output pins rubricVersion/policyVersion, status succeeded/uncertain and six required keyed criterion results (A1-A6), a criterion-specific reason code and evidence IDs selected from server-enumerated frozen prompt/checklist/explanation/response excerpts (one to eight IDs per criterion, with A5 restricted to checklist IDs). Every criterion also requires responseEvidenceId: an actual response ID for A5 and not_applicable for the other criteria. The server resolves IDs to literal nonempty quotes and stored spans. Reason/result pairs must agree: complete for met, ambiguous for uncertain and a criterion-specific remediation reason for not_met. Learner feedback uses server-owned wording, never provider prose. A5 counts come only from conservative parsing of complete explicit Q:/A: pairs, other formats remain assessor-reviewed without invented automatic counts. A5 requires checklist and response evidence. Missing coverage, invalid citations or inconsistent uncertainty fail closed. Feedback cannot award progression. Failed/uncertain assessment adds no evidence. Practice and assisted work produce Developing evidence only. Initial independent demonstration requires all six criteria without instructional help. These are visibly labelled preview projections until review passes.

Submission and durable job commit before provider access. No detached promises.
A successful validated assessment commits assessment, criterion-linked evidence, capability projection and recommendation atomically. Failure retains the attempt without a new demonstration. Export and nested-resource queries verify ownership. Diagnostic placement, independent demonstration, recall and transfer stay distinct. The [logical interfaces](data-model.md) remain authoritative until the next contract slice specifies these routes.

## Validation before implementation acceptance

Test request limits, invalid enums, missing/expired sessions, cross-learner access, same-key retries, different-payload conflicts and concurrent updates. Test the complete magic-link flow including automated GET scans and cross-device use. Trace diagnostic skip through a saved recommendation. Replace this draft with tested route schemas and compatibility rules as code is added.

M2 entry uses [versioned scenario placement, saved enrollment preferences and owned recommendations](course-entry-acceptance.md). Placement never creates achievement evidence. Enrollment preferences remain separate from immutable accepted plan input.

GET /dev/mail is a development-only test inbox, not a learner API. It is disabled outside explicitly selected local mode. [ADR-004](decisions/004-local-email-preview.md) owns its boundaries.

## M4 shared activity extensions

POST /api/learning accepts practice, independent, recall or transfer for owned placed AI-2/CY-2 preview enrollments. Recall requires due compatible independent evidence, transfer requires initial proof and an unpassed transfer dimension. ACTIVITY_NOT_AVAILABLE is 409, ACTIVITY_ALREADY_STARTED directs the learner to saved history. CY-2 uses the existing bounded draft fields: prompt contains selected request/routine action IDs as JSON, checklist and explanation contain message rationales. Submission requires valid actions and both rationales, no Practice AI call. CY Practice AI requests are rejected. All ownership, origin, revision, frozen snapshot, assessment lease/retry and replay guarantees remain shared. GET /api/learning includes objectiveId, current recall availability, separate retention/transfer dimensions and evidence-linked misconception history. Migration 0005 is explicit setup, never startup.

## Goal-first generated tutor expansion

CN-TUTOR-001 follows the user's 2026-10-14 approved product realignment. Goal-first onboarding replaces fixed-course choices for new setup, while historical enrollments remain readable. The generated engine is isolated from AI-2/CY-2 evidence and does not reinterpret old assessments. Adults select simple/beginner/standard/technical explanation, balanced/visual presentation and 10/20/40-minute sessions independently. English only, no age inference or fixed learning-style claims.

Owned path snapshots pin configuration, ordered objectives, diagnostic questions and immutable goal/preferences. Migration 0006 is additive and explicit. Row locking serialises revisions, request keys bind payloads, unpredictable leases bound generation and stale results cannot overwrite recovered requests. Public projections remove diagnostic answer keys. Placement never creates mastery evidence. Generated content remains a preview with independent reference/rubric review required before learner release.

## Generated tutor teaching persistence

TutorSession carries an owned path/module, pinned teaching preferences, immutable lesson/criteria/reference snapshots, provider fingerprint and canonical content hash. Migration 0007 adds isolated owned JSONB sessions. Draft revision locking preserves position, interactive selections, application and teach-back. Successful content is reused for the same owned module. Generation and re-explanation use bounded leases, explicit retries and recorded failures. Public lesson projections omit guided activity answer keys. Native visuals always include equivalent labels and explanations, and matching/ordering use keyboard-accessible native selects. Re-explanation records assistance without replacing the lesson or implying mastery.

## Generated tutor assessment and recovery

Generated submissions pin the complete lesson, criteria, reference snapshots, answers, help, content hash, assessor configuration and generated-practice-v1 policy before provider I/O. A unique learner/submission-key index prevents conflicting reuse. Lease/count claims, assessment histories and unique supported-practice evidence commit atomically in the owned session row. Valid literal citations are required for met judgments, and deterministic activity checks also gate supported-practice completion. Uncertain or failed output never creates successful practice evidence. Guided work never creates independent demonstration, retention or legacy capability evidence.

GET /api/tutor/paths/:id/recommendation returns the next supported learning action from saved placement and successful practice. POST /api/tutor/sessions/:id/submit saves a frozen assessment request, /assess retries the same snapshot and /save rejects changed answers after freezing. Fresh remediation creates a new owned session linked to its predecessor. POST /api/tutor/paths/:id/preferences updates explicit future teaching preferences with revision checks, without replacing accepted goals or saved lessons. Original answers, feedback, source versions and assessment histories remain inspectable through Your work.
