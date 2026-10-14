# CuriousNext recorded demo

## Three-minute story

Use a fictional local account. Hide browser URLs, developer inbox, account identifiers and technical history. The [captured-screen walkthrough](demo-walkthrough.mp4) is a 164-second narrated replay of verified screenshots. It is labelled “Captured-screen walkthrough”, uses the installed Daniel voice as a temporary preview, and does not claim continuous live recording. The user has requested their own voice, replacement awaits their audio recording. [Scene narration](demo-scenes.json) is the recording guide. Render on macOS with `swift scripts/render-captured-walkthrough.swift docs/design-artifacts/clear-learning` from the repository root, using Swift, AVFoundation and Daniel. The renderer refuses to overwrite an existing movie. Browser URLs, developer inbox, account identifiers and technical history are excluded. A development indicator remains visible on some captured screens. The older attempt shows the current recommendation after correction, and narration explains that saved-work replay.

0:00–0:20, homepage: “Tell CuriousNext what you want to learn. Practise a small task. Get feedback. Know what to try next.” Show the learning loop and two course options.

0:20–0:45, setup: choose “Learn to spot scam messages and verify suspicious requests safely.” Show goal, explanation preference, a focused path and the optional starting questions. State that placement suggests a start, it does not prove ability.

0:45–1:15, Today and task: open a fictional message activity. Show the task brief beside the workspace. Make safe action choices but explain the mistaken belief that a familiar logo proves authenticity. Submit for feedback once.

1:15–1:45, feedback: show what went well, the explicit branding error and the recommended next activity. Open a criterion disclosure briefly. Explain that feedback cites the submitted reasoning, it does not infer a misconception from silence.

1:45–2:20, fresh correction: open a different fictional task. Explain independent verification, reporting when suspicion persists and why familiar branding is not proof. Show the saved correction and updated recommendation. Use a prepared saved attempt if provider latency exceeds the recording window, label that jump as previously recorded work.

2:20–2:40, continuity: open Your work, restore the original attempt and show that the original reasoning remains. Show Your path and the separate independent, remembering-later and new-context states. Content in preparation stays labelled.

2:40–3:00, close: “This English preview checks what you do and explain, then suggests a useful next step. Reviewed curriculum, calibration, screen-reader acceptance and hosted deployment still need work.”

## Hackathon submission points

Uniqueness: the approach separates practice, independent work, later recall and transfer. Explicit mistaken reasoning is preserved and corrected through fresh work. This is a concrete design choice, not a claim that no other product does it.

Scalability: deterministic progression and owned persistence sit behind provider ports. English is the implemented preview. Nigerian Pidgin, Igbo, Yoruba and Hausa require reviewed content and language acceptance. Do not claim multi-country deployment, proven capacity or measured learner impact.

Codex usage: ticket-linked implementation plan, repository boundary checks, adapter and durable-submission tests, rendered desktop/mobile inspection, paced fictional provider studies and a substantive implementing-agent review. Link the final PR and evidence. Self-review is not independent approval.

Presentation: lead with the learner’s goal and one visible loop. Keep engineering details for the closing slide or README. Use the rendered captures in this folder, with no fabricated usage, testimonials or outcomes.
