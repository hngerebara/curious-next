# CuriousNext implementation prompt

## Requested execution configuration

Use GPT-6.1-Sol (`gpt-6.1-sol`) with X-High (`xhigh`) reasoning, as selected by the user on 2026-10-08, when the execution host offers that model and setting. This file records the requested configuration, it does not change the current chat model. If unavailable, report the mismatch and obtain a model choice before that configured run. Do not silently claim the requested model ran.

## Implementation instructions

Read [Plans.md](Plans.md) first, then [Prompt.md](Prompt.md), [Architecture.md](Architecture.md), [Documentation.md](Documentation.md), [pilot design](docs/product-specs/pilot-design.md), and [data model](docs/design-docs/data-model.md). Implement the next incomplete milestone with its linked active plan. Inspect existing code first. Record necessary decisions before changing architectural boundaries.

Follow dependency directions and golden principles. Preserve evidence history and assistance distinctions. Implement accessibility from the first screen. Never ship unreviewed curriculum or advertise unsupported languages. Update Documentation.md with honest status and validation evidence after each milestone.

Run the repository checks and relevant behavior tests. Open a small PR when a remote and authenticated tooling are available, using the workflow in [engineering](docs/design-docs/engineering.md). Fix check failures and actionable review findings. No remote means report that limitation without inventing a PR. Never auto-merge, grant permissions, or post unrelated communications.

## Repository inspection and implementation sequence

Inspect repository instructions, architecture, migrations, tests, and any rebuild guide before code changes. Verify existing functionality rather than assuming conversation descriptions are implemented. Reuse the existing stack when practical. Record the M1 stack decision if no application exists. Preserve useful data and avoid unrelated rewrites.

Follow milestone order in Plans.md. Complete reference slices before expansion, using [curriculum](docs/curriculum/index.md). Read [document ownership](docs/design-docs/document-ownership.md) before changing specs. Deliver reproducible validation evidence and honest remaining limitations. Never claim acceptance checks passed from documentation alone.

## Slice completion requirement

After every implementation slice, follow the per-slice workflow in engineering.md: passing checks, a complete diff review, fixes, then a created or updated PR with validation evidence. Leave every slice PR open. Never merge or enable auto-merge. Check remote CI for the latest commit before declaring it green.

Every milestone progress/final report names what completes that milestone, what passed and what remains. Never equate merged code or synthetic tests with real-service or accessibility acceptance.
