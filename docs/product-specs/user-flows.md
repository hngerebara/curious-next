# CuriousNext user flows

## Ownership and entry conditions

This document owns end-to-end learner journeys and recovery routes. [Pilot design](pilot-design.md) owns progression policy, [domain model](../design-docs/domain-model.md) owns invariants, and [frontend](../FRONTEND.md) owns screen states. Authentication protects private work, but its concrete implementation is an M1 decision. All journeys below are requirements, not completed tests.

## UF1: Set a goal and choose a course

1. Learner sets a goal, teaching language, explanation level and available time. Language and explanation level are independent.
2. CuriousNext generates one goal-specific proposal within a supported subject, with relevant objectives, prerequisite closure and fit reasons. Vague/mixed goals receive one clarification. Unsupported goals show the boundary and offer supported options.
3. Learner chooses a course. Back navigation preserves entered preferences and does not enroll twice.
4. Learner chooses an optional diagnostic or Start from the beginning.
5. Diagnostic answers recommend a provisional starting module with reasons. Skip starts module one. Neither route fabricates achievement.
6. Learner sees one next action and up to two alternatives for the selected budget.

Interrupted onboarding resumes its last confirmed draft. Unavailable language content prompts explicit language selection without silently substituting English. Validation: V1, V2, V9.

## UF2: Learn and practise with support

1. Learner starts the recommended activity and sees its objective and saved lesson variant.
2. Explain differently changes presentation while retaining the objective. Changing the default requires explicit acceptance.
3. Learner enters practice. Practical AI uses its integrated tool, with learning assistance in a separate panel. Cybersecurity uses inert simulations.
4. Contextual help is delivered and recorded. Learner revises work and sees save status.
5. Learner proceeds to a fresh independent task when ready, or chooses further practice.

Generation errors preserve input. Draft-save conflicts offer the latest saved draft rather than overwriting it. Validation: V3, V9, V10, V12.

## UF3: Demonstrate ability and receive feedback

1. Learner sees independent-task requirements and permitted tools, submits practical output and teach-back reasoning.
2. Submission freezes the attempt and assistance history. Repeated submission returns the same result.
3. Assessment displays pending until a validated decision exists.
4. Successful assessment shows criteria, supporting evidence, gaps and a next action. Capability state follows domain policy.
5. Failed assessment preserves work and offers retry. Uncertain assessment offers retry or optional human review without blocking learning and practice.

Substantive learning-assistant help changes the attempt to assisted work. Screen readers, magnification and accessible presentation do not. Editing after submission starts fresh work, not a rewrite of historical evidence. Validation: V3, V6, V7, V12.

## UF4: Correct a misconception

1. Feedback identifies a specific wrong model only with supporting attempt evidence.
2. Confirmed blocking misconceptions lead to targeted practice. Ambiguous candidates remain unconfirmed.
3. Learner completes corrective practice and then a fresh independent check.
4. Valid correction evidence resolves the misconception and updates the recommendation. Earlier attempts remain visible.

Assisted correction alone does not establish independent repair. Validation: V4.

## UF5: Return for recall and transfer

1. Returning learner sees due recall within the next-action flow.
2. A short retrieval task checks retention. A separately labelled new-context task checks transfer.
3. Results update their distinct evidence details and relevant review needs. Historical demonstration remains visible.
4. Next action balances review with advancement according to pilot policy.

Elapsed time alone does not turn an ordinary attempt into a retention check. Validation: V5.

## UF6: Finish and inspect portable evidence

1. Learner completes the final workflow or incident simulation with artifact and reasoning.
2. Feedback links final criteria to the relevant objectives.
3. Learner opens evidence details and downloads a readable summary or JSON snapshot.
4. Export includes assessment dates, assistance, criteria, methods and limitations. It makes no accreditation or employment claim.

Exports contain only the learner's authorised records. Expired authentication requires reauthentication without exposing another learner's work. Validation: V8, V11.

## UF7: Access and preference continuity

All journeys support keyboard and screen-reader operation and equivalent text for visuals. Language switching preserves work and original-language submissions. Assistive access needs no disability disclosure. Authentication expiry and network interruption preserve the last confirmed state and show clear recovery actions. Validate V10 and language parity at M6, with accessibility testing beginning at M2.

[Acceptance scenario definitions](pilot-design.md#7-validation-scenarios-and-release-gates).

## Public entry and email verification

Before UF1, the public homepage explains the learning loop and the two pilot courses. Set your goal begins new-learner setup. Log in opens the shared magic-link sign-up/login entry. Enter email → submit → neutral accepted-request/check-email screen → open link → explicit verification confirmation → verified session. A new verified account proceeds to UF1. A returning learner resumes a validated authorised learning destination. Expired/used links offer a new request. Network failure and resend limits preserve entered email without revealing whether an account exists. Session expiry returns to confirmed work after verification. Authentication is specified, not implemented.

## Goal-first generated tutor expansion

CN-TUTOR-001 follows the user's 2026-10-14 approved product realignment. Goal-first onboarding replaces fixed-course choices for new setup, while historical enrollments remain readable. The generated engine is isolated from AI-2/CY-2 evidence and does not reinterpret old assessments. Adults select simple/beginner/standard/technical explanation, balanced/visual presentation and 10/20/40-minute sessions independently. English only, no age inference or fixed learning-style claims.

Owned path snapshots pin configuration, ordered objectives, diagnostic questions and immutable goal/preferences. Migration 0006 is additive and explicit. Row locking serialises revisions, request keys bind payloads, unpredictable leases bound generation and stale results cannot overwrite recovered requests. Public projections remove diagnostic answer keys. Placement never creates mastery evidence. Generated content remains a preview with independent reference/rubric review required before learner release.
