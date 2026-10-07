# CN-DESIGN-001: Screen design

## Plan lifecycle

Active work plan for M1.5, after M1 and before M2. Actual milestone status lives in [Documentation.md](../../../Documentation.md). [Roadmap](../../../Plans.md).

## Deliverables

- Flow-linked wireframes for onboarding, course suggestions, optional diagnostic/skip, next action, course overview, lesson, practice, independent task/teach-back, feedback, and evidence/export.
- Detailed desktop and mobile mockups for both reference journeys: clear prompts and recognising phishing. Show all other core screens through reusable patterns.
- Loading, empty, interrupted-network, unsaved/conflicting draft, assisted attempt, pending/uncertain/failed assessment, optional review and unavailable-language states.
- Component and token application, content hierarchy, responsive behavior, focus order, text alternatives and long-language-label treatment.
- A handoff mapping each designed screen to user-flow IDs, screen behavior, assets/components and acceptance criteria. Link versioned design artifacts from the status ledger.

## Review and validation

Review against [user flows](../../product-specs/user-flows.md), [design system](../../DESIGN.md), [frontend behavior](../../FRONTEND.md) and both [reference modules](../../curriculum/index.md). Inspect desktop and narrow/mobile layouts, zoom/reflow intent, contrast, diacritics, keyboard paths and equivalent nonvisual assessment information. Do not bake answers into assessment annotations.

Record review findings, resolve blocking design decisions and present reviewable mockups to the user before M2 implementation. These artifacts must specify interaction states, not only static happy paths. Do not require a particular proprietary design tool. Repository-accessible exports and handoff links are required.

Design review does not establish runtime screen-reader support or WCAG conformance. M2 onward validates rendered accessibility and behavior, with participant evaluation before release. Move this plan to completed only when artifacts and review outcomes have recorded evidence.
