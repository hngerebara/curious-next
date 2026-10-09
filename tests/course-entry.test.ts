import { afterEach, describe, expect, it } from "vitest";
import { courseHarness, input, output, request } from "./course-harness";
import type { Intent } from "../src/contracts/course-plan";
const harnesses: Awaited<ReturnType<typeof courseHarness>>[] = [];
afterEach(async () => { for (const h of harnesses.splice(0)) await h.close(); });
async function accepted(intent: Intent = "customer-emails", evidence = "customer emails") {
  const h = await courseHarness(async () => output(intent, evidence)); harnesses.push(h);
  const goal = await h.goal({ ...input, goalText: intent === "phishing" ? "Recognise phishing messages" : input.goalText });
  const plan = await h.service.generate("learner-a", goal.id, h.key());
  const enrollment = await h.service.accept("learner-a", plan.id, h.key());
  return { h, enrollment };
}
describe("course entry", { timeout: 15000 }, () => {
  it.each([["customer-emails", "customer emails", ["b", "a", "a", "b"], "AI-2"], ["phishing", "phishing", ["a", "unsure"], "CY-2"]] as const)("places %s by the first demonstrated gap, without achievement", async (intent, evidence, answers, objective) => {
    const { h, enrollment } = await accepted(intent, evidence);
    const packet = await h.service.diagnostic("learner-a", enrollment.id);
    expect(packet.questions).toHaveLength(answers.length); expect(JSON.stringify(packet)).not.toContain('"correct"');
    const placed = await h.service.place("learner-a", enrollment.id, "diagnostic", [...answers], packet.version);
    expect(placed.startObjectiveId).toBe(objective); expect(placed.placement?.questionIds).toHaveLength(answers.length);
    const guidance = await h.service.recommendation("learner-a", enrollment.id);
    expect(guidance.capabilities.every(c => c.state === "not_assessed")).toBe(true);
    const beginning = await h.service.place("learner-a", enrollment.id, "beginning");
    expect(beginning.startObjectiveId).toBe(packet.questions[0].objectiveId); expect(beginning.placement).toEqual(placed.placement);
  });
  it("rejects stale or incomplete answers and retains a successful placement on retry", async () => {
    const { h, enrollment } = await accepted();
    await expect(h.service.place("learner-a", enrollment.id, "diagnostic", ["b"], "old")).rejects.toThrow("DIAGNOSTIC_CHANGED");
    await expect(h.service.place("learner-a", enrollment.id, "diagnostic", ["b"], "entry-diagnostic-v1")).rejects.toThrow("INVALID_PLACEMENT");
    const first = await h.service.place("learner-a", enrollment.id, "diagnostic", ["b", "c", "a", "b"], "entry-diagnostic-v1");
    expect(first.startObjectiveId).toBe("AI-4");
    expect((await h.service.place("learner-a", enrollment.id, "diagnostic", ["b", "c", "a", "b"], "entry-diagnostic-v1")).placement).toEqual(first.placement);
  });
  it("restores enrollment without a URL and isolates diagnostic, preferences and recommendations", async () => {
    const { h, enrollment } = await accepted();
    const restored = await (await h.handler(request("/api/profile/goal"), "goal")).json();
    expect(restored.data.enrollment.id).toBe(enrollment.id);
    for (const action of ["diagnostic", "preferences"]) {
      const method = action === "preferences" ? "PATCH" : "GET";
      const body = action === "preferences" ? { ...enrollment.preferences, sessionMinutes: 10 } : undefined;
      expect((await h.handler(request("/api/enrollments/private", method, body, h.key(), "learner-b"), "enrollments", enrollment.id, action)).status).toBe(404);
    }
    expect((await h.handler(request("/api/recommendation", "GET", undefined, h.key(), "learner-b"), "recommendation", enrollment.id)).status).toBe(404);
  });
  it("saves preferences with retry safety and rejects concurrent conflicting edits", async () => {
    const { h, enrollment } = await accepted();
    const prefs = { explanationLevel: "technical" as const, teachingLanguage: "en" as const, sessionMinutes: 10 as const };
    const a = await h.store.preferences("learner-a", enrollment.id, prefs, 0);
    expect((await h.store.preferences("learner-a", enrollment.id, prefs, 0)).preferences).toEqual(a.preferences);
    await expect(h.store.preferences("learner-a", enrollment.id, { ...prefs, sessionMinutes: 40 }, 0)).rejects.toThrow("PREFERENCE_CONFLICT");
    const guidance = await h.service.recommendation("learner-a", enrollment.id);
    expect(guidance.preferenceVersion).toBe(1); expect(guidance.alternatives).toHaveLength(2);
    expect([guidance.primary, ...guidance.alternatives].every(a => a.minutes <= 10)).toBe(true);
    expect((await h.store.enrollment("learner-a", enrollment.id))?.plan.goal.input).toEqual(input);
  });
  it("preserves historical self-report placement and exposes an older course after a new goal", async () => {
    const { h, enrollment } = await accepted();
    const legacy = { mode: "diagnostic", objectiveId: "AI-2", reason: "Earlier self-reported readiness", answers: ["yes", "yes", "yes", "no"] };
    await h.sql.query("update preview_enrollment set placement = $1::jsonb, start_objective_id = $2 where id = $3", [JSON.stringify(legacy), "AI-2", enrollment.id]);
    expect((await h.store.enrollment("learner-a", enrollment.id))?.placement).toEqual(legacy);
    expect((await h.store.enrollment("learner-a", enrollment.id))?.preferences.version).toBe(0);
    await h.goal({ ...input, goalText: "Improve customer emails with AI" }, "learner-a", 1);
    const restored = await (await h.handler(request("/api/profile/goal"), "goal")).json();
    expect(restored.data.enrollment).toBeNull(); expect(restored.data.latestEnrollmentId).toBe(enrollment.id);
  });
  it("allows only one conflicting preference write under concurrency", async () => {
    const { h, enrollment } = await accepted();
    const results = await Promise.allSettled([10, 40].map(sessionMinutes => h.store.preferences("learner-a", enrollment.id, { explanationLevel: "beginner", teachingLanguage: "en", sessionMinutes: sessionMinutes as 10 | 40 }, 0)));
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect((await h.store.enrollment("learner-a", enrollment.id))?.preferences.version).toBe(1);
  });

});
