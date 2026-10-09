# Recovery and transition screen contract

## Scope and preview

CN-DESIGN-001 / M1.5, 2026-10-09. [THE-11](https://linear.app/the-curious-tech-girl/issue/THE-11/design-curiousnext-pilot-screens-in-stitch). [Interactive preview](../design-artifacts/recovery/index.html), [state copy](../design-artifacts/recovery/states.json). Repository-native design artifacts supplement the 31 selected Stitch exports. No application feature, durable save, authentication, assessment or review submission is implemented here. All transitions are explicitly illustrative.

Fredoka 600 titles, Inter body, paper/ink/lime/lavender tokens, wrapping controls and a responsive single-panel reading layout. Fonts resolve from installed licensed dependencies when inspecting locally. The preview contains no real learner data and calls no API. Its email button deliberately previews the next state without sending or validating email.

## Transition and acceptance matrix

| States / flow | Trigger and primary recovery | Production contract |
|---|---|---|
| Session expiry → email → check-email → task, UF7 | Reauthenticate by magic link, then resume. | Keep confirmed draft server-side. Do not expose private text while signed out. Validate same-origin return route and ownership after verification. Unsaved sensitive text needs reviewed retention handling. Preview success never establishes a real session. |
| Unsupported goal, UF1 | Offer the two supported goals or edit. | Retain original goal. Do not enroll, invent a course or change preferences silently. |
| Empty suggestions, UF1 | Retry a failed fetch or edit goal. | Distinguish no supported match from request failure. Reuse request identity and confirmed input. |
| No fitting session, UF5 | Short refresher, larger time budget or keep plan. | One primary action plus two alternatives. Refresher never substitutes for independent demonstration or lowers standards. |
| Help confirmation → assisted, UF3 | Explicitly accept instructional help or remain independent. | Record assistance before delivering substantive help. Accessibility support and permitted practice AI remain separate. Fresh independent task required for demonstration. Cancelling does not mark assisted. |
| Unsaved navigation, UF2 | Stay, retry saving or explicitly discard unsaved edits. | Failed save preserves edits. Only server acknowledgement establishes saved state. Keep last confirmed draft on discard. |
| Draft conflict, UF2 | Inspect newest saved draft, retain local revision or return. | Preserve both authorised revisions, show timestamps and offer comparison. No blind overwrite or automatic merge. |
| Review confirmation → request recorded, UF3 | Explain shared evidence, request review or continue without it. | Original submission stays immutable, duplicate requests reuse identity. Request creates no new demonstration and never blocks learning. |
| Diagnostic response → placement, UF1 | Optional reviewed questions, explicit skip, result reason and override. | Four to six course-specific questions. Save answers and preserve them on back. Illustrative answer field starts blank. Preview placement is fixed sample copy, not assessment of typed text. Diagnostic skip starts module one, neither route awards achievement. |
| Unavailable language, UF7 | Explicit temporary language choice or return. | Preserve default and draft. Show actual released-language availability. Do not silently translate or infer ability. All non-English release gates remain pending. |
| Restored task, UF2 | Return to work after successful authorised recovery. | Retrieve the verified learner's confirmed draft. Preview task is generic and contains no stored artifact. |

## Focus, announcements and data

State changes initiated by the user move focus to the heading. Selector and action buttons use native labelled controls and visible focus. Save failures use one polite status announcement and retain the current state. Equivalent text describes every state, no icon-only instructions or answer-revealing diagnostic placeholders. Response text stays in its blank field during preview navigation, but closing/reloading the preview loses it. No local-storage persistence is implied.

These panels specify full-page recovery. Production unsaved-navigation confirmation can use a modal with focus containment, Escape cancellation and focus restoration. A browser-close warning is only a supplementary protection, never the sole save/recovery mechanism. Session expiry and review are application-owned, the browser does not decide authority or capability.

## Validation and remaining review

Rendered viewport, action and focus checks are recorded in Documentation.md. Representative assistance captures are linked from the preview inventory below. These checks do not establish screen-reader usability or WCAG conformance. User review, complete prior-screen audit, reviewed language/glyph samples, runtime data integration and blind/low-vision participant evaluation remain pending. M1.5 remains in progress.

- [320px assistance](../design-artifacts/recovery/assistance-320.png)
- [390px assistance](../design-artifacts/recovery/assistance-390.png)
- [1280px assistance](../design-artifacts/recovery/assistance-1280.png)

[Handoff](screen-handoff.md), [frontend](../FRONTEND.md), [flows](../product-specs/user-flows.md), [active plan](../exec-plans/active/screen-design.md).
