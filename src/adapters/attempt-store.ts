import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AttemptStore } from "../contracts/attempt";
import type { AccessDatabase } from "./access-repositories";
import { promptTask } from "../domain/prompt-module";
import { capabilityFromEvidence, compatibleEvidence, learningRecommendation } from "../domain/assessment-policy";
import { user } from "./auth-schema";
import { previewEnrollment } from "./course-schema";
import { learningAttempt, draftRevision, lessonVariant, assistanceEvent, attemptSubmission, learningEvidence, learningNext } from "./attempt-schema";
import { makeVariant, lockAttempt, readAttempt, ensureDraft, hash } from "./attempt-records";
import { practiceStore } from "./practice-store";
import { assessmentStore } from "./assessment-store";

export function attemptStore(db: AccessDatabase): AttemptStore {
  return {
    ...practiceStore(db),...assessmentStore(db),read:(owner,id)=>readAttempt(db,owner,id),
    async create(owner,enrollmentId,mode,key,level) {
      const [enrollment] = await db.select().from(previewEnrollment).where(and(eq(previewEnrollment.id,enrollmentId),eq(previewEnrollment.learnerId,owner)));
      if (!enrollment) throw new Error("NOT_FOUND");
      const savedId = await db.transaction(async tx=>{
        await tx.execute(sql`select id from ${previewEnrollment} where id = ${enrollmentId} and learner_id = ${owner} for update`);
        await tx.execute(sql`select id from ${user} where id = ${owner} for update`);
        const [prior] = await tx.select().from(learningAttempt).where(and(eq(learningAttempt.learnerId,owner),eq(learningAttempt.requestKey,key)));
        if (prior) { if (prior.enrollmentId !== enrollmentId || prior.mode !== mode) throw new Error("REQUEST_CONFLICT"); return prior.id; }
        const previous = await tx.select().from(learningAttempt).where(and(eq(learningAttempt.learnerId,owner),eq(learningAttempt.mode,"independent")));
        const task = promptTask(mode,previous.length);
        const variant = makeVariant(level); const id = randomUUID(); const draft = {prompt:"",checklist:"",explanation:""};
        await tx.insert(learningAttempt).values({id,learnerId:owner,enrollmentId,mode,requestKey:key,task,draft,variant}).onConflictDoNothing();
        const [saved] = await tx.select().from(learningAttempt).where(and(eq(learningAttempt.learnerId,owner),eq(learningAttempt.requestKey,key)));
        if (saved.enrollmentId !== enrollmentId || saved.mode !== mode) throw new Error("REQUEST_CONFLICT");
        if (saved.id === id) {
          await tx.insert(draftRevision).values({attemptId:id,revision:0,draft});
          await tx.insert(lessonVariant).values({id:variant.id,attemptId:id,level,payload:variant});
        }
        return saved.id;
      });
      return readAttempt(db,owner,savedId);
    },
    async learning(owner,enrollmentId,budget) {
      const [enrollment] = await db.select().from(previewEnrollment).where(and(eq(previewEnrollment.id,enrollmentId),eq(previewEnrollment.learnerId,owner)));
      if (!enrollment) throw new Error("NOT_FOUND");
      const rows = await db.select({id:learningAttempt.id,mode:learningAttempt.mode,assisted:learningAttempt.assisted,createdAt:learningAttempt.createdAt,submissionId:attemptSubmission.id}).from(learningAttempt).leftJoin(attemptSubmission,eq(attemptSubmission.attemptId,learningAttempt.id)).where(and(eq(learningAttempt.enrollmentId,enrollmentId),eq(learningAttempt.learnerId,owner))).orderBy(desc(learningAttempt.createdAt),desc(learningAttempt.id));
      const evidence = await db.select().from(learningEvidence).where(eq(learningEvidence.learnerId,owner));
      const [next] = await db.select().from(learningNext).where(and(eq(learningNext.enrollmentId,enrollmentId),eq(learningNext.learnerId,owner)));
      const payloads = compatibleEvidence(evidence.map(r=>r.payload));
      const capability = capabilityFromEvidence(payloads);
      const initial = payloads.find(e=>e.demonstrated);
      const latest = payloads.at(-1);
      const gap = latest?.criteria.find(c=>c.result !== "met");
      const reason = gap ? `${gap.id}: ${gap.feedback}` : next?.payload.evidenceId === capability.latestEvidenceId ? next.payload.reason : undefined;
      const attempts = rows.map(row=>({id:row.id,mode:row.mode,submitted:!!row.submissionId,assisted:row.assisted,createdAt:row.createdAt.toISOString()}));
      return {enrollmentId,attempts,capability,evidence:evidence.map(r=>r.payload),recommendation:learningRecommendation(capability,budget,reason),recallDueAt:initial ? new Date(Date.parse(initial.assessedAt)+86400000).toISOString() : null,transferAvailable:!!initial};
    },
    async save(owner,id,revision,draft) {
      await db.transaction(async tx=>{
        const row = await lockAttempt(tx,owner,id); await ensureDraft(tx,id);
        if (row.revision === revision+1 && hash(row.draft) === hash(draft)) return;
        if (row.revision !== revision) throw new Error("DRAFT_CONFLICT");
        await tx.update(learningAttempt).set({draft,revision:revision+1}).where(eq(learningAttempt.id,id));
        await tx.insert(draftRevision).values({attemptId:id,revision:revision+1,draft});
      });
      return readAttempt(db,owner,id);
    },
    async variant(owner,id,level) {
      await db.transaction(async tx=>{
        await lockAttempt(tx,owner,id); await ensureDraft(tx,id);
        const [prior] = await tx.select().from(lessonVariant).where(and(eq(lessonVariant.attemptId,id),eq(lessonVariant.level,level)));
        const variant = prior?.payload ?? makeVariant(level);
        if (!prior) await tx.insert(lessonVariant).values({id:variant.id,attemptId:id,level,payload:variant});
        await tx.update(learningAttempt).set({variant}).where(eq(learningAttempt.id,id));
      });
      return readAttempt(db,owner,id);
    },
    async help(owner,id,key,kind,content) {
      await db.transaction(async tx=>{
        await lockAttempt(tx,owner,id);
        const [prior] = await tx.select().from(assistanceEvent).where(and(eq(assistanceEvent.learnerId,owner),eq(assistanceEvent.key,key)));
        if (prior && (prior.attemptId !== id || prior.kind !== kind)) throw new Error("REQUEST_CONFLICT");
        if (prior) return;
        await ensureDraft(tx,id);
        await tx.insert(assistanceEvent).values({id:randomUUID(),learnerId:owner,attemptId:id,key,kind,content});
        await tx.update(learningAttempt).set({assisted:true}).where(eq(learningAttempt.id,id));
      });
      return readAttempt(db,owner,id);
    },
  };
}
