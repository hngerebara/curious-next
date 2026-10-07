# CuriousNext

CuriousNext helps adult beginners choose a useful learning pathway and demonstrate what they understand. The pilot covers Practical AI and Cybersecurity Essentials through explanatory text, purposeful visuals, supported practice, independent tasks and teach-back.

## Current state

This repository contains product, curriculum, design and engineering specifications with documentation validation tooling. There is no working learner application, database, authentication service or deployment yet. Curriculum and language review remain pending. See [milestone status](Documentation.md) for actual evidence.

## Start here

- [Product requirements](Prompt.md), [roadmap](Plans.md) and [implementation entry](Implement.md).
- [Architecture](Architecture.md), [domain model](docs/design-docs/domain-model.md) and [security](docs/design-docs/security.md).
- [Learner journeys](docs/product-specs/user-flows.md), [curriculum](docs/curriculum/index.md), [design system](docs/DESIGN.md) and [screen behavior](docs/FRONTEND.md).
- [Repository map](AGENTS.md), [document ownership](docs/design-docs/document-ownership.md), [plans](docs/exec-plans/index.md) and [decisions](docs/design-docs/decisions/index.md).

## Run repository checks

Use Python 3.12, matching CI. The current checks require only its standard library.

```sh
python3 scripts/validate_repo.py
python3 -m unittest discover -s tests -v
```

After reviewing documentation changes, run `python3 scripts/validate_repo.py --refresh` and commit the updated fingerprints. See [engineering workflow](docs/design-docs/engineering.md). Each slice is tested, reviewed and proposed through a PR. PRs are left open without merging or auto-merge.

## Product boundaries

Accessibility is required from the first screen. Teaching-language release targets are English, Nigerian Pidgin, Igbo, Yoruba and Hausa, subject to reviewed content and assessment parity. Neither those languages nor accessibility conformance are implemented claims. Uploaded files, unrestricted course generation, voice and offline synchronisation are deferred.

## Application setup and deployment

M1 must select and document the stack, authentication, storage and model provider. Actual API and deployment specifications follow those decisions before frontend/backend integration and hosted learner use. No installation, environment secrets, demo credentials or running URL are available yet.
