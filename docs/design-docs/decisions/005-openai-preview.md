# ADR-005: OpenAI preview provider

## Decision

Accepted user instruction, 2026-10-14. Replace active Groq course generation, practice and assessment with server-side OpenAI Responses API adapters. Existing application ports, deterministic policy, authentication and persistence remain the boundary. Default model gpt-6.1-sol with low reasoning, strict JSON schema for generation/assessment and no model tools. Responses use store false. Keys stay in private environment configuration.

## Compatibility and validation

The user supersedes the earlier keep-Groq restriction. Do not rewrite prior configuration fingerprints, frozen submissions or assessments. New calls use OpenAI fingerprints covering model, role, instruction, schema, reasoning and output budget. Pending historical jobs retain their configuration mismatch protection and require fresh work under the new provider. No migration or automatic regrading is introduced. Refusal, incomplete/oversized responses, malformed JSON, unavailable configuration and rate limits remain explicit failures with no new demonstration. Keep existing bounded claim/retry and idempotency guarantees.

Fresh fictional provider studies and durable browser recovery are required, earlier Groq results do not prove OpenAI acceptance. Availability/limits depend on the user's API project. No fallback model, credential creation or billing change occurs automatically.

## References

[Official model guidance](https://developers.openai.com/api/docs/guides/latest-model), [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Fetched 2026-10-14. Independent curriculum/calibration, actual screen-reader and hosted-worker/deployment gates stay separate.
