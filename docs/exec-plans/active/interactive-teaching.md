# CN-TUTOR-002: Interactive teaching and spoken learning

## Scope

The user requested this slice on 2026-10-14 after merging the generated tutor. [THE-26](https://linear.app/the-curious-tech-girl/issue/THE-26/repair-interactive-teaching-and-spoken-learning) tracks inactive-looking visuals, invisible fetch progress, ineffective alternate explanations and unclear submission outcomes. Preserve unrelated files and historical lesson/assessment snapshots, using a new branch from merged main.

## Delivery

Use keyboard-operable labelled visuals and an actual numeric number line when its values support that representation. Add optional native infographic, story, flowchart and concept-map blocks, without generated code. Teaching becomes a slide deck with transcript, direct slide navigation, optional mental-sketch notes and user-triggered browser read-aloud. Explanation depth and teaching approach are separate requests, and the resulting saved explanation becomes the visible deck without replacing original tasks or criteria. Repeated unchanged model output fails validation.

Submission acknowledges a durable frozen snapshot before assessment starts, displaying status and explicit retry/error states. The existing combined submission endpoint remains compatible. Dictation is opt-in browser speech recognition with visible listening state, reviewed transcript insertion, stop/cleanup and typed fallback. No microphone starts automatically, no audio is persisted, and browser-provider processing is disclosed. Voice answers remain editable text assessed against the same criteria.

## Verification and boundaries

Test freeze-before-provider acknowledgement, idempotent recovery, alternate-method binding, unchanged explanation rejection, optional notes and legacy drafts. Inspect actual desktop, 320px, keyboard controls, loading indicators and feedback handoff. Run bounded fictional configured-provider checks, preserve failed outputs and stop on rate limits. Validate build, application/Python tests, governance, privacy, dependencies and semantic review before publishing an attached ticket-linked PR with passing latest-head CI. Leave it open.

[MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) documents browser synthesis and recognition, including platform-service and local recognition differences. Browser/device support and microphone permissions vary. Actual voice transcription requires a performed microphone check and must not be inferred from feature detection, mocked events or typed answers. Independent curriculum/provider review, screen-reader acceptance, M4 disagreements, M5/M6 and deployment remain separate gates.
