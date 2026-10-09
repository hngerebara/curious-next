# Reference module: CY-2, Recognise phishing

Draft lesson/task v2, rubric CY-2 v2, objective CY-2. [Original v1](reference-module-v1.md) is preserved. Changed tasks require a new attempt version, never regrade old work against v2.

## Lesson text

A phishing message tries to persuade you to disclose information or take an unsafe action by pretending to be trustworthy. Messages sometimes use urgency, authority, familiar branding, or attractive offers. Those cues deserve scrutiny, but one cue alone does not prove a message is fraudulent.

Inspect what the message asks you to do and whether it matches the situation. A display name or logo is easy to imitate. A secure connection symbol does not prove that the sender or site is legitimate. Poor spelling is not required for phishing, and a well-written message is not proof of authenticity.

If a message unexpectedly asks you to sign in, pay, or provide sensitive information, pause. Verify through a route you already trust, such as opening the official app yourself. Do not use the suspicious message's link or contact details as your verification route. Use the relevant service or organisation's reporting mechanism when appropriate.

You do not need certainty before choosing a safer verification route. Explain what the evidence supports and what remains unknown.

## Visual specification

A simulated message card labels the display name, sender address, requested action, urgency, and displayed destination. A decision flow reads Unexpected sensitive request? → Pause → Verify through a trusted independent route → Decide/report. Present the destination as inert plain text. Add keyboard-accessible inspection buttons and a full text equivalent. No external navigation occurs.

## Guided practice

Fictional ParcelPoint message: “Your parcel will be returned in 30 minutes. Pay a small redelivery fee at parcelpoint-pay.example.” The learner has not placed an order. Contrast it with a neutral delivery update that requests no sensitive action. Ask for evidence and a safe next action. Hints prompt inspection of the requested action and independent verification. Do not teach that every delivery message or urgent message is fraudulent.

## Independent assessment

Fictional StudyHub message uses a familiar logo and sender display name, asks the learner to sign in immediately to prevent account closure, and shows studyhub-check.example. A second message is a routine study reminder with no sign-in request. The evidence does not conclusively authenticate either message.

Scenario context: the learner has an existing StudyHub account, expected a study reminder, and already uses its official app. Its app has a Help → Report suspicious message route. The closure/sign-in demand is unexpected. Neither supplied message is conclusively authenticated. The report path and pre-established app are fictional task facts, not real service instructions.

For each message, choose one or more actions: open the official app independently (verify), use the message's sign-in link (use-link), send a password in reply (send-password), report through the known service channel (report-known), delete without verification (delete), or take no sensitive action and continue the planned study session (continue-routine). Submit decisions and a rationale for each, including what remains unknown and when/where you would report. Delete is safe but does not show Verification by itself. Continue-routine is acceptable for the expected reminder, without asserting that the sender is proven genuine. It is insufficient for the unexpected closure demand.

Teach-back: “What makes the first message suspicious? What does its logo establish? How would you verify it without trusting the message itself?”

## Rubric CY-2 v2

| Criterion | Met evidence | If unmet |
|---|---|---|
| C1 Evidence | Identifies the unexpected sign-in demand plus urgency, closure threat or scenario mismatch. An unfamiliar domain alone is not conclusive proof. | Inspect requested action and context. |
| C2 Safe action | Avoids use-link and send-password for both messages. | Safe-response practice. |
| C3 Verification | Chooses verify for the closure message, or describes another pre-established trusted route that the scenario supports. | Independent-channel practice. |
| C4 Reporting | Names the known in-app reporting route for persistent suspicion. Does not require reporting every routine reminder or prescribe a country-specific reporting number. | Reporting refresher. |
| C5 Reasoning | Explains why branding does not authenticate the sender and why suspicion is not proof. | Appearance-versus-evidence practice. |
| C6 Generalisation | Treats the reminder according to its lower-risk context without claiming certainty or judging solely by appearance. | Compare contrasting scenarios. |

All six criteria must be met independently for initial demonstration. Reviewed keys validate selected actions. The LLM assesses reasoning with cited excerpts. A dangerous selected action fails Safe action regardless of fluent reasoning. Conflicting results are uncertain and award no demonstration until reassessed or optionally reviewed.

Draft key CY-2-key-v2: use-link and send-password force C2 unmet even when combined with verify/report-known. Closure choices {verify, report-known} and reminder choices {continue-routine} are one complete safe branch, not the only acceptable response. Deletion or additional independent checking of the reminder is acceptable with appropriate reasoning. Conflicting choice/rationale makes the affected reasoning criterion uncertain, it never rescues a dangerous action. No real link opens and no password is entered. The .example suffix labels a simulation, it is not a scored phishing cue.

The key is agent-reviewed, subject-expert approval remains pending. Grammatical polish and answer length are not grading criteria. Accessibility tools and equivalent text alternatives are not substantive assistance. A learning-assistant hint or copied worked explanation makes the attempt assisted. All-met delayed recall and transfer remain distinct evidence, not a replacement initial demonstration.

Feedback example: “You noticed the urgent sign-in request, but chose its link because the logo looked familiar. A logo does not verify who sent the message. Next: compare appearance with independent verification, then evaluate a new message.”

Misconception: “A familiar logo proves the sender is authentic.” Confirm from explicit rationale. Correction requires a fresh independent message decision and explanation that rejects this inference. Repeating the supplied correction alone does not resolve it.

Delayed check: a new account message after the configured interval. Transfer: a fictional job-recruitment message requesting personal information. Same objective and comparable rubric, with an answer key adapted to that context.


## Review status

Agent source review completed for the scoped mappings on 2026-10-08. Subject-expert approval, configured-assessor calibration and language parity remain pending. [Calibration pack](../rubric-calibration.md), [syllabus](syllabus.md), [source register](../../references/curriculum-sources.md), [pilot rules](../../product-specs/pilot-design.md). No learner publication is approved.
