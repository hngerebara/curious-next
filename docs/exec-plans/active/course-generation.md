# CN-COURSE-001: Goal-based course generation

## Plan lifecycle

Active M2 preview, explicitly authorised before remaining M1/M1.5 release gates. [THE-16](https://linear.app/the-curious-tech-girl/issue/THE-16/generate-validated-goal-based-demo-course-plans). Status lives in [Documentation.md](../../../Documentation.md).

## Deliverables

[Generation contract](../../design-docs/course-generation.md): bounded Groq interpretation, pure curriculum validation, owned Neon persistence, idempotent generation/enrollment and accessible onboarding/placement preview. Preserve draft curricula, standards and historical evidence. General homepage discovery remains separate.

## Validation and remaining gates

Run application, governance, ownership/concurrency/provider-boundary tests and rendered mobile/keyboard inspection. Review complete diff, fix findings, publish linked unmerged PR and verify latest-head CI. Live model configuration/access, goal-to-plan evaluation, curriculum approval and screen-reader/participant usability remain separate gates.
