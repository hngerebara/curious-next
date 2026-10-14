# CuriousNext implementation plan

## Milestones

| ID | Milestone | Completion and validation |
|---|---|---|
| M0 | Repository governance | Document links, freshness, architecture and taste checks pass, structural checker tests pass. |
| M1 | Architecture and source review | Record stack/auth/storage/provider decisions, define the concrete API and deployment specifications, approve reference mappings and calibrate both reference rubrics. No learner release before approval. |
| M1.5 | Screen design | Complete desktop/mobile wireframes and detailed reference-flow designs, including loading/error/assistance/language states. Review against user flows, design tokens and accessibility requirements. See the screen-design plan. |
| M2 | Accessible course entry | Goal/preferences, validated goal-based course generation, enrollment, optional diagnostic and skip. Validate V1/V2 and the entry portion of V9, real-service persistence, keyboard and actual screen-reader journeys. [Completion gates](docs/design-docs/course-entry-acceptance.md). |
| M3 | Durable attempt loop | Practice AI, separate assistant, frozen submission, validated assessment, evidence and recommendation transaction. Validate V3/V6/V7/V8/V12. |
| M4 | Adaptive cybersecurity and retention | CY-2 simulation, misconceptions, fresh correction, recall and transfer. Validate V4/V5 and reviewed alternative answers. |
| M5 | Course completion and export | Remaining module content, final tasks, readable evidence export. Validate V11 and both complete learner journeys. |
| M6 | Accessible multilingual release | WCAG audit, blind/low-vision usability, reviewed language variants and assessment parity. Validate V10 plus language availability/fallback, code-switching and same rubric across languages. |

## Execution and validation

Work in milestone order: M1 → M1.5 → M2 onward. M2 screen implementation requires the M1.5 design handoff. M1 records accepted implementation choices before code. [Foundation preparation](docs/exec-plans/active/foundation.md) contains the accepted Neon stack and draft API/deployment specifications. M6 language work can prepare earlier, but accessibility is required from M2 onward. English release and each additional language have separate review gates. Do not wait until M6 to fix access barriers.

Screen design deliverables and review criteria live in [CN-DESIGN-001](docs/exec-plans/active/screen-design.md). Design review is not proof of implemented accessibility.

Each change links to a plan ID. Use [active plans](docs/exec-plans/active/pilot.md), move finished plans to completed, and track deferred work in [tech debt](docs/exec-plans/tech-debt-tracker.md). Record consequential choices in [decisions](docs/design-docs/decisions/index.md). Actual milestone status and evidence live only in [Documentation.md](Documentation.md).

Run `python3 scripts/validate_repo.py` and `python3 -m unittest discover -s tests` on every PR. Later add behavioral tests and rendered inspection for the affected V1-V12 scenarios from [pilot design](docs/product-specs/pilot-design.md). Automated structure checks do not prove curricular quality or accessibility conformance.

## Delivery

Small, short-lived PRs include plan ID, behavior changed, evidence, risks, and status/debt updates. Required gates are repository validation and relevant behavioral/security tests once code exists. Optional review does not excuse failed safety checks. Do not weaken a test to merge. Follow [engineering workflow](docs/design-docs/engineering.md).

The user authorised the bounded M2 course-plan preview on 2026-10-09 while M1/M1.5 acceptance remains open. This exception permits preview implementation, not learner release. [CN-COURSE-001](docs/exec-plans/active/course-generation.md).

Per [ADR-004](docs/design-docs/decisions/004-local-email-preview.md), the user defers actual inbox delivery until deployment. Local M2 uses captured test mail with real Better Auth and Neon persistence/isolation, plus actual screen-reader validation. This does not establish ownership of real email addresses.

On 2026-10-09 the user explicitly authorised M3 preview implementation while M2's actual screen-reader walkthrough remains pending. This sequencing exception does not complete M2 or approve learner release. [CN-ATTEMPT-001](docs/exec-plans/completed/attempt-loop.md) starts with the AI-2 reference loop and includes lesson-variant V9 alongside M3 scenarios.

On 2026-10-13 the user authorised M4 preview implementation while M2 actual screen-reader acceptance remains open. This sequencing exception permits fictional implementation/validation, not learner release. [CN-ADAPT-001](docs/exec-plans/active/adaptive-loop.md).

On 2026-10-14 the user authorised [CN-CLARITY-001](docs/exec-plans/active/clear-learning.md), a brand-preserving experience redesign and server-only OpenAI migration. The homepage direction was approved before extending it across learner screens. This slice prepares a recorded hackathon demonstration within 48 hours, without completing M5/M6 or approving release. Historical Groq acceptance remains historical. Fresh OpenAI acceptance is required.

## Goal-first tutor expansion

[CN-TUTOR-001](docs/exec-plans/active/goal-first-tutor.md) supersedes fixed-course entry under explicit user authorisation. Three stacked, reviewed slices cover foundation, visual teaching and adaptive feedback. Each receives a verified ticket and open PR. Completion requires fictional multi-topic journeys, persistence/recovery, inspected desktop/mobile rendering and latest-head checks. M4 scoring disagreements, independent curriculum/provider review, actual screen-reader acceptance, M5/M6 and deployment remain separate gates.
