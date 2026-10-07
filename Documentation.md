# CuriousNext milestone status

## Status

| ID | Status | Evidence |
|---|---|---|
| M0 | completed | Governance documents, local checker and regression tests. Validation commands recorded below. |
| M1 | pending | No stack selected, reference and rubric review pending. |
| M2 | pending | No application screens or learner journeys implemented. |
| M3 | pending | Logical contracts only, no runtime persistence or model integration. |
| M4 | pending | Misconception/recall/transfer specifications only. |
| M5 | pending | Draft syllabuses and reference modules, no working export. |
| M6 | pending | Accessibility and five-language requirements specified, no usability or translation review completed. |

## Validation evidence

M0: `python3 scripts/validate_repo.py` and `python3 -m unittest discover -s tests`. Executed on 2026-10-07: repository validation passed and all 8 governance regression tests passed. Documentation integrity does not prove runtime acceptance. Future milestones link test output or reproducible evidence in their status rows.

## Limitations and next work

Origin is configured as https://github.com/hngerebara/curious-next.git. Remote inspection returned no refs on 2026-10-07. Initial publication is in progress, with governance and planning changes proposed through an unmerged PR. A manual slice PR workflow is supplied. No recurring agent is active. [Implement.md](Implement.md) describes the requested future model configuration, not current execution. Reference review, technology decisions, and data retention are M1 prerequisites.

[Plan](Plans.md), [active plan](docs/exec-plans/active/pilot.md), [tech debt](docs/exec-plans/tech-debt-tracker.md), [decision log](docs/design-docs/decisions/index.md).

## Repository organisation

2026-10-07: aligned docs/ with design-docs, exec-plans, generated, product-specs, and references. Existing document content preserved, links relocated. Added explicit frontend/design/product guidance and schema-generation status. Root filenames retain the previously agreed casing and roles.

## Documentation simplification

2026-10-07: separated course syllabuses and reference modules into docs/curriculum, centralised source review in docs/references, removed the ungenerated schema placeholder, and assigned authoritative document roles. Product contract and execution instructions are separated. Repository governance validation passed, including link and required-section checks. All 9 checker regression tests passed. No runtime acceptance claims are made.

## Slice PR publication

2026-10-07: added per-slice test, review, fix, and PR instructions, a PR template, and a manual test-before-PR GitHub workflow. No merging is authorised. Local tests and remote CI results will be reported with the PR.

## Design specification slice

2026-10-07: expanded docs/DESIGN.md with focused workspace layout concepts, proposed CuriousNext tokens, screen/component guidance and accessible multilingual presentation. The supplied Curious Tech Girl skill package was subsequently read and its visual example inspected. Brand paper/ink/lime/lavender tokens replace the provisional provisional palette. App adaptations remain explicit, with no copied portraits or artwork. No rendered UI validation is claimed. Repository checks and regression tests are required for this slice.

## Foundation specification slice

2026-10-07: added README, end-to-end user flows, domain concepts/invariants and security requirements. Extended frontend screen behavior and cross-linked authoritative ownership. Concrete API and deployment specifications remain M1 deliverables pending stack decisions. No application controls or learner flows are claimed as tested.

## PR quality workflow

2026-10-07: adopted five-section PR descriptions, 50-character title limit, and content/readability/faithfulness review criteria. Added metadata validation and tests. Existing PR descriptions updated to the same structure. No merge is authorised.
