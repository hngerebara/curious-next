# CuriousNext frontend guidance

## Boundaries

UI imports application and contracts, never provider/storage adapters. Bootstrap composes implementations. Next.js/React is accepted in ADR-002. The English preview implements staged setup, Today/Your path/Your work, contextual tasks and saved feedback. Acceptance claims belong to Documentation.md.

## Required behavior

Support keyboard/screen-reader journeys, mobile reflow, accessible authentication and status announcements. Preserve draft save status and errors. Show pending/uncertain assessments honestly. Separate practice AI and learning assistance. Escape submitted text and make simulated links inert. Announce completed messages rather than every streamed token.

Validate rendered journeys and accessibility alongside behavior tests. [Architecture](../Architecture.md), [design](DESIGN.md), [pilot](product-specs/pilot-design.md).

## Screen behavior specification

| Screen | Required inputs and actions | Empty/loading/error behavior |
|---|---|---|
| Goal and preferences | Goal, language, explanation level, time, Next/Back. | Preserve draft, inline labelled errors, explicit unavailable-language options. |
| Course suggestions | Outcomes, relevance, prerequisites, select course. | Unsupported-goal boundary, loading status, retry without duplicate enrollment. |
| Course overview and placement | Optional diagnostic, start from beginning, module choice. | No fabricated completed prerequisites, saved answers on interruption. |
| Next action | Primary task, reason, estimate, time choices, alternatives. | Explain missing evidence, refresh after outcomes, disclose no fitting task. |
| Lesson | Objective, saved variant, example, alternative explanation, practice. | Preserve variant on failure, explicit language switch, text alternative to diagrams. |
| Practice | Brief, workspace, practice AI where relevant, separate instructional help. | Save-state indicator, retained input on generation failure, retry using request identity. |
| Independent task | Permitted tools, practical artifact, teach-back, submit. | Assistance status visible, immutable submitted view, prevent duplicate submit and preserve retry identity. |
| Feedback | Assessment state, criterion results/evidence, next action, optional review. | Pending/uncertain/failed are explicit, no invented grade, learning remains accessible. |
| Evidence and final work | History, criteria, dates, retention/transfer, export. | Honest missing-evidence state, authorised export retry and final-task draft recovery. |

## Interaction and continuity

Browser state cannot award capabilities or decide ownership. Fetch validated results through application interfaces. Submitted content is immutable. Submit for feedback performs save, freeze and assessment as one learner action. A failed assessment retains the frozen snapshot and exposes retry. Unsaved edits trigger a navigation warning. Account preferences include standard, 150% and 200% text sizing, stored locally as presentation only. It never changes learning evidence or assistance. Existing enrollment and attempt links remain recoverable. Concurrent draft revisions expose a conflict and permit recovery instead of silently overwriting newer work. Session expiry retains recoverable confirmed work and returns through accessible authentication.

Focus moves to the new screen heading after intentional navigation, to actionable errors on failed submit when appropriate, and back to the initiating control after dialogs. Announce save/generation/assessment status without stealing focus or reading every token. Maintain visible labels and error relationships.

Language switches preserve drafts and original-language evidence. Unavailable variants show an explicit choice. Do not change the learner's default preference silently. Accessibility support remains non-substantive assistance. Review the [user flows](product-specs/user-flows.md), [security boundaries](design-docs/security.md) and [design system](DESIGN.md).

## Acceptance and interfaces

Validate V1-V12 and accessible keyboard/screen-reader navigation on actual rendered screens. Use reviewed language examples for long labels, accents and code-switching. Current logical operations live in the [data model](design-docs/data-model.md). M1 produces transport-specific API schemas and errors before frontend/backend integration. Local authentication, course and learning APIs are implemented. M5 export/final-work and M6 reviewed localisation remain outside this redesign.

## Public entry and authentication

Public homepage introduces the pilot courses and leads to goal setup, with a separate Log in action. Sign-up and login both use a single labelled email field and Send me a magic link. Do not offer password entry, password reset, social providers or numeric code entry. Submission, neutral request acceptance, check-email, change-email, rate-limited resend, expired/used links, network failure and session-expiry return require accessible states. Responses must not reveal account existence. Verification success sends new learners to goal setup and returning learners to a validated saved destination. Design previews never send email or create an account.

## Goal-first generated tutor expansion

CN-TUTOR-001 follows the user's 2026-10-14 approved product realignment. Goal-first onboarding replaces fixed-course choices for new setup, while historical enrollments remain readable. The generated engine is isolated from AI-2/CY-2 evidence and does not reinterpret old assessments. Adults select simple/beginner/standard/technical explanation, balanced/visual presentation and 10/20/40-minute sessions independently. English only, no age inference or fixed learning-style claims.

Owned path snapshots pin configuration, ordered objectives, diagnostic questions and immutable goal/preferences. Migration 0006 is additive and explicit. Row locking serialises revisions, request keys bind payloads, unpredictable leases bound generation and stale results cannot overwrite recovered requests. Public projections remove diagnostic answer keys. Placement never creates mastery evidence. Generated content remains a preview with independent reference/rubric review required before learner release.

## Generated tutor teaching persistence

TutorSession carries an owned path/module, pinned teaching preferences, immutable lesson/criteria/reference snapshots, provider fingerprint and canonical content hash. Migration 0007 adds isolated owned JSONB sessions. Draft revision locking preserves position, interactive selections, application and teach-back. Successful content is reused for the same owned module. Generation and re-explanation use bounded leases, explicit retries and recorded failures. Public lesson projections omit guided activity answer keys. Native visuals always include equivalent labels and explanations, and matching/ordering use keyboard-accessible native selects. Re-explanation records assistance without replacing the lesson or implying mastery.
