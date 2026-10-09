import type { AuthPort } from "../contracts/access";
import type { CourseStore } from "../contracts/course-plan";
import type { courseService } from "./course-service";
import { boundedText, goalInput, record } from "../domain/course-policy";

export function courseHttp(auth: Pick<AuthPort, "session">, store: CourseStore, service: ReturnType<typeof courseService>, origin: string) {
  const reply = (status: number, data: unknown, error = false) => Response.json(error ? { error: { code: data }, requestId: crypto.randomUUID() } : { data, requestId: crypto.randomUUID() }, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  const key = (request: Request) => { const value = request.headers.get("idempotency-key"); if (!value || !/^[a-zA-Z0-9_-]{16,80}$/.test(value)) throw new Error("INVALID_KEY"); return value; };
  async function body(request: Request) {
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new Error("INVALID_BODY");
    const reader = request.body?.getReader(); if (!reader) throw new Error("INVALID_BODY");
    const chunks = []; let length = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 4096) { await reader.cancel(); throw new Error("BODY_TOO_LARGE"); } chunks.push(value); }
    const bytes = new Uint8Array(length); let offset = 0; for (const value of chunks) { bytes.set(value, offset); offset += value.length; }
    const result: unknown = JSON.parse(new TextDecoder().decode(bytes)); if (!record(result)) throw new Error("INVALID_BODY"); return result;
  }
  return async function handle(request: Request, resource: "goal" | "plans" | "enrollments", id?: string, action?: string) {
    try {
      const learner = await auth.session(request.headers);
      if (!learner) return reply(401, "SESSION_REQUIRED", true);
      if (request.method !== "GET" && request.headers.get("origin") !== origin) return reply(403, "ORIGIN_REJECTED", true);
      if (resource === "goal" && request.method === "GET") { const goal = await store.goal(learner.id); return reply(200, { goal, plan: goal ? await store.latestPlan(learner.id, goal.id) : null }); }
      if (resource === "plans" && id && request.method === "GET") { const plan = await store.readPlan(learner.id, id); return plan ? reply(200, plan) : reply(404, "NOT_FOUND", true); }
      if (resource === "enrollments" && id && !action && request.method === "GET") { const item = await store.enrollment(learner.id, id); return item ? reply(200, item) : reply(404, "NOT_FOUND", true); }
      if (!((resource === "goal" && request.method === "PUT") || (request.method === "POST" && ["plans", "enrollments"].includes(resource)))) return reply(405, "METHOD_NOT_ALLOWED", true);
      const data = await body(request);
      if (resource === "goal") {
        const input = goalInput(data);
        if (data.teachingLanguage !== "en") return reply(400, "LANGUAGE_UNAVAILABLE", true);
        if (!input || !Number.isSafeInteger(data.version) || Number(data.version) < 0) return reply(400, "INVALID_GOAL", true);
        return reply(200, await store.saveGoal(learner.id, input, Number(data.version)));
      }
      if (resource === "plans" && !id) {
        if (Object.keys(data).join() !== "goalId" || !boundedText(data.goalId, 1, 80)) return reply(400, "INVALID_BODY", true);
        const plan = await service.generate(learner.id, data.goalId, key(request));
        return reply(plan.state === "generating" ? 202 : 200, plan);
      }
      if (resource === "enrollments" && !id) {
        if (Object.keys(data).join() !== "planId" || !boundedText(data.planId, 1, 80)) return reply(400, "INVALID_BODY", true);
        return reply(200, await service.accept(learner.id, data.planId, key(request)));
      }
      if (resource === "enrollments" && id && action === "placement") {
        if (data.mode === "beginning" && Object.keys(data).join() === "mode") return reply(200, await service.place(learner.id, id, "beginning"));
        if (data.mode === "skip" && Object.keys(data).join() === "mode") return reply(200, await service.place(learner.id, id, "skip"));
        if (data.mode === "diagnostic" && Object.keys(data).sort().join() === "answers,mode" && Array.isArray(data.answers) && data.answers.length === 4 && data.answers.every((a) => ["yes", "no"].includes(a))) return reply(200, await service.place(learner.id, id, "diagnostic", data.answers));
        return reply(400, "INVALID_PLACEMENT", true);
      }
      return reply(404, "NOT_FOUND", true);
    } catch (error) {
      const code = error instanceof Error ? error.message : "UNAVAILABLE";
      if (["NOT_FOUND"].includes(code)) return reply(404, code, true);
      if (["REVISION_CONFLICT", "REQUEST_CONFLICT", "PLACEMENT_CONFLICT", "PLAN_NOT_READY", "CONFIGURATION_CHANGED"].includes(code)) return reply(409, code, true);
      if (code === "BODY_TOO_LARGE") return reply(413, code, true);
      if (["INVALID_KEY", "INVALID_BODY"].includes(code) || error instanceof SyntaxError) return reply(400, "INVALID_BODY", true);
      return reply(503, "UNAVAILABLE", true);
    }
  };
}
