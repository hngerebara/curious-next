# Reference module: AI-2, Write clear prompts

Draft lesson/task v2, rubric AI-2 v2, objective AI-2. [Original v1](reference-module-v1.md) is preserved. Changed tasks require a new attempt version, never regrade old work against v2.

## Lesson text

A prompt is the instruction you give an AI system. A useful prompt explains the task and supplies the information needed to attempt it. Detail is useful when it changes the result. A longer prompt is not automatically better.

Start with what you need produced. Add relevant facts, who the result is for, and any limits it must follow. Describe a format when the format matters. If information is missing, tell the system to identify the gap rather than invent it. These instructions improve direction, but do not guarantee compliance or accuracy. Read and check the response.

Suppose a fictional cafe needs answers to common customer questions. “Write something for our cafe” leaves the task unclear. A more useful instruction is: “Using only the facts below, write four customer FAQ entries. Use plain language. Each answer must be under 35 words. Do not invent missing information. Flag any question the facts cannot answer.” Then supply the facts.

The task is four FAQ entries. The context is the cafe information. The constraints limit answer length and invented facts. The format is question-and-answer pairs. You still check the response against the facts and requirements.

Beginner-friendly variant: “Tell the AI what you need, give it the useful facts, and explain the limits. Then check what it gives back.” Standard and Technical variants add terminology and precision without changing the objective or criteria.

## Visual specification

An annotated prompt card highlights Task, Context, Constraints, and Format with labels and distinct borders. Never rely on colour alone. Below it, a small sequence reads Brief → Prompt → Response → Check. Stack cards vertically at narrow widths. Supply equivalent text and no image-only lesson content.

## Guided practice

Source facts: fictional River Cafe opens Monday to Saturday, 08:00 to 17:00, serves vegetarian lunch, and accepts walk-ins. No delivery or booking policy is supplied.

Ask learners to improve “Write about River Cafe.” Learning-assistant hints progress from “What should the response produce?” to “Which facts and limits matter?” A worked solution is available in practice and recorded as substantive assistance. Learners run their prompt with the practice AI and inspect the output.

## Independent assessment

New source pack: fictional Northstar Study Club meets Tuesdays at 18:00 online, welcomes adult beginners, runs 45-minute sessions, and charges no fee. Recording policy is unspecified.

Brief: create exactly three FAQ entries for prospective members, covering meeting time/location, duration/fee, and whether sessions are recorded. Each answer must have fewer than 30 words. Use only the supplied information. The recording answer must state that the source does not provide the policy. Submit the prompt, complete practice-AI interaction history and final response, a requirement checklist, and an explanation. Freeze the task/source/rubric versions and conversation snapshot at submission. A source pack attached by the task counts as context when the prompt explicitly tells the model to use it.

Teach-back: “Explain how your prompt communicates the task, relevant facts, limits, and format. Name one thing you still need to check in the response.” Responses need not follow a prescribed writing style.

## Rubric AI-2 v2

| Criterion | Met evidence | If unmet |
|---|---|---|
| A1 Task | Requests three FAQ entries for prospective members covering the three required topics. | Target task and audience practice. |
| A2 Context | Includes or explicitly references the task's source pack. | Source-context practice. |
| A3 Constraints | Specifies fewer than 30 words per answer, source-only information and acknowledgement of missing recording policy. | Constraint-writing practice. |
| A4 Format | Requests question-and-answer pairs, without requiring a particular markup style. | Output-format practice. |
| A5 Inspection | Checklist accurately checks count, answer length, source fidelity and recording uncertainty against the actual response. | Compare response with brief. |
| A6 Reasoning | Connects instructions to requirements and explains why response verification is still needed. | Teach-back refresher with a new question. |

All six criteria must be met in an unassisted attempt for initial demonstration. A model's noncompliance does not automatically fail the learner if the prompt meets criteria and the learner accurately detects and explains it. Malformed or uncertain assessments award nothing. The assessor cites exact prompt or explanation excerpts. Length/count checks are deterministic aids, not standalone grading of judgment.

Practice-AI use and output revisions are expected task work, not learning-assistant assistance. Retain revision history. A substantive hint or worked answer from the learning assistant marks the attempt assisted. Screen readers, zoom, equivalent structured text and approved language presentation do not. This module does not require AI-3's two-gap revision standard.

For this English fixture task, count whitespace-separated answer tokens after trimming, excluding the question and presentation labels. A hyphenated token counts once. Exactly 30 fails the answer-length check. Other languages need reviewed counting rules before release. Count check failure informs Inspection, it does not override an accurate learner diagnosis. Missing submission evidence is unmet, ambiguous interpretation is uncertain, assessor failure is unavailable. Do not infer a misconception solely from an omitted constraint.

Feedback example, Developing: “Your prompt sets three FAQ entries and the right format. It leaves out the source-only rule. Your response added a recording policy that the brief does not provide. Next: practise source constraints, then try a new brief.”

Feedback example, Demonstrated: “Your prompt includes the required facts, limits, and format. You correctly flagged the invented recording policy. Next: practise revising an output against the brief.”

Misconception candidate: “A detailed prompt guarantees a correct answer.” Confirm only when the learner explicitly expresses it or multiple attempt excerpts support it. Correction criterion: explain why verification remains necessary and identify an actual unsupported claim in a fresh example.

Delayed check: next-day short task reconstructing a prompt from a new brief, with no prior prompt shown. Transfer: a source-based study guide, using the same criteria with scenario-specific task and format requirements.


## Review status

Agent source review completed for the scoped mappings on 2026-10-08. Subject-expert approval, configured-assessor calibration and language parity remain pending. [Calibration pack](../rubric-calibration.md), [syllabus](syllabus.md), [source register](../../references/curriculum-sources.md), [pilot rules](../../product-specs/pilot-design.md). No learner publication is approved.
