import { and, asc, eq, sql } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import type { AccessDatabase } from "./access-repositories";
import type { Attempt, Practice, Variant, ExplanationLevel, Submission, ObjectiveId } from "../contracts/attempt";
import { phishingLesson } from "../domain/phishing-module";
import { lessonText } from "../domain/prompt-module";
import { learningAttempt, practiceRequest, assistanceEvent, attemptSubmission, assessmentJob, assessmentRun, optionalReview } from "./attempt-schema";

export type AttemptExecutor = Pick<AccessDatabase, "select" | "insert" | "update" | "execute">;
export const hash = (value: unknown) => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
export function makeVariant(level: ExplanationLevel, objective: ObjectiveId = "AI-2"): Variant {
  const content = objective === "CY-2" ? phishingLesson(level) : lessonText(level);
  return { id: randomUUID(), version: `${objective}-lesson-v2`, explanationLevel: level, content, hash: hash(content), objectiveId: objective, rubricVersion: objective === "CY-2" ? "CY-2-v2" : "AI-2-v2", locale: "en" };
}
export const practiceRecord = (r: typeof practiceRequest.$inferSelect): Practice => ({ id:r.id,key:r.key,revision:r.revision,prompt:r.prompt,response:r.response,state:r.state as Practice["state"],code:r.code,configuration:r.configuration,calls:r.calls,leaseUntil:r.leaseUntil?.toISOString() ?? null });
export async function lockAttempt(tx: AttemptExecutor, owner: string, id: string) {
  await tx.execute(sql`select id from ${learningAttempt} where id = ${id} and learner_id = ${owner} for update`);
  const [row] = await tx.select().from(learningAttempt).where(and(eq(learningAttempt.id,id),eq(learningAttempt.learnerId,owner)));
  if (!row) throw new Error("NOT_FOUND");
  return row;
}
export async function ensureDraft(tx: AttemptExecutor, id: string) {
  const [submitted] = await tx.select().from(attemptSubmission).where(eq(attemptSubmission.attemptId,id));
  if (submitted) throw new Error("ATTEMPT_FROZEN");
}
export async function readAttempt(db: AttemptExecutor, owner: string, id: string): Promise<Attempt> {
  const [row] = await db.select().from(learningAttempt).where(and(eq(learningAttempt.id,id),eq(learningAttempt.learnerId,owner)));
  if (!row) throw new Error("NOT_FOUND");
  const practice = await db.select().from(practiceRequest).where(and(eq(practiceRequest.attemptId,id),eq(practiceRequest.learnerId,owner))).orderBy(asc(practiceRequest.sequence));
  const help = await db.select().from(assistanceEvent).where(and(eq(assistanceEvent.attemptId,id),eq(assistanceEvent.learnerId,owner))).orderBy(asc(assistanceEvent.deliveredAt),asc(assistanceEvent.id));
  const [saved] = await db.select().from(attemptSubmission).where(and(eq(attemptSubmission.attemptId,id),eq(attemptSubmission.learnerId,owner)));
  let submission: Submission | null = null;
  if (saved) {
    const [job] = await db.select().from(assessmentJob).where(eq(assessmentJob.submissionId,saved.id));
    const runs = await db.select().from(assessmentRun).where(eq(assessmentRun.submissionId,saved.id)).orderBy(asc(assessmentRun.claim));
    const [review] = await db.select().from(optionalReview).where(eq(optionalReview.submissionId,saved.id));
    submission = { id:saved.id,key:saved.key,hash:saved.hash,frozen:saved.frozen,submittedAt:saved.submittedAt.toISOString(), job:{state:job.state as Submission["job"]["state"],claims:job.claims,leaseUntil:job.leaseUntil?.toISOString() ?? null}, assessments:runs.map(r=>({id:r.id,decision:r.decision,configuration:r.configuration,assessedAt:r.assessedAt.toISOString()})),reviewRequested:!!review };
  }
  return {id:row.id,enrollmentId:row.enrollmentId,mode:row.mode,task:row.task,draft:row.draft,revision:row.revision,assisted:row.assisted,variant:row.variant,practice:practice.map(practiceRecord),help:help.map(r=>({id:r.id,key:r.key,kind:r.kind,content:r.content,substantive:true,deliveredAt:r.deliveredAt.toISOString()})),submission,createdAt:row.createdAt.toISOString()};
}
