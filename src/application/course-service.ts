import type { AbusePort, EventPort } from "../contracts/access";
import type { CourseStore, CourseGenerator, GenerationResult } from "../contracts/course-plan";
import { courseCatalogue } from "../domain/course-catalogue";
import { diagnosticPacket, diagnosticPlacement } from "../domain/entry-diagnostic";
import { entryGuidance } from "../domain/entry-guidance";
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
        const code = error instanceof Error && ["GENERATOR_NOT_CONFIGURED", "GENERATOR_REFUSED", "GENERATOR_INCOMPLETE", "GENERATOR_RATE_LIMITED"].includes(error.message) ? error.message : "GENERATOR_UNAVAILABLE";
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
    async diagnostic(owner: string, id: string) {
      const saved = await store.enrollment(owner, id); if (!saved) throw new Error("NOT_FOUND"); return diagnosticPacket(saved);
    },
    async recommendation(owner: string, id?: string) {
      const saved = id ? await store.enrollment(owner, id) : await store.latestEnrollment(owner);
      if (!saved) throw new Error("NOT_FOUND"); return entryGuidance(saved);
    },
    async place(owner: string, id: string, mode: "skip" | "diagnostic" | "beginning", answers: string[] = [], version = "") {
      const enrollment = await store.enrollment(owner, id);
      if (!enrollment || enrollment.plan.result?.state !== "ready-preview") throw new Error("NOT_FOUND");
      const modules = enrollment.plan.result.proposal.modules;
      if (mode === "beginning") return store.start(owner, id, modules[0].objective.id);
      if (mode === "diagnostic") return store.place(owner, id, diagnosticPlacement(enrollment, answers, version));
      return store.place(owner, id, { mode: "skip", objectiveId: modules[0].objective.id, reason: "You chose to start from the beginning. No ability or achievement is inferred.", policyVersion: "entry-skip-v1" });
    },
  };
}
