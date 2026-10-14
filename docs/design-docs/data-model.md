# CuriousNext data model and interfaces

Version: 0.2. Date: 2026-10-09. Authentication/course entry have migrations 0001-0003. CN-ATTEMPT-001 adds the AI-2 preview contract below. Later milestone records remain logical specifications. [Pilot design](../product-specs/pilot-design.md) owns progression.

The [domain model](domain-model.md) owns conceptual invariants. This document owns records, persistence and logical service operations. The [security specification](security.md) owns threat controls.

## 1. Ownership and conventions

Use opaque IDs, UTC timestamps, explicit versions, and learner-local date rendering. All learner-owned records carry learner_id. Derive it from authenticated identity, never trust a request's ownership field. Validate ownership on reads, writes, exports, nested foreign keys, and conversation access. Public curriculum is separate from private attempts. Demo identities and data are explicitly labelled and isolated.

Published curriculum/rubric/policy versions are immutable. New versions do not retroactively change assessments. Retain historical attempts and assessment decisions. Capability summaries are rebuildable projections, not primary evidence. A change history preserves state before/after and its cause.

No raw credentials or real cybersecurity account data are required. Keys and model configuration stay server-side. Escape text in previews and exports. Simulated destinations are inert. Uploaded files and executable code are outside scope.

## 2. Curriculum and personalisation entities

| Entity | Minimum fields and relationships |
|---|---|
| CourseVersion | course_id, version, title, outcome, supported_goal_tags, audience, ordered module IDs, publication status, reference approvals |
| ModuleVersion | module_id, version, course version, objective IDs, order, estimated activities |
| ObjectiveVersion | objective_id (AI-1..AI-5 or CY-1..CY-5), version, measurable objective, practical/conceptual criteria, prerequisite objective IDs, rubric version, policy version |
| ReferenceApproval | reference_id, URL, accessed_at, content snapshot/hash, mapped objectives, review status, reviewer and reviewed_at, approved lesson/rubric versions |
| RubricVersion | rubric_id, version, criterion IDs, required flags, descriptors, acceptable evidence, remediation mappings, scenario key version |
| PolicyVersion | policy_id, version, capability transition requirements, assistance rules, review/transfer rules, scheduling intervals, deterministic recommendation rules |
| ActivityVersion | activity_id, version, objective IDs, kind, brief/reference pack, rubric version, prerequisites, estimated_minutes, device requirement, scenario family, assessment key version, publication status |
| LearnerGoal | goal_id, learner_id, original goal, clarified supported outcome, background, self-reported experience, created_at, updated_at |
| TeachingProfile | learner_id, explicit default preference, preferred session_minutes (10/20/40), updated_at |
| CourseEnrollment | enrollment_id, learner_id, goal_id, course_id and pinned version, selected_at, diagnostic choice, current pathway revision |
| DiagnosticPlacement | placement_id, enrollment_id, diagnostic version, responses, suggested starting module, explanation, provisional prerequisite readiness, timestamp. Not an Evidence record. |
| PathwayRevision | pathway_id, enrollment_id, revision, selected module/activity IDs, placement/evidence causes, policy version, created_at |
| LessonVariant | variant_id, learner_id, enrollment_id, activity version, objective versions, reference approvals, explanation preference, goal context, generator/model version, content, content hash, validation status, created_at |
| PreferenceOverride | learner_id, objective_id, preference, explicit choice timestamp. Default changes remain separate. |

Use stable objective IDs across versions, with explicit version references in attempts. A new course version is opt-in for existing enrollments. Keep old evidence valid only for the pinned criteria. Changes require an explicit compatibility mapping or a new check, never an assumed equivalence. Source/reference status must be approved before learner publication.

## 3. Attempts, assistance, and assessment

| Entity | Minimum fields and relationships |
|---|---|
| Attempt | attempt_id, learner_id, enrollment_id, activity version, objective versions, mode (practice/independent/recall/transfer/final), status (draft/submitted/assessing/assessed), original attempt link if retrying learning, assistance status, draft revision, timestamps |
| PracticeConversation | conversation_id, attempt_id, learner_id, configured model/version. Messages contain sequence, role, text, timestamp and generation status. Used only for the Practical AI tool. |
| AssistanceEvent | event_id, learner_id, attempt_id, objective_id, kind (hint/worked_solution/answer_clarification/navigation/accessibility), substantive flag, delivered content snapshot, timestamp |
| LearningAssistantConversation | conversation_id, learner_id, attempt_id or lesson variant, message sequence, objective context, linked AssistanceEvent IDs. Never merge into PracticeConversation. |
| Submission | submission_id, attempt_id, learner_id, idempotency_key, submitted_at, frozen artifact, teach-back text, checklist/actions, practice conversation snapshot/hash, assistance snapshot, content hash |
| Assessment | assessment_id, submission_id, learner_id, method (deterministic/LLM/human/composite), model configuration if relevant, rubric/policy/key versions, status (pending/succeeded/uncertain/failed), criterion results, cited evidence spans, uncertainty reason, feedback, timestamps, superseded assessment link |
| ReviewRequest | review_id, learner_id, assessment_id, requested_at, status, optional reviewer and decision assessment ID |
| Evidence | evidence_id, learner_id, objective version, attempt/submission/assessment IDs, policy/rubric versions, type (assisted_application/independent_application/conceptual/retention/transfer/final), criterion results, assistance status, assessed_at, artifact link |
| FinalArtifact | artifact_id, learner_id, attempt_id, brief version, final text or simulated decisions, artifact hash, assessed evidence IDs |

Practical AI permits PracticeConversation in independent mode. It does not imply learning-assistant help. Record substantive assistance immediately when delivered. Once substantive help occurs, assistance cannot be reset for that attempt. Offer a fresh independent activity later. Normal practice-AI responses remain permitted tool outputs, even if helpful. Assess their use against the task criteria.

A submission freezes content and conversations. Late assistance cannot alter already submitted content. Editing creates a new attempt or draft, rather than overwriting a submitted artifact. Recall and transfer have explicit activity types and new scenario identifiers, never inferred from response similarity or elapsed time alone.

Assessment criterion result shape:

```json
{
  "criterion_id": "AI-2.context",
  "result": "met",
  "evidence_refs": [{"field": "prompt", "start": 0, "end": 45}],
  "feedback": "Your prompt includes the relevant source facts."
}
```

Allowed results: met, not_met, uncertain. Validate IDs, required-criterion coverage, evidence spans, version matches, and absence of unsupported claims. An uncertain required criterion prevents demonstration. Feedback text is not a progression command. The domain policy computes state from validated results. Assessment input treats submissions and model output as data, never instructions. CY tasks combine reviewed selected-action checks and LLM reasoning. Conflicts yield uncertain status. Failed/uncertain records produce no achievement Evidence, but remain visible in attempt history.

## 4. Misconceptions, capabilities, recommendations, and review

| Entity | Minimum fields and relationships |
|---|---|
| Misconception | misconception_id, learner_id, objective version, specific wrong model, source attempt and assessment, supporting spans, correction criteria, rubric/policy versions, status (unconfirmed/confirmed/resolved), blocking flag, reviewer provenance if present, timestamps |
| MisconceptionEvent | event_id, misconception_id, action (proposed/confirmed/resolved/reopened), source attempt/assessment, corrective evidence IDs, policy version, timestamp |
| CapabilitySummary | learner_id, objective version, state (not_assessed/developing/demonstrated/needs_review), first independent evidence, latest evidence, retention status/date, transfer status/date, review reasons, policy version, computed_at |
| CapabilityChange | change_id, learner_id, objective version, before/after state, causing attempt, evidence/assessment IDs, rubric/policy versions, timestamp |
| Recommendation | recommendation_id, learner_id, enrollment_id, pathway revision, primary activity, up to two alternatives, budget, estimated duration, reason code/text, evidence/placement references, policy version, computed_at, invalidation state |
| RecallSchedule | schedule_id, learner_id, objective version, anchor evidence, policy version, interval index, due_at, last assessed recall, status (scheduled/completed/superseded) |
| TransferCheck | transfer_id, learner_id, objective version, anchor independent evidence, source scenario family, new scenario family, activity version, due/available_at, attempt/evidence IDs, status |
| EvidenceExport | export_id, learner_id, goal/enrollment filters, snapshot time, policy/curriculum versions, included evidence IDs, format (HTML/JSON), generated_at |

Unconfirmed misconceptions do not block progression. Confirmation needs explicit supporting evidence. Resolution requires a new successful assessed correction attempt and independent application of the correction criterion. Assisted correction remains practice. Reopening adds an event rather than deleting resolution history.

Retention and transfer status: not_checked, demonstrated, needs_review. Confidence/uncertainty is stored independently and cannot be inferred from user preferences. A failed delayed check changes current review status without deleting initial evidence. A successful recheck addresses only its relevant review reason. Preserve other unresolved reasons.

Recommendations reference the evidence or placement behind their explanation. Order and review cap follow pilot-v1 in pilot-design.md. Regenerate after assessed evidence, misconception changes, relevant preference/budget changes, or due-time changes. AI may phrase a reason but cannot reorder activities or invent evidence.

## 5. Submission transaction and logical interfaces

These operations are stack-neutral contracts for later implementation, not currently available endpoints:

- SetGoalAndPreferences(goal, profile): returns supported course suggestions with relevance and prerequisites.
- SelectCourse(course_version): creates learner-owned enrollment and optional diagnostic choice.
- SubmitDiagnostic(enrollment, responses): stores provisional placement only.
- GetNextAction(enrollment, budget): returns primary action, up to two alternatives, fit estimate, reason and evidence references.
- GetLessonVariant(activity, preference): reuses the saved variant for matching content versions and explicit preference, or validates and saves a new variant.
- SaveDraft(attempt, expected_revision, content): optimistic concurrency, preserves submitted attempts.
- RunPracticeAI(attempt, message, request_key): authorised server model call, idempotent message sequence, stored result/error.
- RequestHelp(attempt, kind): stores delivered assistance and resulting assistance status before returning substantive content.
- SubmitAttempt(attempt, frozen_content, idempotency_key): returns the same submission for an identical retry, rejects a conflicting payload using the same key.
- GetAssessment(submission): returns explicit status, criterion feedback, and evidence references. No fabricated grade while pending.
- RequestOptionalReview(assessment): stores a request without restricting learning/practice.
- GetEvidence/ExportEvidence(filters): learner-scoped snapshot with traceable criteria and limitations.

Submission processing:

1. Verify ownership, attempt state, versions, draft revision, and input limits. Freeze input and assistance in a transaction.
2. Enforce unique (learner_id, idempotency_key) and one frozen submission per attempt. Same key with different hash returns conflict. Identical retries return the existing submission/status.
3. Assess outside the database transaction using the frozen input. Save every result or failure with its assessment identity. Retry failed assessment against the same snapshot.
4. On validated success, atomically create criterion-linked Evidence, misconception changes, CapabilityChange/projection updates, and recall/transfer anchors. Unique evidence keys prevent repeated callback/retry writes. Recompute or invalidate recommendations in that transaction.
5. Failed/uncertain outcomes persist without achievement changes. Human reassessment adds a new record and explicitly supersedes the active decision. Projection rebuilds include only active decisions while preserving superseded evidence history.

Uniqueness minimums: curriculum composite ID/version, conversation message sequence/request key, learner submission idempotency key, submission per attempt, evidence per submission/objective/type/rubric, misconception event source/action, active schedule per learner/objective/policy. Multiple criteria are stored within the relevant evidence record rather than duplicate identical evidence.

If an active decision is superseded, rebuild the affected summary and schedules from remaining valid evidence, record the cause, and expose the revision. Never silently rewrite earlier feedback. Optional human review does not delay access to the next available learn/practice activity.

## 6. Validation, migration, and limitations

Migrations are explicit setup operations and never run at startup. Existing authentication/course data and applied checksums are preserved. Transaction and learner-scoping guarantees are required regardless of stack. Rebuild projections from versioned evidence to validate consistency.

Validate V1-V12 from pilot-design.md, particularly idempotency under concurrent retries, atomic evidence/state updates, assistance races, changed payload conflicts, assessor failures, review supersession, schedule duplication, and cross-owner nested references/exports. Never use a universal numeric pass threshold in place of required criteria.

Curriculum and rubric review remain release gates. Tests specified here are not executed runtime tests. Runtime retention, deletion, model-provider processing, operational limits, and deployment configuration require architecture decisions before real learner data is collected. This model defines historical integrity, not indefinite personal-data retention.

## 7. Accessible multilingual extensions

TeachingProfile adds teaching_language independent of explanation preference and presentation settings. LessonVariant adds locale, translation version, glossary version and approval reference. ReferenceApproval also supports language/content review records. Submission preserves original-language text and code-switching. Assessment records input/output language and the approved rubric variant. Translation does not replace the original artifact.

LanguageAvailability identifies reviewed course/module versions per language. Unsupported content returns an explicit unavailable state and language choices, never an undisclosed fallback. Accessibility support events remain non-substantive. Structured visual alternatives expose equivalent task evidence without leaking the answer. Store no disability diagnosis to enable accessibility preferences.

## 8. Generated course-plan preview

Goal revisions are immutable owned snapshots. CoursePlan pins a goal revision, catalogue version, generation configuration, request key, lease/attempt state, validation result and timestamps. Module selections refer only to catalogue objectives with immutable reference/rubric versions. A generated plan does not publish curriculum or award evidence. PreviewEnrollment pins the accepted plan and stores diagnostic choice separately. [Concrete contract](course-generation.md).

M2 entry uses [versioned scenario placement, saved enrollment preferences and owned recommendations](course-entry-acceptance.md). Placement never creates achievement evidence. Enrollment preferences remain separate from immutable accepted plan input.

## 9. M3 reference-loop persistence

Migration 0004 stores owned attempts and immutable draft revisions, authored lesson variants, separately keyed practice requests and instructional assistance, frozen submissions, durable assessment jobs, immutable assessment runs, unique evidence, capability changes/projection, owned recommendations and optional review requests. Snapshots carry task/source/rubric/policy versions and hashes. Submission and job commit before provider access.

Attempt locking serialises draft/help/conversation/submission mutations. One active conversation call per attempt preserves order and blocks submission while pending. Help persists with the irreversible assistance flag before content is returned. Frozen snapshots retain all practice request/results and delivered help. Read foreign IDs through owned parents.

Unique learner/key constraints cover attempt creation, practice/help and submissions. One submission/job per attempt, evidence per submission and review request per submission prevent duplication. Assessment claims increment a bounded count with an unpredictable lease. Expiry permits recovery, stale results cannot commit. Assessment runs remain in history. Successful feedback, evidence, capability change/projection and recommendation commit atomically under learner locking. AI-2 evidence carries across goal enrollments with the same pinned rubric. Enrollment snapshots are rebuildable caches, reads fold all owned version-compatible evidence and adapt the recommendation to current preferences. Failure/uncertainty retains prior valid capability/evidence. Initial independent success anchors next-day recall and separate transfer availability, neither is verified retention/transfer. Migration 0005 extends shared activity modes for M4. Distinct recall and transfer evidence rebuild current review states and schedules.

English variants are immutable authored content identified by explanation level and lesson version, with pinned hash/task/rubric. Selection does not change the default or award evidence. Subject approval remains pending. M5 export and human-review supersession remain outside this slice. M4 evidence stores explicit misconception citations and frozen task/family versions. Confirmation, resolution and reopening are deterministic projections of immutable successful evidence. The capability-change rows retain before/after projections. Failed or uncertain assessments remain history without evidence. Recall activity snapshots pin their scheduled anchor and unique active independent check under the learner lock. No external background scheduler is introduced.

New evidence pins a learner-scoped commit sequence under that lock. Compatible projections sort by sequence, with timestamp/ID fallback for unchanged legacy records. Causal order therefore survives identical timestamps and controlled-clock tests. Production uses the real clock. Test/operator dependency injection labels simulated elapsed time and does not rewrite prior evidence. Recall defaults live in the versioned pilot policy (1/3/7/14/30 days, next-day failed-check delay), changing them requires a new reviewed policy version. Existing frozen records are never silently reinterpreted under a new version.

The learning response includes owned attempt summaries with the immutable task title, mode, assistance, submission state and creation time. Your work uses those titles to distinguish saved attempts. This projection adds no persistence column, capability award or export surface. Full answers and feedback still require an owned attempt read.

## Goal-first generated tutor expansion

CN-TUTOR-001 follows the user's 2026-10-14 approved product realignment. Goal-first onboarding replaces fixed-course choices for new setup, while historical enrollments remain readable. The generated engine is isolated from AI-2/CY-2 evidence and does not reinterpret old assessments. Adults select simple/beginner/standard/technical explanation, balanced/visual presentation and 10/20/40-minute sessions independently. English only, no age inference or fixed learning-style claims.

Owned path snapshots pin configuration, ordered objectives, diagnostic questions and immutable goal/preferences. Migration 0006 is additive and explicit. Row locking serialises revisions, request keys bind payloads, unpredictable leases bound generation and stale results cannot overwrite recovered requests. Public projections remove diagnostic answer keys. Placement never creates mastery evidence. Generated content remains a preview with independent reference/rubric review required before learner release.

## Generated tutor teaching persistence

TutorSession carries an owned path/module, pinned teaching preferences, immutable lesson/criteria/reference snapshots, provider fingerprint and canonical content hash. Migration 0007 adds isolated owned JSONB sessions. Draft revision locking preserves position, interactive selections, application and teach-back. Successful content is reused for the same owned module. Generation and re-explanation use bounded leases, explicit retries and recorded failures. Public lesson projections omit guided activity answer keys. Native visuals always include equivalent labels and explanations, and matching/ordering use keyboard-accessible native selects. Re-explanation records assistance without replacing the lesson or implying mastery.

## Generated tutor assessment and recovery

Generated submissions pin the complete lesson, criteria, reference snapshots, answers, help, content hash, assessor configuration and generated-practice-v1 policy before provider I/O. A unique learner/submission-key index prevents conflicting reuse. Lease/count claims, assessment histories and unique supported-practice evidence commit atomically in the owned session row. Valid literal citations are required for met judgments, and deterministic activity checks also gate supported-practice completion. Uncertain or failed output never creates successful practice evidence. Guided work never creates independent demonstration, retention or legacy capability evidence.

GET /api/tutor/paths/:id/recommendation returns the next supported learning action from saved placement and successful practice. POST /api/tutor/sessions/:id/submit saves a frozen assessment request, /assess retries the same snapshot and /save rejects changed answers after freezing. Fresh remediation creates a new owned session linked to its predecessor. POST /api/tutor/paths/:id/preferences updates explicit future teaching preferences with revision checks, without replacing accepted goals or saved lessons. Original answers, feedback, source versions and assessment histories remain inspectable through Your work.

## Interactive teaching and speech controls

CN-TUTOR-002 adds schema-version-two generated lessons with optional native number-line, infographic, flowchart, concept-map and story blocks, while saved version-one lessons retain their original content. Visual selections reveal equivalent text and never award learning evidence. Optional draft notes persist alongside existing answers, without becoming a new graded criterion. The selected alternate explanation becomes an active transcript-backed slide deck, and the original lesson remains available. Explanation requests accept an optional bounded teaching approach, bind it to their request key and reject unchanged output.

POST /api/tutor/sessions/:id/freeze acknowledges a saved frozen submission before POST /assess performs provider work. The combined /submit route remains compatible. Visible progress and specific error states distinguish saving, freezing and assessment, while retry/replay retain the same frozen snapshot. Browser synthesis reads only the selected transcript after user action. Browser recognition offers editable transcript insertion, microphone-denied/unsupported states and cleanup, without storing audio. Browser speech-service processing is disclosed before dictation.
