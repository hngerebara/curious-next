# M3 durable-attempt acceptance

## Scope and completion

[Plans.md](../../Plans.md) defines M3 as Practice AI, separate instructional assistance, frozen submission, validated assessment and an atomic evidence/recommendation transaction, validated by V3/V6/V7/V8/V12. CN-ATTEMPT-001 implements the authorised English AI-2 preview. This document records engineering acceptance, not curriculum approval, model reliability certification or learner release.

The earlier status ledger grouped M1 subject/calibration approval and D7 hosted-worker acceptance under M3. Those remain open in their authoritative homes: [curriculum review](../curriculum/rubric-calibration.md), [deployment](deployment.md) and [debt D7](../exec-plans/tech-debt-tracker.md). M3 completion does not waive them or complete M2's actual screen-reader walkthrough. No application is deployed.

## Acceptance evidence

| Requirement | Evidence and boundary |
|---|---|
| V3, assisted practice then fresh proof | Real PostgreSQL-semantic tests and the original configured Better Auth/Neon/Groq browser journey. Assistance is persisted before delivery. Assisted evidence remains Developing, fresh all-met independent evidence establishes preview Demonstrated. |
| V6, identical retries | Concurrent processing, optimistic draft conflicts, duplicate submission and replay tests. Original and v5-profile browser replay preserve one assessment/evidence transaction. |
| V7, failure and interruption | Timeout, malformed output, uncertain decisions, expired leases, stale completion and final exhaustion tests. Rejected HTTP 400 generation adds no evidence. Same frozen work retries under the pinned configuration and stops after three claims. |
| V8, ownership | Authenticated cross-learner read/write/help/practice/submit/assess denials, nested ownership and real local session 404 checks. |
| V12, model mistakes | Accurate learner inspection of noncompliance is credited. Repeated configured fictional fixtures distinguish accurate detection from missed errors and injected grading instructions. |
| Atomic durable persistence | Submission/job commit before provider access. Assessment/evidence/capability/change/recommendation commit together. Fault-injected storage rollback and configured Neon server-restart restoration preserve history. |
| Lesson V9 | Saved variants preserve task, rubric, draft and default preference. Current-profile browser restoration verifies continuity. |
| Rendered journey | Actual 320/1440px reflow, doubled text and keyboard checks are recorded in original browser evidence. This is not a screen-reader or participant accessibility audit. |

Original configured [journey checks](../design-artifacts/attempt-loop/validation.json), [v5 profile check](../design-artifacts/attempt-loop/assessment-v5-validation.json), [mobile feedback](../design-artifacts/attempt-loop/feedback-320.png) and [desktop feedback](../design-artifacts/attempt-loop/feedback-1440.png) remain inspectable. Final v7-profile validation is pending available daily Groq capacity, see the status ledger.

## Feedback integrity and recovery

The v5 study found a correct A5 rejection with inaccurate five-pair feedback for a four-pair response. The reason-code protocol removes unrestricted provider prose. The assessor selects a criterion-specific reason code and evidence IDs. Met requires complete, uncertain requires ambiguous, and not_met requires a permitted remediation reason. Unknown, foreign or contradictory reasons fail closed. The server renders feedback from fixed versioned wording and literal response inspection. No grading standard changes.

Only complete unambiguous explicit Q:/A: structures receive automated counts. Question labels are excluded, answer words use whitespace-separated tokens, exactly 30 fails the below-30 limit. Incomplete answers, repeated labels and alternative formats receive no automated count. Alternative markup remains valid assessment evidence. Response noncompliance never automatically fails a learner who accurately diagnoses it.

Assessor configuration fingerprints include protocol version, instructions, feedback reason wording and completion-token allowance. Historical frozen inputs and feedback are preserved. Existing successful jobs return their original result. Pending/failed jobs cannot be retried under changed settings, fresh work uses a new attempt. Provider HTTP 400, 429, timeout or invalid output remains explicit and adds no demonstration. Availability cannot be guaranteed by a finite fixture run. Learners retain bounded retry and optional review.

## Reproduction and remaining release gates

Run Node.js 24 application checks and all repository checks listed in [engineering](engineering.md). The README opt-in fixture study uses fictional data, preserves every result, excludes explicitly simulated failures from live-call counts and keeps expectations out of model input. Author-assigned labels are not independent calibration approval.

Before learner release: obtain M1 reference/rubric approval and independent calibration, validate hosted worker execution and operational budgets under D7, complete actual assistive-technology and participant journeys, and finish privacy/retention/email/deployment acceptance. Recall, transfer and cybersecurity remain M4 work, exports remain M5. No automatic merge or deployment is authorised by this engineering acceptance.
