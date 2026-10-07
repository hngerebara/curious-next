# CuriousNext milestone status

## Status

| ID | Status | Evidence |
|---|---|---|
| M0 | completed | Governance documents, local checker and regression tests. Validation commands recorded below. |
| M1 | in_progress | Next.js, Neon, Drizzle, Better Auth, Resend and Vercel accepted. [Stack decision](docs/design-docs/decisions/002-neon-pilot-stack.md), API and deployment drafts prepared. Integration tests, operational choices, reference and rubric review pending. |
| M1.5 | in_progress | Stitch desktop/mobile mockups and [design handoff](docs/design-docs/screen-handoff.md). Locally corrected static previews prepared. User review pending. Runtime accessibility remains untested. |
| M2 | pending | No application screens or learner journeys implemented. |
| M3 | pending | Logical contracts only, no runtime persistence or model integration. |
| M4 | pending | Misconception/recall/transfer specifications only. |
| M5 | pending | Draft syllabuses and reference modules, no working export. |
| M6 | pending | Accessibility and five-language requirements specified, no usability or translation review completed. |

## Validation evidence

M0: `python3 scripts/validate_repo.py` and `python3 -m unittest discover -s tests`. Executed on 2026-10-07: repository validation passed and all 8 governance regression tests passed. Documentation integrity does not prove runtime acceptance. Future milestones link test output or reproducible evidence in their status rows.

## Limitations and next work

The initial remote inspection returned no refs on 2026-10-07. Subsequent planning slices have been published through PRs. Current design and foundation work remains proposed through unmerged PRs. A manual slice PR workflow is supplied. No recurring agent is active. [Implement.md](Implement.md) describes the requested future model configuration, not current execution. Reference review, technology decisions, and data retention are M1 prerequisites.

[Plan](Plans.md), [active plan](docs/exec-plans/active/pilot.md), [tech debt](docs/exec-plans/tech-debt-tracker.md), [decision log](docs/design-docs/decisions/index.md).

## Repository organisation

2026-10-07: aligned docs/ with design-docs, exec-plans, generated, product-specs, and references. Existing document content preserved, links relocated. Added explicit frontend/design/product guidance and schema-generation status. Root filenames retain the previously agreed casing and roles.

## Documentation simplification

2026-10-07: separated course syllabuses and reference modules into docs/curriculum, centralised source review in docs/references, removed the ungenerated schema placeholder, and assigned authoritative document roles. Product contract and execution instructions are separated. Repository governance validation passed, including link and required-section checks. All 9 checker regression tests passed. No runtime acceptance claims are made.

## Slice PR publication

2026-10-07: added per-slice test, review, fix, and PR instructions, a PR template, and a manual test-before-PR GitHub workflow. No merging is authorised. Local tests and remote CI results will be reported with the PR.

## Design specification slice

2026-10-07: expanded docs/DESIGN.md with focused workspace layout concepts, proposed CuriousNext tokens, screen/component guidance and accessible multilingual presentation. The supplied Curious Tech Girl skill package was subsequently read and its visual example inspected. Brand paper/ink/lime/lavender tokens replace the provisional palette. App adaptations remain explicit, with no copied portraits or artwork. No rendered UI validation is claimed. Repository checks and regression tests are required for this slice.

## Foundation specification slice

2026-10-07: added README, end-to-end user flows, domain concepts/invariants and security requirements. Extended frontend screen behavior and cross-linked authoritative ownership. Concrete API and deployment specifications remain M1 deliverables pending stack decisions. No application controls or learner flows are claimed as tested.

## PR quality workflow

2026-10-07: adopted five-section PR descriptions, 50-character title limit, and content/readability/faithfulness review criteria. Added metadata validation and tests. Existing PR descriptions updated to the same structure. No merge is authorised.

## Screen design milestone

2026-10-07: added M1.5 between architecture and screen implementation. Desktop/mobile flows, detailed reference-task screens, alternate/error states, accessible representations and design review are required before M2. Subsequently created the [CuriousNext Stitch project](https://stitch.withgoogle.com/projects/18036214979648223266) and 27 selected desktop/mobile artifacts, linked from the [handoff](docs/design-docs/screen-handoff.md). THE-11 tracks this slice. Content review identified generated policy drift. Batch Stitch edits did not change the exports, so repository HTML was corrected and previews rendered locally, with source hashes retained. User approval, complete alternate-state coverage, font/language review and rendered accessibility testing remain pending. This is early design preparation while M1 remains pending, not M2 implementation.

## Linear integration preparation

2026-10-07: added the real-ticket-per-PR workflow. Linear connection verified. THE-5 through THE-9 link existing PRs #1-#5, and THE-10 tracks the integration. Ticket URLs are linked both ways. CI validates the workspace/team URL in Related tickets, while agents verify real issue existence. No Linear credentials are added to repository or CI.

## Screen artifact validation

2026-10-07: all 27 HTML checksums and JPEG signatures verified. Corrected mobile CY-2 independent task checked at 320px: no horizontal overflow, no selected answers, and three empty response fields. This establishes that static layout only. Repository validation and all 16 regression tests passed.

## Public entry and typography revision

2026-10-07: user requested public homepage and login designs, and email magic links as the only sign-up/login method. Product, frontend, user-flow and security requirements updated. Reference typography inspected: Fredoka 600 for large headlines, Inter for supporting headings and text. Existing static previews rerendered using that pairing. Authentication provider, delivery, token expiry and resend cooldown remain M1 decisions. No email is sent by these designs.

2026-10-08: added four selected public-homepage and magic-link access designs, bringing the handoff to 31 screens. Auth forms start with one blank email field and no password controls. Fredoka loaded in all four new previews. Mobile homepage and auth checked at 320px without horizontal overflow. All 31 static artifact checks, repository checks and 16 regression tests passed. Added artifact integrity and email-only form checks to CI. These do not validate a live authentication service.

## Neon foundation preparation

2026-10-08: THE-12 tracks CN-FOUNDATION-001. Neon is the selected database. Added a proposed Next.js/Drizzle/Better Auth/Resend/Vercel stack, draft authentication/course-entry API and deployment runbook. No services provisioned or runtime tests executed. Provider acceptance, budget, retention, authentication spike and curriculum review remain open. Entry review found and corrected an inert mobile homepage login control in the local static artifact. Required repository, checker and artifact commands provide reproducible validation for this slice.

Validation: mobile homepage header login navigated to the blank magic-link form at 320px. Updated homepage captures at 320px and 1440px showed no horizontal overflow. Course lists now match syllabus modules. Footer legal links and auth state controls remain static placeholders, not implemented behavior.

2026-10-08: user confirmed the complete proposed application stack. ADR-002 is accepted and planning references updated. This does not approve spending, select regions/retention, validate authentication or complete M1. Next work is the authentication integration proof of concept and framework bridge enforcement. Repository validation and all 16 checker tests passed for this documentation update.
