import type { AbusePort, EventPort } from "../contracts/access";
import type { CourseStore, CourseGenerator, GenerationResult } from "../contracts/course-plan";
import { courseCatalogue } from "../domain/course-catalogue";
import { validateGeneration } from "../domain/course-policy";

export function courseService(store: CourseStore, generator: CourseGenerator, abuse: AbusePort, events: EventPort) {
  return {
    async generate(owner: string, goalId: string, key: string) {
      const goal = await store.ownedGoal(owner, goalId);
      if (!goal) throw new Error("NOT_FOUND");
      const { plan, lease } = await store.reserve(owner, goal, key, generator.configuration, courseCatalogue.version);
      if (!lease) return plan;
      let result: GenerationResult;
      try {
        if (!await abuse.allow(`course:${owner}`, 5, 600)) result = { state: "failed", code: "GENERATION_LIMITED" };
        else result = validateGeneration(await generator.generate(goal.input, courseCatalogue), goal.input, courseCatalogue);
      } catch (error) {
        const code = error instanceof Error && ["GENERATOR_NOT_CONFIGURED", "GENERATOR_REFUSED", "GENERATOR_INCOMPLETE"].includes(error.message) ? error.message : "GENERATOR_UNAVAILABLE";
        result = { state: "failed", code };
      }
      events.emit("course_generation", result.state);
      return store.finish(owner, plan.id, lease, result);
    },
    async accept(owner: string, planId: string, key: string) {
      const plan = await store.readPlan(owner, planId);
      if (!plan) throw new Error("NOT_FOUND");
      if (plan.state !== "ready-preview" || plan.result?.state !== "ready-preview") throw new Error("PLAN_NOT_READY");
      return store.accept(owner, plan, key);
    },
    async place(owner: string, id: string, mode: "skip" | "diagnostic" | "beginning", answers: string[] = []) {
      const enrollment = await store.enrollment(owner, id);
      if (!enrollment || enrollment.plan.result?.state !== "ready-preview") throw new Error("NOT_FOUND");
      const modules = enrollment.plan.result.proposal.modules;
      if (mode === "beginning") return store.start(owner, id, modules[0].objective.id);
      const later = mode === "diagnostic" && answers[0] === "yes" && answers.filter((a) => a === "yes").length >= 3;
      const objectiveId = modules[later ? Math.min(1, modules.length - 1) : 0].objective.id;
      const reason = mode === "skip" ? "You chose to start from the beginning. No ability or achievement is inferred." : later ? "Your self-reported readiness suggests the second module. This is provisional, not an assessed ability or prerequisite achievement. You can study the first module at any time." : "Start with the foundations based on your self-reported readiness. No achievement is awarded.";
      return store.place(owner, id, { mode, objectiveId, reason, ...(mode === "diagnostic" ? { answers } : {}) });
    },
  };
}
