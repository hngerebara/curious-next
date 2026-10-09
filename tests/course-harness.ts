import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import * as authSchema from "../src/adapters/auth-schema";
import { courseStore } from "../src/adapters/course-store";
import { repositories } from "../src/adapters/access-repositories";
import { courseService } from "../src/application/course-service";
import { courseHttp } from "../src/application/course-http";
import { courseCatalogue, intentRules, requiredObjectives } from "../src/domain/course-catalogue";
import type { GoalInput, Intent, CourseGenerator } from "../src/contracts/course-plan";

export const courseOrigin = "https://curiousnext.test";
export const input: GoalInput = { goalText: "Use AI to write customer emails", explanationLevel: "beginner", teachingLanguage: "en", sessionMinutes: 20 };
export function output(intent: Intent, goalEvidence: string) {
  return { state: "ready-preview", subject: intentRules[intent].subject, intent, title: intent === "study-notes" ? "Organise your study notes with AI" : "A course for your chosen goal", reason: `Your goal mentions ${goalEvidence}. These objectives give you a supported starting point.`, goalEvidence, context: `Fictional practice related to ${goalEvidence}, using only supplied sources.`, question: null, modules: requiredObjectives(intent, courseCatalogue).map((objectiveId) => ({ objectiveId, introduction: `Apply this objective to fictional ${goalEvidence} examples without changing its criteria.` })) };
}
export function request(path: string, method = "GET", body?: unknown, key = "synthetic-request-key-001", owner = "learner-a", origin = courseOrigin) {
  return new Request(courseOrigin + path, { method, headers: { origin, "content-type": "application/json", "idempotency-key": key, "x-test-owner": owner }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
export async function courseHarness(generate: CourseGenerator["generate"] = async () => output("customer-emails", "customer emails")) {
  const sql = new PGlite();
  for (const migration of ["0001-access.sql", "0002-course-plans.sql", "0003-enrollment-preferences.sql"]) await sql.exec(await readFile(new URL(`../migrations/${migration}`, import.meta.url), "utf8"));
  const db = drizzle(sql, { schema: authSchema });
  for (const id of ["learner-a", "learner-b"]) await db.insert(authSchema.user).values({ id, name: "Synthetic learner", email: `${id}@example.test`, emailVerified: true, createdAt: new Date(), updatedAt: new Date() });
  const store = courseStore(db);
  const { abuse } = repositories(db, "synthetic-course-limit-key");
  const calls: GoalInput[] = [];
  const generator: CourseGenerator = { configuration: "synthetic-generator-v1", async generate(input, catalogue) { calls.push(input); return generate(input, catalogue); } };
  const events: string[] = [];
  const service = courseService(store, generator, abuse, { emit(event, outcome) { events.push(`${event}:${outcome}`); } });
  const handler = courseHttp({ async session(headers) { const id = headers.get("x-test-owner"); return id && ["learner-a", "learner-b"].includes(id) ? { id, email: `${id}@example.test` } : null; } }, store, service, courseOrigin);
  return { db, sql, store, service, handler, calls, events, close: () => sql.close(), async goal(value = input, owner = "learner-a", version = 0) { return store.saveGoal(owner, value, version); }, key: () => randomUUID() };
}
