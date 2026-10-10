# M2 course-entry acceptance

## Scope and completion

[CN-ENTRY-001](../exec-plans/active/course-entry.md) / THE-17 finishes entry into a draft course, not a learning/assessment release. M2 completes only when every gate below has evidence. Merging a PR is delivery, not acceptance. Each milestone report states passed criteria, remaining criteria and the next step.

| Gate | Required evidence |
|---|---|
| Public entry and access | General course cards have no syllabus breakdown. Magic-link access uses verified sessions, explicit confirmation and honest failure states. |
| Goal and course plan | Goal/preferences persist, real Groq proposals validate objective coverage, mixed/vague/unsupported states recover, accepted history remains immutable. |
| Diagnostic and skip | Short objective-based questions, provisional explained placement, skip/beginning override, Not assessed capability labels. Neither route awards evidence. |
| Return and preferences | Return without URL state restores accepted enrollment. Preference changes use version checks, preserve objective/rubric IDs and update achievable guidance. |
| First action | One primary action, at most two alternatives, estimates within 10/20/40-minute budget. Unreviewed lessons remain unavailable. |
| Trust and recovery | Real-session isolation, duplicate/concurrent operations, outage/expired-session recovery and preserved confirmed work. |
| Accessible entry | Mobile 320px, keyboard, text resizing, labelled controls, state announcements and actual screen-reader walkthrough. Automated semantics alone do not complete this gate. |
| Real services | Synthetic learner journey using the Neon PostgreSQL driver and local captured mail, confirmation, persistence after restart and cross-learner denial. Actual inbox delivery is a deployment gate per ADR-004. |

## Diagnostic and recommendation policy

entry-diagnostic-v1 has one fictional multiple-choice task per selected objective, up to five tasks. Server returns questions/options without answer keys. Submit exactly one offered option ID per task plus diagnosticVersion. Server pins question IDs, answers and placement policy. First gap in prerequisite order recommends that module. If all checks pass, recommend the last selected module for application/review. All placement is provisional, not capability evidence. Old self-reported records remain unchanged and visibly distinguished.

Skipping starts the first module. Starting from the beginning after a diagnostic changes the learner-selected start, preserving the original answers/recommendation. New diagnostic criteria remain draft until subject review. Do not describe one question as proof of mastery.

entry-guidance-v1 selects a preview overview after placement, or starting-point selection before placement. Estimates fit the selected session budget. At most two alternatives cover another entry action or preference editing. Capability labels remain Not assessed. Model wording never grants capability or unlocks unreviewed lessons.

## Interfaces and persistence

GET /api/profile/goal restores goal, latest plan, enrollment associated with that plan and the latest enrollment ID for an older-course resume link. GET /api/enrollments/:id/diagnostic returns versioned questions. POST /api/enrollments/:id/placement accepts skip, beginning or diagnosticVersion plus bounded option IDs. Repeated identical placement returns the same record, conflicting replacements return 409.

PATCH /api/enrollments/:id/preferences accepts explanationLevel, teachingLanguage (en), sessionMinutes and expected version. Preferences are independent of immutable accepted plan input. Optimistic updates and identical retries preserve one version. GET /api/recommendation?enrollmentId=... derives owned guidance from saved placement/preferences. No evidence writes.

Apply additive migration 0003 after 0001/0002 through a migration role. Existing enrollments default to the original goal preferences at version zero. No hosted migration runs at startup.

## Validation and open boundaries

V1/V2 are M2 placement checks. M2 validates V9 preference persistence and first-action pacing, M3 validates its lesson-variant behavior. Lessons, independent tasks and grading belong to M3. M6 still requires participant usability and reviewed language parity. M1/M1.5 approval remains required before learner release.

Local end-to-end tests use real Better Auth and PGlite with captured email and synthetic generation. Local acceptance uses real Neon, captured test mail and the already selected Groq configuration. Real delivered email is deferred to deployment per [ADR-004](decisions/004-local-email-preview.md). No mocked test is labelled real-service acceptance. Neon/local capture acceptance passed in CN-LOCAL-AUTH-001, actual screen-reader validation remains pending. Add secrets locally or in deployment settings, never in chat or Git.
