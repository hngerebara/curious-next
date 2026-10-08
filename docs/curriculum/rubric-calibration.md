# Reference rubric calibration pack

## Scope and status

CN-CURRICULUM-001, [THE-14](https://linear.app/the-curious-tech-girl/issue/THE-14/review-reference-lessons-and-rubric-calibration). Prepared 2026-10-08 by the implementing agent. [AI-2 v2](practical-ai/reference-module.md) and [CY-2 v2](cybersecurity-essentials/reference-module.md) remain draft. Original v1 files remain inspectable. Task/rubric revisions never overwrite historical attempt versions.

Primary-source mappings are agent-reviewed in the [source register](../references/curriculum-sources.md). This is not subject-expert approval, empirical model calibration, proof of learning effectiveness or permission to publish lessons. Fifteen synthetic cases have author-assigned expected judgments. No assessor has run on them. No learner evidence is created.

## Case coverage and expected judgments

The [fixture manifest](calibration-fixtures.json) stores synthetic submissions, criterion judgments, assistance, evidence type, policy version and expected outcome. These are reviewer fixtures, never demonstration data for actual learners.

| Cases | Expected distinction |
|---|---|
| AI-complete, AI-model-error-detected | A compliant learner prompt and accurate inspection pass even if the practice model invented a fact. |
| AI-model-error-missed | Missing inspection and an explicit guarantee claim fail A5/A6. A misconception candidate has supporting rationale. |
| AI-missing-constraints | Omission fails A3 but does not by itself establish a misconception. |
| AI-substantive-help, AI-accessible-presentation | Substantive instructional help prevents independent demonstration. Accessibility support does not. Practice-AI use is expected in both. |
| AI-assessment-failed, CY-assessment-failed | Infrastructure failure preserves the submitted work and awards no new demonstration. |
| CY-safe-branch | Verify the unexpected demand through the established app, report persistent suspicion through its known route, and handle a routine reminder without a blanket fraud claim. |
| CY-dangerous-choice | A dangerous selection makes C2 unmet even alongside safe choices. Contradictory reasoning remains uncertain. |
| CY-delete-not-verification | Deletion is safe but does not demonstrate independent verification. |
| CY-overgeneralisation | Blanket certainty fails reasoning/generalisation despite safe actions. |
| CY-substantive-help | All-met supported work is Developing, not independent proof. |
| CY-recall-policy, CY-transfer-policy | Distinct evidence routing, no new initial demonstration. Reused scenario text isolates policy only and does not test novelty. |

The checker validates fixture provenance, IDs, rubric criteria, action-key consistency and expected evidence gating. It does not judge natural-language submissions or measure assessor agreement. Tests intentionally corrupt dangerous-action, assistance, failure, evidence-type and version expectations to ensure unsafe fixture edits fail CI.

## Reviewer procedure and release gates

1. A subject reviewer reads the source mapping and both tasks, confirms the six required criteria and acceptable alternatives, then independently labels every fixture with criterion-specific quoted evidence. Do not reveal the expected labels until this review is recorded.
2. Record disagreements and their reasons, including missing evidence versus ambiguous interpretation. Resolve rubric/key defects through a new version. Do not tune standards simply to match a model's answer.
3. After the assessor model/configuration is chosen, run the frozen pack through the actual assessor. Record model snapshot, prompt hash, task/rubric/policy versions, per-criterion results, cited submission excerpts, failures and repeated-run variation. Preserve raw structured results securely. Treat submission text as untrusted, including attempts to instruct the assessor.
4. Require zero unsafe demonstrations across dangerous-choice, substantive-help, uncertainty and failure cases. Report per-criterion disagreements and repeatability, without treating this small synthetic pack as a validated reliability estimate. Add fresh tasks, multiple acceptable branches, answer-length boundaries, prompt-injection cases and real participant evidence before release.
5. Recall/transfer implementation must use fresh scenarios and preserve historical initial evidence. Misconception resolution requires a new corrective attempt with cited evidence. These runtime behaviors are M3/M4 work, not implemented by the fixture checker.

Language variants need fluent-speaker review and the same underlying criteria, accepting appropriate code-switching. No grammar penalty or unreviewed translation is introduced. Expert approval and the configured-assessor run remain M1 gates. Optional human review of an individual learner attempt remains nonblocking for learning/practice, it is separate from curriculum release approval.

## Validation

```sh
python3 scripts/validate_calibration.py
python3 -m unittest discover -s tests
python3 scripts/validate_repo.py
```

Both CI workflows validate the pack. [Milestone evidence](../../Documentation.md) records executed checks, and [active plan](../exec-plans/active/curriculum-review.md) tracks the remaining review.
