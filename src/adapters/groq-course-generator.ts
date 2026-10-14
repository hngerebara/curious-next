import { createHash } from "node:crypto";
import type { CourseGenerator } from "../contracts/course-plan";
import { eligibleIntent } from "../domain/course-policy";
import { intentRules, requiredObjectives } from "../domain/course-catalogue";

import { courseInstruction as prompt, courseSchema as schema } from "./course-model-contract";

export function groqCourseGenerator(key: string | undefined, model: string | undefined, transport: typeof fetch = fetch): CourseGenerator {
  const fingerprint = createHash("sha256").update(prompt + JSON.stringify(schema)).digest("hex");
  return {
    configuration: `groq:${model || "unconfigured"}:prompt-${fingerprint}`,
    async generate(input, catalogue) {
      if (!key || !model) throw new Error("GENERATOR_NOT_CONFIGURED");
      const expectedIntent = eligibleIntent(input);
      const outputSchema = expectedIntent ? { ...schema, properties: { ...schema.properties, state: { type: "string", enum: ["ready-preview"] }, subject: { type: "string", enum: [intentRules[expectedIntent].subject] }, intent: { type: "string", enum: [expectedIntent] } } } : schema;
      const intents = Object.entries(intentRules).map(([id, rule]) => ({ id, subject: rule.subject, outcome: rule.outcome, requiredObjectives: requiredObjectives(id as keyof typeof intentRules, catalogue) }));
      const response = await transport("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", signal: AbortSignal.timeout(25000), headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, max_completion_tokens: 2500, messages: [{ role: "system", content: prompt }, { role: "user", content: JSON.stringify({ learner: input, catalogue, intents, expectedIntent }) }], response_format: { type: "json_schema", json_schema: { name: "course_plan", strict: true, schema: outputSchema } } }),
      });
      if (response.status === 429) throw new Error("GENERATOR_RATE_LIMITED");
      if (!response.ok) throw new Error("GENERATOR_UNAVAILABLE");
      // Bound even unexpected provider responses before parsing or storing.
      const reader = response.body?.getReader();
      if (!reader) throw new Error("GENERATOR_INCOMPLETE");
      const chunks: Uint8Array[] = []; let length = 0;
      while (true) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 65536) { await reader.cancel(); throw new Error("GENERATOR_INCOMPLETE"); } chunks.push(value); }
      const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const raw = JSON.parse(new TextDecoder().decode(bytes));
      if (!raw || !Array.isArray(raw.choices) || raw.choices.length !== 1) throw new Error("GENERATOR_INCOMPLETE");
      const choice = raw.choices[0];
      if (choice?.message?.refusal || choice?.finish_reason === "content_filter") throw new Error("GENERATOR_REFUSED");
      if (choice?.finish_reason !== "stop" || typeof choice?.message?.content !== "string") throw new Error("GENERATOR_INCOMPLETE");
      return JSON.parse(choice.message.content);
    },
  };
}
