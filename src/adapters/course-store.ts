import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { CourseStore, Goal, Plan, Enrollment, EntryPreferences } from "../contracts/course-plan";
import type { AccessDatabase } from "./access-repositories";
import { user } from "./auth-schema";
import { learnerGoal, coursePlan, previewEnrollment, enrollmentRequest } from "./course-schema";

export function courseStore(db: AccessDatabase): CourseStore {
  const toGoal = (row: typeof learnerGoal.$inferSelect): Goal => ({ id: row.id, version: row.version, input: row.input });
  const ownedGoal = async (owner: string, id: string) => {
    const [row] = await db.select().from(learnerGoal).where(and(eq(learnerGoal.id, id), eq(learnerGoal.learnerId, owner)));
    return row ? toGoal(row) : null;
  };
  const toPlan = async (row: typeof coursePlan.$inferSelect): Promise<Plan> => {
    const goal = await ownedGoal(row.learnerId, row.goalId);
    if (!goal) throw new Error("NOT_FOUND");
    return { id: row.id, requestKey: row.requestKey, goal, state: row.state as Plan["state"], result: row.result, catalogueVersion: row.catalogueVersion, configuration: row.configuration, attempts: row.attempts, retryAfter: row.leaseUntil?.toISOString() ?? null };
  };
  const readPlan = async (owner: string, id: string) => {
    const [row] = await db.select().from(coursePlan).where(and(eq(coursePlan.id, id), eq(coursePlan.learnerId, owner)));
    return row ? toPlan(row) : null;
  };
  const defaults = (plan: Plan): EntryPreferences => ({ version: 0, explanationLevel: plan.goal.input.explanationLevel, teachingLanguage: "en", sessionMinutes: plan.goal.input.sessionMinutes });
  const enrollment = async (owner: string, id: string): Promise<Enrollment | null> => {
    const [row] = await db.select().from(previewEnrollment).where(and(eq(previewEnrollment.id, id), eq(previewEnrollment.learnerId, owner)));
    if (!row) return null;
    const plan = await readPlan(owner, row.planId);
    return plan ? { id: row.id, plan, placement: row.placement, startObjectiveId: row.startObjectiveId, preferences: row.preferences ?? defaults(plan) } : null;
  };
  return {
    ownedGoal, readPlan, enrollment,
    async latestEnrollment(owner, planId) {
      const [row] = await db.select().from(previewEnrollment).where(and(eq(previewEnrollment.learnerId, owner), planId ? eq(previewEnrollment.planId, planId) : undefined)).orderBy(desc(previewEnrollment.createdAt), desc(previewEnrollment.id)).limit(1);
      return row ? enrollment(owner, row.id) : null;
    },
    async preferences(owner, id, input, version) {
      const written = await db.transaction(async (tx) => {
        await tx.execute(sql`select id from ${previewEnrollment} where id = ${id} and learner_id = ${owner} for update`);
        const [row] = await tx.select().from(previewEnrollment).where(and(eq(previewEnrollment.id, id), eq(previewEnrollment.learnerId, owner)));
        if (!row) throw new Error("NOT_FOUND");
        const currentVersion = row.preferences?.version ?? 0;
        if (row.preferences && currentVersion === version + 1 && row.preferences.explanationLevel === input.explanationLevel && row.preferences.teachingLanguage === input.teachingLanguage && row.preferences.sessionMinutes === input.sessionMinutes) return row.preferences;
        if (currentVersion !== version) throw new Error("PREFERENCE_CONFLICT");
        const updated = { ...input, version: version + 1 };
        await tx.update(previewEnrollment).set({ preferences: updated }).where(eq(previewEnrollment.id, id));
        return updated;
      });
      const saved = await enrollment(owner, id);
      if (!saved) throw new Error("NOT_FOUND");
      return { ...saved, preferences: written };
    },
    async goal(owner) { const [row] = await db.select().from(learnerGoal).where(eq(learnerGoal.learnerId, owner)).orderBy(desc(learnerGoal.version)).limit(1); return row ? toGoal(row) : null; },
    async saveGoal(owner, input, expectedVersion) {
      return db.transaction(async (tx) => {
        await tx.execute(sql`select id from ${user} where id = ${owner} for update`);
        const [current] = await tx.select().from(learnerGoal).where(eq(learnerGoal.learnerId, owner)).orderBy(desc(learnerGoal.version)).limit(1);
        if (current && current.version === expectedVersion + 1 && JSON.stringify([current.input.goalText, current.input.explanationLevel, current.input.teachingLanguage, current.input.sessionMinutes, current.input.clarification ?? ""]) === JSON.stringify([input.goalText, input.explanationLevel, input.teachingLanguage, input.sessionMinutes, input.clarification ?? ""])) return toGoal(current);
        if ((current?.version ?? 0) !== expectedVersion) throw new Error("REVISION_CONFLICT");
        const [row] = await tx.insert(learnerGoal).values({ id: randomUUID(), learnerId: owner, version: expectedVersion + 1, input }).returning();
        return toGoal(row);
      });
    },
    async latestPlan(owner, goalId) {
      const [row] = await db.select().from(coursePlan).where(and(eq(coursePlan.learnerId, owner), eq(coursePlan.goalId, goalId))).orderBy(desc(coursePlan.createdAt)).limit(1);
      return row ? toPlan(row) : null;
    },
    async reserve(owner, goal, key, configuration, catalogueVersion) {
      await db.insert(coursePlan).values({ id: randomUUID(), learnerId: owner, goalId: goal.id, requestKey: key, configuration, catalogueVersion, state: "generating" }).onConflictDoNothing();
      const [saved] = await db.select().from(coursePlan).where(and(eq(coursePlan.learnerId, owner), eq(coursePlan.requestKey, key)));
      if (!saved || saved.goalId !== goal.id) throw new Error("REQUEST_CONFLICT");
      if ((saved.state === "failed" || saved.state === "generating") && (saved.configuration !== configuration || saved.catalogueVersion !== catalogueVersion)) throw new Error("CONFIGURATION_CHANGED");
      await db.update(coursePlan).set({ state: "failed", result: { state: "failed", code: "ATTEMPTS_EXHAUSTED" }, lease: null, leaseUntil: null }).where(and(eq(coursePlan.id, saved.id), eq(coursePlan.learnerId, owner), eq(coursePlan.state, "generating"), sql`${coursePlan.attempts} >= 2`, sql`${coursePlan.leaseUntil} <= now()`));
      const lease = randomUUID();
      const [claimed] = await db.update(coursePlan).set({ state: "generating", result: null, lease, leaseUntil: sql`now() + interval '45 seconds'`, attempts: sql`${coursePlan.attempts} + 1` })
        .where(and(eq(coursePlan.id, saved.id), eq(coursePlan.learnerId, owner), sql`${coursePlan.attempts} < 2`, sql`(${coursePlan.state} = 'failed' or (${coursePlan.state} = 'generating' and (${coursePlan.leaseUntil} is null or ${coursePlan.leaseUntil} <= now())))`)).returning();
      return { plan: claimed ? await toPlan(claimed) : (await readPlan(owner, saved.id))!, lease: claimed ? lease : null };
    },
    async finish(owner, id, lease, result) {
      await db.update(coursePlan).set({ state: result.state, result, lease: null, leaseUntil: null }).where(and(eq(coursePlan.id, id), eq(coursePlan.learnerId, owner), eq(coursePlan.lease, lease)));
      const plan = await readPlan(owner, id);
      if (!plan) throw new Error("NOT_FOUND");
      return plan;
    },
    async accept(owner, plan, key) {
      await db.transaction(async (tx) => {
        await tx.insert(enrollmentRequest).values({ learnerId: owner, requestKey: key, planId: plan.id }).onConflictDoNothing();
        const [request] = await tx.select().from(enrollmentRequest).where(and(eq(enrollmentRequest.learnerId, owner), eq(enrollmentRequest.requestKey, key)));
        if (!request || request.planId !== plan.id) throw new Error("REQUEST_CONFLICT");
        await tx.insert(previewEnrollment).values({ id: randomUUID(), learnerId: owner, planId: plan.id }).onConflictDoNothing();
      });
      const [row] = await db.select().from(previewEnrollment).where(and(eq(previewEnrollment.learnerId, owner), eq(previewEnrollment.planId, plan.id)));
      return { id: row.id, plan, placement: row.placement, startObjectiveId: row.startObjectiveId, preferences: row.preferences ?? defaults(plan) };
    },
    async start(owner, id, objectiveId) {
      await db.update(previewEnrollment).set({ startObjectiveId: objectiveId }).where(and(eq(previewEnrollment.id, id), eq(previewEnrollment.learnerId, owner), sql`${previewEnrollment.placement} is not null`));
      const saved = await enrollment(owner, id);
      if (!saved || !saved.placement) throw new Error("NOT_FOUND");
      return saved;
    },
    async place(owner, id, placement) {
      const [row] = await db.update(previewEnrollment).set({ placement, startObjectiveId: placement.objectiveId }).where(and(eq(previewEnrollment.id, id), eq(previewEnrollment.learnerId, owner), sql`${previewEnrollment.placement} is null`)).returning();
      const saved = await enrollment(owner, id);
      if (!saved) throw new Error("NOT_FOUND");
      if (!row && JSON.stringify([saved.placement?.mode, saved.placement?.objectiveId, saved.placement?.reason, saved.placement?.answers]) !== JSON.stringify([placement.mode, placement.objectiveId, placement.reason, placement.answers])) throw new Error("PLACEMENT_CONFLICT");
      return saved;
    },
  };
}
