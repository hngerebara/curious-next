# CuriousNext domain model

## Purpose and authority

Defines learning concepts, relationships and invariants independently of storage or transport. [Pilot policy](../product-specs/pilot-design.md) defines configurable thresholds and scheduling. [Data model](data-model.md) owns record fields, transaction mechanics and persistence. [Security](security.md) owns trust boundaries.

## Core concepts

| Concept | Meaning and relationships |
|---|---|
| Goal | Learner's desired supported outcome, motivating course suggestions and examples. |
| Teaching profile | Explicit language and explanation preferences, separate from capability. |
| Course and module | Shared versioned curriculum grouping measurable objectives and activities. |
| Objective | Skill with prerequisites and required practical/conceptual criteria. |
| Placement | Provisional starting estimate from diagnostics, not demonstration evidence. |
| Pathway | Recommended route through approved activities, revised from evidence and preferences. |
| Attempt and submission | Work in progress and its immutable submitted snapshot. |
| Assistance | Delivered instructional support, distinct from allowed tools and accessibility. |
| Assessment | Criterion-based interpretation of a frozen submission with explicit uncertainty. |
| Evidence | Validated performance supporting a particular objective and criterion version. |
| Capability | Current projection of relevant evidence and review reasons. |
| Misconception | Supported wrong model requiring fresh corrective evidence for resolution. |
| Recall and transfer | Distinct evidence of retention later and application in a new context. |
| Recommendation | Deterministic next action with an inspectable reason. |

Goal leads to course enrollment. Enrollment pins curriculum versions. Activities target objectives. Attempts accumulate work and assistance. A submission freezes those facts. A validated assessment yields evidence. Evidence updates capability, misconceptions, recall/transfer availability and recommendations.

## Invariants

- Placement, preferences, lesson visits and completion clicks never create demonstration.
- Demonstration requires the objective's practical and conceptual criteria with permitted assistance conditions. A fluent explanation cannot substitute for application.
- Practice AI is a permitted tool for Practical AI assessment. Substantive learning-assistant support is recorded as assistance. Assistive technologies are not instructional help.
- Submission and historical decisions are immutable. Assessment retry reuses the same snapshot and cannot double-count evidence.
- Failed or uncertain assessment creates no new achievement. Existing valid evidence remains available.
- Curriculum, rubric and policy versions stay attached to decisions. Updates require explicit compatibility handling.
- Current capability is a projection, not a destructive replacement of historical evidence. Recall failure changes review needs, not the fact of earlier success.
- Transfer requires a defined new context. Repeating a question or waiting does not establish transfer.
- Confirmed misconceptions cite evidence. Resolution requires a fresh independent assessed correction. Unconfirmed candidates cannot block progression.
- Language and accessible representations retain the objective and assessment standard. Unsupported translation does not become learner failure.
- Recommendations choose approved achievable activities and expose causes. AI-generated prose cannot change progression rules.

## State interpretation

Capability states are Not assessed, Developing, Demonstrated and Needs review. Retention and transfer remain separately inspectable dimensions. Exact transitions belong to pilot policy, not a duplicated state table here. Assessment status (pending/succeeded/uncertain/failed) and attempt lifecycle are distinct from capability.

A learner can have a historical demonstration, current review needs and an uncertain new assessment simultaneously. UI and storage must preserve that distinction rather than collapse it into one score.

## Domain operations and validation

Domain rules classify assistance, validate criterion coverage, project capability, evaluate misconception repair and rank eligible actions. Application services orchestrate ownership, persistence and model calls. Domain code has no network or database access.

Validate invariants through V1-V12, especially placement versus mastery, assistance handling, assessment failure, correction and retention/transfer separation. Persistence-specific idempotency and authorisation checks remain defined in the data/security documents. These requirements are not executed domain tests yet.
