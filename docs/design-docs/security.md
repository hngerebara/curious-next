# CuriousNext security specification

## Status and scope

Security requirements for the two-course adult pilot. No application security controls have been implemented or verified yet. Authentication, provider configuration, data retention and deployment choices require M1 decisions. This document owns threat boundaries and verification requirements, not invented endpoints.

## Assets and trust boundaries

Protect learner goals, preferences, drafts, submissions, model conversations, feedback, evidence and exports. Protect provider keys, authenticated sessions and curriculum/rubric integrity. Treat learner text, retrieved reference material and model output as untrusted data.

Boundaries: browser to authenticated application, application to learner-scoped storage, application to model provider, assessor output to deterministic progression, and optional reviewer to permitted records. UI never calls privileged storage/provider services directly. Demo identities are isolated from real learner records.

## Threats and required controls

| Threat | Required control | Verification |
|---|---|---|
| Access to another learner's records | Server derives learner identity and checks ownership on every nested read/write/export. Opaque IDs do not replace checks. | V8 across artifacts, conversations, attempts and exports. |
| Prompt injection awarding achievement | Separate instructions from data, constrain/validate assessment output, validate criterion coverage and citations, apply progression in domain rules. | Malicious submission cannot alter rubric, access records or award unsupported evidence. |
| Script or malicious markup in text | Render inert text or sanitised allowed markup. Disable simulated links and executable output. | Script, event-handler and URL payloads cannot execute or navigate. |
| Duplicate requests or assistance races | Freeze authorised submissions, record support before delivery, use idempotency and atomic evidence updates. | V6 plus concurrent retries/help delivery and conflicting payloads. |
| Provider failure or malformed decisions | Explicit failure/uncertainty, saved inputs and bounded retries. No achievement on failed assessment. | V7 and invalid/missing criterion evidence. |
| Session theft or forged mutations | Use the selected auth provider's supported secure session handling. For cookie sessions, use secure/HttpOnly cookies and appropriate SameSite/CSRF protections. | Authentication expiry, logout, unauthenticated writes and cross-site mutation tests. |
| Secret or private-data leakage | Server-side keys, restricted logs and exports. No full learner text in logs. Minimise model payloads and disclose external processing. | Client bundle/log inspection and outbound-payload tests. |
| Resource abuse | Server-enforced input limits, generation/assessment budgets, rate limits, timeouts and bounded retry policy. Values chosen in M1. | Oversized input and repeat calls fail safely without losing drafts. |
| Unauthorised review or curriculum change | Separate reviewer/publisher roles, least privilege, provenance and immutable published versions. | Role tests deny unrelated records and policy edits by learners. |

## Privacy and operational requirements

Do not collect disability diagnoses to enable accessibility. Cybersecurity simulations never request real credentials. Preserve original-language submissions and restrict any translation/model copies to the same authorised purpose. Select provider processing, retention, deletion/export and backup policies before collecting real learner data. Historical learning integrity does not justify indefinite retention.

M1 records session lifetime, reviewer permissions, payload limits, rate budgets, provider retention settings, deletion behavior and backup access. Deployment must use encrypted transport, managed secrets, isolated environments and tested backup/recovery. Those operational settings belong to the later deployment specification.

GitHub workflows use minimum permissions. PR validation has read-only repository access. Manual PR creation grants pull-request write only where needed. Do not run untrusted fork code with write tokens or learner/provider secrets. PRs remain unmerged unless separately authorised.

## Release validation

Run ownership and role tests, injection/unsafe-rendering cases, retry/assistance races, session/CSRF checks applicable to the selected stack, secret/log inspection and provider failure tests. Confirm deletion and recovery behavior before real learner release. Record actual results in [Documentation.md](../../Documentation.md), never label this specification an audit.

[Architecture](../../Architecture.md), [domain](domain-model.md), [persistence](data-model.md), [user flows](../product-specs/user-flows.md).
