import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { harness, origin, post, receipt, cookies, secret } from "./auth-harness";
import { courseStore } from "../src/adapters/course-store";
import { repositories } from "../src/adapters/access-repositories";
import { courseService } from "../src/application/course-service";
import { courseHttp } from "../src/application/course-http";
import { input, output } from "./course-harness";

it("restores private course entry across real Better Auth instances and denies another learner", { timeout: 15000 }, async () => {
  const h = await harness();
  try {
    for (const name of ["0002-course-plans.sql", "0003-enrollment-preferences.sql"]) await h.sql.exec(await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8"));
    async function signIn(email: string, ip: string) {
      await h.app.handle(post("request", { email }, "", ip), "request");
      const { cookie, csrf } = await receipt(h.app, h.mail.at(-1)!.link);
      return cookies(await h.app.handle(post("confirm", { csrf }, cookie, ip), "confirm"));
    }
    const cookie = await signIn("entry-a@example.test", "192.0.2.10");
    const store = courseStore(h.db); const { abuse } = repositories(h.db, secret);
    const service = courseService(store, { configuration: "synthetic-entry-v1", generate: async () => output("customer-emails", "customer emails") }, abuse, { emit() {} });
    function handler() { const restarted = h.makeInstance(); return courseHttp({ session: restarted.learner }, store, service, origin); }
    function req(path: string, method = "GET", body?: object, session = cookie) { return new Request(origin + path, { method, headers: { cookie: session, origin, "content-type": "application/json", "idempotency-key": "synthetic-entry-key-001" }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
    const handle = handler();
    const goal = (await (await handle(req("/api/profile/goal", "PUT", { ...input, version: 0 }), "goal")).json()).data;
    const plan = (await (await handle(req("/api/course-plans", "POST", { goalId: goal.id }), "plans")).json()).data;
    const enrollment = (await (await handle(req("/api/enrollments", "POST", { planId: plan.id }), "enrollments")).json()).data;
    expect(enrollment.preferences.sessionMinutes).toBe(20);
    expect((await handle(req("/api/enrollments/placement", "POST", { mode: "skip" }), "enrollments", enrollment.id, "placement")).status).toBe(200);
    const restored = (await (await handler()(req("/api/profile/goal"), "goal")).json()).data;
    expect(restored.enrollment.id).toBe(enrollment.id); expect(restored.enrollment.startObjectiveId).toBe("AI-1");
    const other = await signIn("entry-b@example.test", "192.0.2.11");
    expect((await handler()(req("/api/enrollments/private", "GET", undefined, other), "enrollments", enrollment.id)).status).toBe(404);
    expect((await handler()(req("/api/profile/goal", "GET", undefined, ""), "goal")).status).toBe(401);
  } finally { await h.close(); }
});
