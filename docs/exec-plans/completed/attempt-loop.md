# CN-ATTEMPT-001: Durable clear-prompts loop

## Plan lifecycle

Completed authorised M3 preview engineering, [THE-19](https://linear.app/the-curious-tech-girl/issue/THE-19/implement-m3-clear-prompts-attempt-loop). The user explicitly authorised proceeding on 2026-10-09 while M2's actual screen-reader walkthrough remains pending. M2 is not complete. PR #20 now targets main after CN-LOCAL-AUTH-001 / PR #19 merged. No learner release is authorised.

## Deliverables and sequence

Update transport/persistence contracts first, then implement the AI-2 v2 reference module before expanding. Save versioned English lesson variants, optimistic drafts, practice-AI requests and separate delivered assistant events. Freeze all work and task/rubric/policy snapshots in a submission transaction with one durable assessment job. Validate criterion coverage and exact evidence quotes before an atomic assessment/evidence/capability/change/recommendation commit. Keep failure, uncertainty, optional review, retry and owned history inspectable. Preview projections never imply approved curriculum or verified retention.

## Recovery and validation

An authenticated explicit assessment-processing request claims a bounded database lease and awaits the provider. The job survives interruption and an expired lease is reclaimable. No detached promises or GET side effects. Three claims maximum, with stale completions rejected. Practice requests similarly persist request identities and failures. Instructional help is authored reference material, persisted before delivery, and cannot reset assistance. A submitted attempt is immutable, fresh work uses a new attempt.

Validate V3/V6/V7/V8/V12 and lesson-variant V9 using real PostgreSQL semantics, provider-boundary tests, mobile/keyboard rendered checks and configured synthetic-data service evaluation. Run all required repository/application checks and self-review, fix findings, publish/attach the ticket-linked PR and inspect latest-head CI. Record passed checks and remaining gates in Documentation.md. M1 subject/rubric/calibration approval, M1.5 acceptance, M2 screen-reader journey and deployment gates remain open.

2026-10-10: reference implementation and configured local browser/restart checks are recorded in Documentation.md. The four-call adversarial evaluation retains two provider errors. Calibration/reliability and hosted processing acceptance remain open. The review slice does not complete M2 or authorise expansion/release.

2026-10-10 acceptance continuation: investigate provider schema rejection and incorrect A2/A6 judgments through repeated frozen AI-2 fixtures. Preserve all samples and their model/prompt fingerprints. Uniform criterion output retains checklist/response evidence requirements. Human review, CY-2 assessment and learner release remain separate gates.


Final v5 continuation: 15/16 live calls produced valid matching assessments (90/90 matching criteria), one HTTP 400 remained unavailable. Two simulated failure cases passed, no unexpected demonstration occurred. Current-profile Neon/Groq fresh proof, replay and variant restoration passed. All earlier samples remain inspectable. One A5 feedback sample miscounted four response pairs as five despite the correct rejection. Independent calibration, factual feedback accuracy, provider availability and hosted processing remain open, no milestone completion is claimed.


Completion request after PR #20 merge: implement constrained reason-code feedback, conservative count publication and a smaller pinned completion allowance. [Acceptance map](../../design-docs/attempt-loop-acceptance.md) separates M3 implementation from M1 calibration and pre-deployment D7. Preserve v6/partial-v7 studies and the confirmed 200,000-token daily quota diagnostic. Final configured-profile validation is pending capacity, do not complete the milestone or archive this plan until it passes. No model fallback or billing change is authorised.


Completion: current-profile configured browser failure/recovery/replay and actual local server restart pass. The final 3,200-token study preserves 15/16 valid matching calls and one unavailable provider result, the focused retry passes twice. V7 validates no evidence from failure and bounded recovery, no availability guarantee or calibration approval is claimed. All studies and earlier failures remain in Documentation.md. M1 independent review, M2 screen-reader acceptance and D7 hosted-worker deployment gates remain open. The completion slice is prepared for review. Leave its PR open and unmerged.
