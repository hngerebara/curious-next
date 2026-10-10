# Tech debt register

## Open

| ID | Work | Owner | Review |
|---|---|---|---|
| D1 | Replace narrow import checker with AST analysis before supporting aliases or multiline imports. | Implementation agent | M1 |
| D2 | Configure required CI checks after publication. Origin is connected. | Repository owner | M1 |
| D3 | Scoped primary-source mappings and draft v2 fixtures prepared. Obtain subject approval, independent fixture labels and configured-assessor calibration. [Review pack](../curriculum/rubric-calibration.md). | Curriculum reviewer | M1 |
| D4 | Choose retention policy and provider data handling. | Product/engineering owner | M1 |
| D5 | Review Nigerian Pidgin, Igbo, Yoruba, Hausa and language-specific assessment behavior. | Language reviewers | M6 |
| D6 | Neon local persistence/isolation validated in CN-LOCAL-AUTH-001. Validate real email delivery before deployment, forwarding-header trust, token-free host logs, authentication cleanup/retention, migration tracking/restore and assistive-technology entry. Remove/replace the synthetic ownership probe before learner release. [Evidence](../design-docs/authentication-review.md). | Engineering/security owner | M1, before learner release |

| D7 | Deploy an authenticated durable assessment worker, validate lease recovery under hosted execution, and set operational processing/retention budgets. Preview jobs are durable but processed explicitly on return/retry. | Engineering owner | Before deployment |

## Resolved

None. Do not remove resolved entries, record outcome and decision/evidence links.

[Plans](index.md), [status](../../Documentation.md).
