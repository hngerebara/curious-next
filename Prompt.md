# CuriousNext product contract

This document defines CuriousNext goals, requirements, acceptance criteria, and deliverables. Implementation instructions live in [Implement.md](Implement.md).

## 1. Product and positioning

Project name: **CuriousNext**, associated with **The Curious Tech Girl**. Keep branding configurable, using CuriousNext as the agreed name.

Challenge track: **Guidance, Pathways & Opportunity**.

Learners can access educational content yet still struggle to decide where to start, what to practise, what to do next, and whether they can apply their knowledge independently. CuriousNext guides learners toward a concrete goal using evidence of ability.

Product promise: **Know what to do next, why it matters, and demonstrate that you can do it.**

Core principle: **Progress depends on demonstrated ability, not content consumption.**

Core loop:

Goal → initial capability estimate → next useful action → learn/practise/explain/build/prove/recall → evidence → update capabilities → adapt the pathway.

Maintain two separate models:

- **Capability model:** what the learner can demonstrate; influences the next action and necessary support.
- **Teaching profile:** how the learner currently prefers explanations; influences presentation and scaffolding.

Preferences are adjustable choices, not fixed learning-style labels or proof that a presentation format improves learning.

## 2. Preservation requirements

Preserve useful existing functionality and learner data when extending the project. Demo data must remain distinct from real learner evidence. New implementation must satisfy this contract without unrelated rewrites.

## 3. Strict pilot scope

Audience: adult beginners. Support two introductory subject areas, with general discovery courses and goal-specific generated course plans:

- **Practical AI:** use AI for a small work or study task, verify its output, and explain decisions.
- **Cybersecurity Essentials:** recognise common digital threats, choose protective actions, and explain reasoning in simulations.

Each subject catalogue contains five modules defined in [curriculum](docs/curriculum/index.md). Use versioned subject objective catalogues to generate goal-specific course plans with personalised pathways and explanations. Course plans select relevant objectives and prerequisite closure, rather than always presenting five modules. Do not generate unrestricted syllabuses or new assessment standards. Personalisation changes context and support, not objectives or assessment standards.

The pilot must provide complete learning loops for writing clear prompts and recognising phishing, with the remaining modules following the same requirements. Practical AI uses an integrated text-based practice environment with one configured model. Cybersecurity uses fictional messages and simulated settings. Never request real passwords or recovery codes.

Exclude children's accounts, guardian onboarding, job marketplaces, unrestricted course generation, uploads, voice interactions, video production, separate weekly-review dashboards, extensive analytics, offline synchronisation, and large-scale crawling. Do not include spreadsheet or website-development courses in this pilot.

Deliverables include maintained product/curriculum specifications and a validated working pilot. Content and rubrics require reference-based review before learner release.

## 4. Goal-first onboarding

Ask what the learner wants to be able to do, rather than which course they want to consume. Clarify vague goals into a measurable supported destination. For goals beyond the pilot, explain the boundary and offer the supported goal rather than inventing a complete pathway.

After goal and explanation preference capture, generate one goal-specific course proposal within Practical AI or Cybersecurity, explaining fit and prerequisites. Vague or mixed goals receive one clarification. Unsupported goals receive supported alternatives. Let the learner choose. Offer an optional course-specific diagnostic or Start from the beginning. Never require a diagnostic to unlock learning. Capture relevant background, self-reported experience, available study time, and an explanation preference. Allow updates later. Avoid a lengthy entrance exam.

Offer clear explanation choices:

- Very simple: everyday language, concrete examples, terminology introduced gently.
- Beginner-friendly: explain terms as they appear.
- Standard: balanced explanation and technical detail.
- Technical: concise, precise terminology with deeper detail available.

Simple explanations must remain accurate and respectful. Never infantilize an adult or infer ability from age.

## 5. Short diagnostic and capability map

Offer four to six course-specific diagnostic questions, self-assessment and existing in-app work when available. Refine the model through subsequent activity. Ask only enough to choose a useful starting action.

Keep diagnostic placement separate from demonstrated mastery. A placement result must not fabricate completed lessons, mastered skills or independent evidence.

Present capabilities with understandable states such as **Not assessed**, **Developing**, **Demonstrated**, and **Needs review**. Record confidence and evidence provenance separately from the displayed state.

Each competency needs prerequisites, a measurable objective and explicit assessment criteria. Show the reason for a state and the supporting evidence. Watching a lesson, clicking Complete, selecting a teaching preference or passing a single recall question must not establish practical competency.

The main progress view is a capability map toward the goal. Course-completion percentages are secondary, if retained.

## 6. Primary experience: What should I do now?

The home screen centers on one recommended next action, with at most two useful alternatives. Each recommendation includes:

- Action type and concrete task.
- Estimated time, labeled as an estimate.
- Relevant competency and goal milestone.
- A concise explanation grounded in the learner's recorded evidence.
- A clear Start action.

Support **Learn**, **Practise**, **Recall**, **Explain**, **Fix**, **Build**, and **Prove**. These may reuse shared workflows; do not build seven disconnected subsystems.

Let learners choose a time budget, for example 10, 20 or 40 minutes, and request another option. Select an achievable part of the work; never pretend a long independent project can be completed in ten minutes.

Implement transparent recommendation rules before adding opaque AI decisions. Prioritize blocking prerequisites and misconceptions, weak or insufficient evidence, relevant project gaps, due recall and then advancement. Do not let review consume every session or recommend already completed work without an evidence-based reason. Resolve ties deterministically and expose enough context to explain the choice.

Persist outcomes, update the capability model, and recompute the next action. A static generated plan is insufficient.

## 7. Learning and support

Use an approved curriculum and reference set with a prerequisite graph, measurable objectives, worked examples, practice tasks and assessment rubrics. AI generation must stay within those objectives and references. Do not build an unrestricted internet-content aggregator.

Gradually remove support:

See a worked example → complete a guided task → try with optional hints → solve a new scenario independently → adapt to changed requirements → apply the skill in a project.

Record assistance used. Supported practice is useful evidence of development, but cannot masquerade as independent proof.

Provide **Explain differently** inside learning activities:

- Make it simpler.
- Give me an analogy.
- Show me an example.
- Show me visually when an accurate visual is available.
- Go deeper.
- Give me the technical explanation.

Change wording, examples, pacing and scaffolding while preserving the objective and final assessment standard. Use technically accurate analogies and explain their limits when relevant.

Persist an explicit default preference and allow per-concept overrides. Repeated requests may trigger a suggestion to change the default, which the learner can accept or dismiss. Do not silently infer mastery or claim improved understanding from clicks alone.

Provide **I'm stuck** within tasks. Use the current task, competency, attempt, misconceptions and relevant prior evidence to offer a hint, diagnostic question or short refresher. During an independent proof task, offering substantive help must change the attempt's assistance status or move it into practice; do not reveal a full solution and still count the result as independent mastery.

## 8. Teach-back and assessment

Use teach-back to assess conceptual understanding, including accuracy, completeness, reasoning and application where appropriate.

Examples: **Explain why your revised prompt better matches the brief**, and **Explain why you would verify this message through another channel**.

Map feedback to specific criteria and misconceptions. Translate weak reasoning or application into targeted next actions. A numerical score without actionable feedback is insufficient.

Conceptual explanation alone must not establish implementation ability. Combine it with actual work on relevant tasks.

Use explicit rubrics and deterministic validation where appropriate. AI assessment must return structured, validated results grounded in the submission and rubric, with uncertainty exposed. Treat learner submissions and retrieved material as untrusted input, not instructions to the assessor. Never award mastery when assessment fails or is unavailable. Human review is optional. It does not block learning or practice. Ambiguous or failed assessments remain pending or unavailable, with no new demonstration awarded.

Define mastery rules per competency before implementing state changes, including required evidence, assistance constraints and retention checks. Keep the policy configurable and versioned; do not invent a universal passing score and call it scientifically validated.

## 9. Recall integrated into guidance

Schedule short retrieval activities after evidence of learning and use performance to adjust future review. Feed due recall into next-action recommendations instead of requiring learners to remember a separate Recall page.

Use configurable pilot intervals of 1, 3, 7, 14 and 30 days. Schedule from actual learning evidence, not page visits. Treat these as operational defaults, not an optimal forgetting prediction. Keep delayed recall distinct from transfer to a new context.

A weak recall result should produce review or uncertainty, not erase all historical evidence. Preserve the distinction between demonstrated performance at a point in time and confidence in current retention.

## 10. Projects and the opportunity bridge

Use the Practical AI final workflow briefs and a Cybersecurity incident simulation. Clearly label all fictional briefs as simulations.

Map project criteria to competencies. Store the submitted artifact, rubric results, assistance level, review status and assessment date. Allow learners to revisit evidence and produce an exportable evidence summary or portfolio entry.

Connect demonstrated skills to practical next steps: portfolio challenges, client simulations, community-style practice and subsequent milestones. Clearly distinguish learning activities from actual paid work or verified openings. Do not claim that an AI-reviewed artifact is an accredited certificate or employer-verified qualification.

The MVP opportunity bridge is **portable work evidence and credible guidance about its uses**, not a job-placement promise.

## 11. Mobile and data-conscious design

Make the pilot usable on mobile, with readable text, accessible controls and small achievable sessions. Use text and lightweight interaction by default; do not require high-definition video. Keep text interaction and simulations usable on mobile. Label any activity that genuinely requires a computer rather than assuming all tasks have the same device requirements.

Where resources are recommended, show verified cost, login and format requirements when known. Do not claim No login required or Free without checking.

Offline session downloads and progress synchronization are a later enhancement unless already available. Do not advertise offline support until it works, including sync and assessment boundaries. Cache or preserve draft work where feasible and handle connectivity interruptions gracefully.

These choices address practical constraints; do not claim Africa-specific demand or measured impact without research.

## 12. Data and implementation requirements

Use the repository's conventions. Ensure durable persistence for goals, teaching preferences, competencies and prerequisites, activities, attempts, assistance events, assessments, evidence, capability summaries, recommendations, recall schedules and project submissions.

Maintain traceability: each capability change must point to evidence and the policy or rubric used. Keep historical attempts rather than overwriting them with a summary score. Handle retries and duplicate submissions without double-counting evidence.

Use email magic links as the only sign-up and login method, with learner-scoped authorization. Create accounts only after email verification. Do not offer passwords, social login or numeric code entry. Keep API keys server-side. Validate AI outputs and user input. Handle loading, empty, failed assessment and interrupted-network states. Use fixtures only in explicitly labeled demo mode; do not present seeded activity as a real learner's achievement.

Render learner and AI text safely. Never execute generated scripts, activate simulated phishing links, or treat submissions as assessor instructions.

Keep recommendation logic separable from presentation generation so the AI cannot arbitrarily award mastery or rewrite progression policies.

## 13. Demonstration

Provide clearly labelled demo learners pursuing the same Practical AI destination:

- **Amaka:** evidence shows vague prompts that omit constraints. Recommend targeted prompt practice.
- **David:** demonstrates clear prompting but has insufficient verification evidence. Recommend a source-checking task.

Also demonstrate the Cybersecurity reference module from diagnostic skip through independent assessment, misconception correction, and transfer. Submit real new demo attempts and recompute recommendations. Show explanation changes without changing the rubric. Demo data must never appear as real learner achievement.

## 14. Acceptance criteria

1. An adult learner sets a goal and explanation preference, receives justified course suggestions, chooses a course, and selects a 10-, 20-, or 40-minute session.
2. An optional diagnostic affects placement without awarding mastery. Skipping it starts at the beginning without blocking access.
3. Capability states are linked to inspectable evidence and explicit criteria.
4. Two learners with different evidence receive different justified actions for the same goal.
5. A new assessed attempt persists, changes the appropriate capability summary and updates the recommendation.
6. Assisted practice and independent proof remain distinguishable.
7. Explain differently changes presentation without changing the objective or assessment standard; default-preference changes remain under learner control.
8. I'm stuck provides contextual help and records assistance appropriately.
9. Due recall can appear in the guidance flow and its outcome influences review.
10. A project produces rubric-linked evidence and an exportable summary with honest assessment labels.
11. Core flows work on mobile, with visible device requirements for tasks that need a computer.
12. Assessment failures never award mastery, repeated submissions do not duplicate evidence, and one learner cannot access another learner's private work.
13. Pilot limitations, simulations, AI assessment labels, and demo data are clear.
14. Misconceptions cite specific attempts and require fresh corrective evidence before resolution.
15. Delayed recall, transfer, and initial demonstration remain separate in progress and exports.
16. Practice-AI use is expected in AI tasks and is stored separately from learning-assistant help.
17. Saved lesson variants preserve continuity and cannot alter the syllabus or rubric.

Verify meaningful domain rules with appropriate automated tests: placement versus mastery, prerequisites, evidence updates, assistance handling, recall timing, recommendation changes, duplicate submissions and authorization. Run an end-to-end pilot flow and inspect the rendered experience. Do not create tests that merely repeat implementation details.

## 15. Deliverables

Deliver a working pilot, setup and environment-variable documentation without secrets, labelled demo access, validation evidence, implemented scope, and honest limitations. Preserve data safely as the application evolves. Do not claim proven learning gains, job readiness, proprietary defensibility, or competitive uniqueness without evidence.

Milestone order lives in [Plans.md](Plans.md), execution instructions in [Implement.md](Implement.md), and actual implementation evidence in [Documentation.md](Documentation.md).

## 16. Misconceptions, transfer, and evidence reporting

Record misconceptions only from supported evidence. Store the specific wrong model, source attempt, objective, rubric and policy versions, review status, and corrective evidence. Ambiguous candidates remain unconfirmed and cannot block progression. Confirmed blocking misconceptions trigger targeted practice. Resolution requires a new assessed attempt meeting explicit correction criteria.

Show Not assessed, Developing, Demonstrated, and Needs review with inspectable provenance. Track initial demonstration, delayed retention, and transfer separately. Do not collapse them into a single mastery percentage. Export readable summaries with criteria, dates, assistance, artifacts, and limitations.

Store the practice AI separately from the learning assistant. Use of the practice AI is part of Practical AI assessment. Substantive learning-assistant help makes an attempt assisted. Keep generation, assessment, and deterministic progression policies separate.

The contract defines requirements. [Pilot design](docs/product-specs/pilot-design.md) defines curriculum and behavior. [Data model](docs/design-docs/data-model.md) defines persistence and interfaces. Neither planning document proves implementation or learning effectiveness.

## 17. Accessibility and teaching languages

Target WCAG 2.2 AA. All essential visual information must have an equivalent structured text representation. Support screen readers, keyboard-only navigation, zoom/reflow, visible focus, accessible authentication, and status announcements. Do not announce every streamed token. Assessment alternatives expose equivalent evidence without revealing answers. Accessibility tools and presentation adjustments do not count as substantive assistance. Validate complete journeys with blind and low-vision participants before claiming accessibility conformance.

Separate teaching language, explanation level, and presentation preferences. Plan English, Nigerian Pidgin, Igbo, Yoruba, and Hausa. Localise lessons, instructions, hints, and feedback using reviewed terminology. Accept teach-back and natural code-switching without unrelated grammar penalties. Language variants preserve objective and rubric versions. Release languages only after fluent-speaker and assessment review. Availability is explicit, no silent English substitution. Read-aloud is optional and deferred until provider/pronunciation validation. Screen-reader access is required independently of app narration.

## 18. Supporting specifications

Follow [Plans.md](Plans.md) for milestones, [Architecture.md](Architecture.md) for dependency principles, and [Documentation.md](Documentation.md) for status. [Implement.md](Implement.md) is the implementation entry prompt. Deeper product truth remains in docs/. Run repository validation before submitting a short-lived PR. Never mark milestones complete without evidence.

M2 entry uses [versioned scenario placement, saved enrollment preferences and owned recommendations](docs/design-docs/course-entry-acceptance.md). Placement never creates achievement evidence. Enrollment preferences remain separate from immutable accepted plan input.
