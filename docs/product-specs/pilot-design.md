# CuriousNext pilot design

Version: 0.1. Date: 2026-10-07. This specification defines required behavior. Curriculum review states live with the curriculum, and implementation status lives in [Documentation.md](../../Documentation.md).

## 1. Product boundaries and decisions

Adult beginners choose between Practical AI and Cybersecurity Essentials. Both have five shared modules. Personalised pathways select the starting point, support, examples, review, and next action. Required objectives, prerequisites, and assessment standards remain versioned and consistent.

Goal and explanation preference come first, followed by a goal-specific generated course proposal explaining relevance and prerequisites. Proposal objectives come from a pinned subject catalogue and prerequisite closure. See [generation contract](../design-docs/course-generation.md). Unsupported goals receive an honest boundary and related supported options. Course choice belongs to the learner. Four to six optional diagnostic items recommend a provisional starting module. Start from the beginning always works. Placement never creates achievement evidence. Learners may revisit earlier modules.

Explanation choices: Very simple, Beginner-friendly, Standard, Technical. In lessons and practice offer Make it simpler, Give an example, Show visually, Explain further, Go deeper, and I'm stuck. Save variants and per-concept choices. Changes to the default require explicit acceptance. Visuals clarify ideas and have text equivalents. There are no fixed learning-style labels.

Use one configured text-based practice model inside CuriousNext. Separate its conversation from learning-assistant help and assessment. AI generation stays within approved objectives and reference material. No web browsing, tool execution, uploads, voice, or external model accounts are required for learners. All cybersecurity examples use inert fictional data.

## 2. Curriculum interfaces

The shared course syllabuses and reference modules live in [curriculum](../curriculum/index.md). They own module objectives, prerequisites, lesson text, tasks, rubrics, and remediation. This document owns the learner flow and adaptation behavior. Do not duplicate curriculum content here.

## 5. Progression, sessions, and failures

Policy version: pilot-v1. Each objective requires practical application and conceptual criteria, completed successfully without substantive learning-assistant help. Practice AI use is expected for AI tasks and does not count as instructional assistance. Navigation/accessibility support does not make an attempt assisted. A hint, example solution, or substantive clarification of an answer does. Assistance is recorded at delivery, before submission.

Not assessed: no assessed application evidence. Developing: assessed partial or assisted evidence. Demonstrated: successful independent evidence for all objective criteria. Needs review: later failed retention/transfer or a confirmed contradictory misconception, while historical demonstration remains visible. Initial success does not imply verified retention. Successful targeted independent recheck restores Demonstrated if review reasons are addressed. AI assessor uncertainty alone does not erase a prior demonstration.

Confirmed misconceptions contain exact evidence, explanation, review state, and a correction criterion. Unconfirmed candidates do not block advancement. Resolution requires a different, successfully assessed attempt. New contradictory evidence can reopen the record with history preserved.

Session selection is deterministic. Filter for course, readiness, availability, device, and estimated fit. Order: confirmed blocking misconception or missing prerequisite, insufficient independent evidence, final-task gaps, due recall, then next module. Tie-break by prerequisite order, oldest unresolved evidence need, then activity ID. Expose the evidence-based reason. Select up to two distinct alternatives.

10 minutes: one explanation/practice unit or short review. 20 minutes: one bounded learn-and-practise or independent reference task. 40 minutes: several bounded activities or a final-task segment. Do not imply the entire course/final task fits. Learners can resume preserved drafts. If nothing fits, offer a smaller supported activity and disclose its scope.

Due-review scheduling defaults: 1, 3, 7, 14, 30 days after evidence. Success advances interval, failure produces targeted practice and schedules a next-day recheck. Transfer is a separately labelled activity after initial demonstration. Include at most one scheduled recall activity before a non-review action per session unless the learner explicitly chooses review-only. No predictions of the exact forgetting moment.

Assessment states: pending, succeeded, uncertain, failed. Validate schema, criterion coverage, cited evidence, and rubric versions. Timeout or invalid output becomes failed with retry available. Retry reuses the frozen submission and cannot duplicate evidence. An optional review request does not restrict lessons or practice. A new edited submission is a new attempt. Human decisions are additional assessment records with provenance.

Evidence summary: objective and course, practical/conceptual criteria, first demonstration, later recall/transfer, assistance, dates, artifacts, assessment method and limitations, unresolved review reasons. Offer readable HTML/print and JSON export. No accreditation, employment, or employer-verification claim. No combined mastery percentage.

## 6. Screens and continuity

Screens: goal/preferences, course suggestions, course overview/optional diagnostic, next action/session, lesson, practice workspace, independent task/teach-back, feedback, capability/evidence detail, and final task/export. Misconceptions appear in feedback and objective detail rather than a mandatory extra dashboard.

At 360px width, stack workspaces, retain readable text and labelled controls, and avoid horizontal scrolling for core tasks. Full keyboard support, visible focus, text alternatives, and accessible status announcements are required. Compare responses through stacked cards on mobile. Preserve server-confirmed drafts and show save status. Interrupted connections retain the last confirmed state and allow retry. No offline-learning or offline-assessment promise.

Empty: explain what evidence is missing and offer a start action. Loading: show the action in progress without fabricated outcomes. Failed AI generation: retain the draft and offer retry/reference content. Assessment pending/uncertain: show status, not a guessed grade. Preference change: offer a saved new variant without erasing the previous attempt or silently changing the default.

## 7. Validation scenarios and release gates

| ID | Scenario | Required result |
|---|---|---|
| V1 | Beginner in each course skips diagnostic | Starts module 1, with Not assessed capabilities and no fabricated achievements. |
| V2 | Diagnostic recommends later module | Explains provisional placement, preserves missing prerequisite evidence, permits starting from beginning. |
| V3 | AI-2 practice uses learning-assistant hint, then fresh proof succeeds | Practice is assisted/Developing, fresh independent proof creates demonstration and recommends iteration. |
| V4 | CY-2 learner trusts logo | Evidence-linked misconception and targeted practice appear. Fresh successful transfer resolves it, prior error remains. |
| V5 | Recall fails after demonstration | Shows Needs review and preserves first demonstration. Transfer stays a separate evidence type. |
| V6 | Duplicate submission/retry | Returns same attempt/result without additional evidence or recall schedule. |
| V7 | Assessor timeout, malformed output, uncertainty, or contradictory decisions | No new demonstration. Saved submission, retry, and optional review remain available. |
| V8 | Cross-learner read/write/export | Denied, including nested artifacts and conversation records. |
| V9 | Change explanation and time budget | Objective/rubric unchanged, saved variant and achievable recommendation shown. |
| V10 | Mobile, keyboard, interrupted connection | Core journey remains usable, saved work resumes, errors are announced. |
| V11 | Final workflow/incident | Export contains artifact, criteria, provenance, assistance, and honest labels. |
| V12 | Practice AI gives noncompliant response | Accurate learner inspection is credited, model fluency is not mistaken for ability. |

These are future application acceptance tests. This documentation phase validates coverage and consistency only. Before release, review source fidelity, rubrics and alternative valid answers, run calibrated example assessments, execute V1-V12 in both relevant slices, and inspect actual rendered screens. Later module lessons require the same review.

## 8. References and deferred work

Source approval and limitations live in the [reference register](../references/curriculum-sources.md).

Deferred: unrestricted syllabuses, learner uploads, voice, recorded video, external AI tools, live offensive security labs, separate weekly-review screens, extensive analytics, offline synchronisation, job placement, and professional certification. Stack selection belongs to the later application architecture phase.

## 9. Accessibility and language release

Accessibility is a baseline, not a separate learner track. Target WCAG 2.2 AA, with screen-reader, keyboard, contrast, zoom/reflow, accessible authentication and equivalent structured text. Assistive access does not mark attempts assisted. Simulated-message text exposes sender and destination neutrally, without solution hints. Test VoiceOver and NVDA complete journeys, plus blind/low-vision participant usability before conformance claims.

Teaching language (English, Nigerian Pidgin, Igbo, Yoruba, Hausa) is separate from explanation level and presentation. Persist language per learner and lesson variant. Localise instructions, hints, feedback and assessment. Preserve technical terms with reviewed bilingual glossaries and accept code-switching. Assess concepts rather than unrelated grammar. Missing approved content shows availability honestly and offers an explicit language switch. No silent fallback.

Language releases require reviewed glossary, lesson variants, rubric parity examples, fluent-speaker approval and learner usability checks. Correct language metadata supports assistive pronunciation. Optional read-aloud remains deferred until voice/pronunciation review. No completed translation or voice capability is claimed.
