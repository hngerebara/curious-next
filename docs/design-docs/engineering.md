# Repository enforcement and PR workflow

## Commands and documentation freshness

Run `python3 scripts/validate_repo.py` and `python3 -m unittest discover -s tests`. No third-party dependencies are required for these checks. CI runs both on pull requests and pushes.

`docs/doc-state.json` fingerprints governed documents. After reviewing affected documentation, run `python3 scripts/validate_repo.py --refresh` and commit the resulting state. Refresh does not repair errors or certify truth. The checker requires valid links, required headings, milestone rows, registered Markdown files, matching document hashes, and dependency/taste rules.

A source change also requires a change to Documentation.md relative to the PR base. Reviewers still assess whether updates are meaningful. No linter can prove that prose is accurate. CI does not validate remote links, release translations, or execute learner flows before an application exists.

## Small PRs and minimal blocking gates

PR authoring agents open PRs when a configured remote and credentials are available and task authorization covers the work. Include the plan ID, intended behavior, checks, limitations, and debt. Fix failed CI and actionable findings in the same PR. Do not merge or alter branch protection automatically.

Require structural validation and checker tests now. Add affected domain/security/accessibility tests as code appears. Keep optional broad review asynchronous. Learner authorization, secret handling, and assessment integrity failures always block release. Noncritical improvements can become tracked follow-up debt. Repository administrators configure required checks, workflow files alone cannot enforce branch protection.

## Cleanup and changes to enforcement

At each milestone and weekly during active development, inspect stale plans, unlinked docs, unused exceptions, duplicated policy logic, excessive files, unsafe logs, weak tests, and unreviewed language variants. Create small repair PRs or tracked debt with an owner role and next review milestone. No scheduled automation is active. Every exception/change to dependency directions requires a linked decision, updated configuration and regression tests. Register new Markdown documents in docs/governance.json. Keep the active/completed plan indexes and status ledger coherent. Do not disable checks to make a PR green.

[Plan](../../Plans.md), [status](../../Documentation.md), [architecture](../../Architecture.md), [configuration](../governance.json).

## Per-slice PR workflow

After each slice, use a short-lived codex/ branch, update milestone evidence, run governance and relevant application tests, commit, push, and create or reuse the branch's PR. Inspect the complete diff for correctness, security, architecture, test gaps and spec compliance. Fix findings, rerun affected tests, and check the latest commit's CI results. Attach the PR to the chat and report validation and outstanding findings. Leave the PR open. Do not merge or enable auto-merge after any slice.

[Slice workflow](../../.github/workflows/slice-pr.yml) supports manual dispatch with branch, title and plan ID. It tests an existing branch before creating/reusing a PR and posts a validation comment. This is not a semantic AI review. GitHub settings must allow Actions to create PRs. PRs created using GITHUB_TOKEN do not trigger ordinary PR workflows, so the dispatch job runs required tests itself. Dispatch again after fixes to validate the latest head. Run this workflow from trusted reviewed code only, never from forks with elevated permissions.

[PR template](../../.github/pull_request_template.md) records the review checklist. Application tests must be added to both CI workflows as implementation proceeds. Initial publication uses an empty main commit as the base, with all substantive work in a reviewable PR.
