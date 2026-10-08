# Document ownership

## Authoritative homes

| Topic | Owner |
|---|---|
| Goals, requirements, deliverables | [Prompt.md](../../Prompt.md) |
| Milestone roadmap and acceptance mapping | [Plans.md](../../Plans.md) |
| Agent execution instructions | [Implement.md](../../Implement.md) |
| Implementation status and validation evidence | [Documentation.md](../../Documentation.md) |
| Dependency rules and operational architecture | [Architecture.md](../../Architecture.md) |
| Enduring product/engineering principles | [Core beliefs](core-beliefs.md) |
| Commands, PR workflow, cleanup cadence | [Engineering](engineering.md) |
| Learner flow and shared adaptation behavior | [Pilot design](../product-specs/pilot-design.md) |
| Learning objectives, lessons and rubrics | [Curriculum](../curriculum/index.md) |
| End-to-end learner journeys | [User flows](../product-specs/user-flows.md) |
| Security threats and controls | [Security](security.md) |
| Learning concepts and invariants | [Domain model](domain-model.md) |
| Project entry and setup | [README](../../README.md) |
| Screen behavior and interaction states | [Frontend](../FRONTEND.md) |
| Visual appearance and components | [Design](../DESIGN.md) |
| Concrete HTTP interfaces | [API specification](api-spec.md) |
| Authentication spike validation and captures | [Authentication review](authentication-review.md) |
| Environments and operational release | [Deployment](deployment.md) |
| Persistence and logical interfaces | [Data model](data-model.md) |
| Source provenance and approvals | [Reference register](../references/curriculum-sources.md) |
| Active work details and completed-plan history | [Execution plans](../exec-plans/index.md) |
| Deferred work and consequential decisions | [Debt](../exec-plans/tech-debt-tracker.md), [decisions](decisions/index.md) |

## Maintenance

Link to the owner rather than duplicating detailed rules. Supporting documents may explain implications but must not define conflicting policy. Roadmaps describe completion conditions, the status ledger records actual completion. Plan folders indicate lifecycle without duplicating milestone status tables.

Generated artifacts are added only after an authoritative source and reproducible generator exist. There is no schema artifact before migrations exist. Design and frontend documentation remain lightweight, with design owning presentation intent and frontend owning implementation behavior.
