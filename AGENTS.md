# CuriousNext repository map

Read [Prompt.md](Prompt.md), [Plans.md](Plans.md), [Architecture.md](Architecture.md), and [Documentation.md](Documentation.md) before changes.

- Execution entry: [Implement.md](Implement.md)
- Curriculum and behavior: [pilot design](docs/product-specs/pilot-design.md)
- Persistence: [data model](docs/design-docs/data-model.md)
- Working rules: [golden principles](docs/design-docs/core-beliefs.md)
- Enforcement and PR workflow: [engineering](docs/design-docs/engineering.md)
- Plan index: [plans](docs/exec-plans/index.md)
- Decision index: [decisions](docs/design-docs/decisions/index.md)

Run `python3 scripts/validate_repo.py` and `python3 -m unittest discover -s tests`. Update milestone evidence and documentation fingerprints with affected changes. Keep deeper instructions in docs/.

- Structured indexes: [design docs](docs/design-docs/index.md), [product specs](docs/product-specs/index.md), [references](docs/references/index.md)
- Curriculum: [courses](docs/curriculum/index.md)
- Document ownership: [authoritative homes](docs/design-docs/document-ownership.md)

After each slice: test, review and fix, create/update and attach a PR. Leave it open. Never merge or enable auto-merge. See engineering.md for the full workflow.
