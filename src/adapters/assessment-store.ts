import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AccessDatabase } from "./access-repositories";
import type { AttemptStore, Evidence, Frozen, Decision } from "../contracts/attempt";
import { demonstrates } from "../domain/assessment-policy";
import { retentionProjection, retentionRecommendation } from "../domain/retention-policy";
import { completeSimulation } from "../domain/phishing-module";
import { user } from "./auth-schema";
import { previewEnrollment } from "./course-schema";
import { attemptSubmission, assessmentJob, assessmentRun, practiceRequest, learningEvidence, learningCapability, capabilityChange, learningNext, optionalReview } from "./attempt-schema";
import { lockAttempt, readAttempt, hash } from "./attempt-records";

export function assessmentStore(db: AccessDatabase, now:()=>Date = ()=>new Date()): Pick<AttemptStore,"submit" | "claim" | "finish" | "review"> {
  return {
    async submit(owner,id,revision,key) {
      await db.transaction(async tx=>{
        const row = await lockAttempt(tx,owner,id);
        const [byKey] = await tx.select().from(attemptSubmission).where(and(eq(attemptSubmission.learnerId,owner),eq(attemptSubmission.key,key)));
        if (byKey && (byKey.attemptId !== id || byKey.revision !== revision)) throw new Error("REQUEST_CONFLICT");
        const saved = await readAttempt(tx,owner,id);
        if (saved.submission) {
          if (saved.submission.key !== key || row.revision !== revision) throw new Error("REQUEST_CONFLICT");
          return;
        }
        if (row.revision !== revision) throw new Error("DRAFT_CONFLICT");
        await tx.update(practiceRequest).set({state:"failed",code:"GENERATION_INTERRUPTED",lease:null,leaseUntil:null}).where(and(eq(practiceRequest.attemptId,id),eq(practiceRequest.state,"pending"),sql`${practiceRequest.leaseUntil} <= now()`));
        const current = await readAttempt(tx,owner,id);
        if (current.practice.some(p=>p.state === "pending")) throw new Error("GENERATION_PENDING");
        const latest = current.practice.filter(p=>p.state === "succeeded").at(-1);
        if (row.task.objectiveId === "CY-2" ? !completeSimulation(row.draft) : !latest?.response || latest.prompt !== row.draft.prompt || !row.draft.checklist.trim() || !row.draft.explanation.trim()) throw new Error("INCOMPLETE_SUBMISSION");
        const frozen: Frozen = {task:row.task,draft:row.draft,practice:current.practice,response:latest?.response ?? "No Practice AI output. Fictional simulated decisions.",help:current.help,variant:row.variant,mode:row.mode,assisted:row.assisted};
        const submissionId = randomUUID();
        await tx.insert(attemptSubmission).values({id:submissionId,learnerId:owner,attemptId:id,key,revision,hash:hash(frozen),frozen});
        await tx.insert(assessmentJob).values({submissionId});
      });
      return readAttempt(db,owner,id);
    },
    async claim(owner,id,configuration) {
      const lease = await db.transaction(async tx=>{
        await lockAttempt(tx,owner,id);
        const saved = await readAttempt(tx,owner,id);
        if (!saved.submission) throw new Error("SUBMISSION_REQUIRED");
        const [job] = await tx.select().from(assessmentJob).where(eq(assessmentJob.submissionId,saved.submission.id));
        if (job.state === "succeeded") return null;
        const [available] = await tx.select().from(assessmentJob).where(and(eq(assessmentJob.submissionId,job.submissionId),sql`(${assessmentJob.leaseUntil} is null or ${assessmentJob.leaseUntil} <= now())`));
        if (!available) return null;
        if (job.configuration && job.configuration !== configuration) throw new Error("CONFIGURATION_CHANGED");
        // A process lost after its final claim must leave an explicit failure, never an eternal pending state.
        if (job.claims >= 3) {
          if (job.state === "pending") {
            const decision: Decision = {status:"failed",criteria:[],rubricVersion:saved.task.rubricVersion,policyVersion:saved.task.policyVersion,code:"ASSESSMENT_INTERRUPTED"};
            await tx.insert(assessmentRun).values({id:randomUUID(),submissionId:job.submissionId,claim:job.claims,decision,configuration}).onConflictDoNothing();
            await tx.update(assessmentJob).set({state:"failed",lease:null,leaseUntil:null}).where(eq(assessmentJob.submissionId,job.submissionId));
          }
          return null;
        }
        const token = randomUUID();
        await tx.update(assessmentJob).set({state:"pending",claims:job.claims+1,lease:token,leaseUntil:sql`now() + interval '45 seconds'`,configuration}).where(eq(assessmentJob.submissionId,job.submissionId));
        return token;
      });
      return {lease,attempt:await readAttempt(db,owner,id)};
    },
    async finish(owner,id,lease,decision,configuration) {
      await db.transaction(async tx=>{
        const attempt = await lockAttempt(tx,owner,id);
        const saved = await readAttempt(tx,owner,id);
        if (!saved.submission) throw new Error("SUBMISSION_REQUIRED");
        const [job] = await tx.select().from(assessmentJob).where(and(eq(assessmentJob.submissionId,saved.submission.id),eq(assessmentJob.lease,lease),eq(assessmentJob.configuration,configuration),sql`${assessmentJob.leaseUntil} > now()`));
        if (!job) return;
        // Serialise compatible evidence across all of this learner’s enrollments.
        await tx.execute(sql`select id from ${previewEnrollment} where id = ${attempt.enrollmentId} and learner_id = ${owner} for update`);
        await tx.execute(sql`select id from ${user} where id = ${owner} for update`);
        const assessmentId = randomUUID(); const assessedAt = now();
        await tx.insert(assessmentRun).values({id:assessmentId,submissionId:saved.submission.id,claim:job.claims,decision,configuration,assessedAt});
        await tx.update(assessmentJob).set({state:decision.status,lease:null,leaseUntil:null}).where(eq(assessmentJob.submissionId,job.submissionId));
        if (decision.status !== "succeeded") return;
        const previousEvidence = await tx.select().from(learningEvidence).where(eq(learningEvidence.learnerId,owner));
        const objective = attempt.task.objectiveId;
        const prior = retentionProjection(previousEvidence.map(e=>e.payload),objective,now()).capability;
        const independent = demonstrates(saved.submission.frozen,decision); const evidenceId = randomUUID();
        const sequence = previousEvidence.reduce((n,e)=>Math.max(n,e.payload.sequence ?? 0),previousEvidence.length)+1;
        const payload: Evidence = {id:evidenceId,sequence,objectiveId:objective,attemptId:id,submissionId:saved.submission.id,assessmentId,type:saved.submission.frozen.assisted ? "assisted_application" : attempt.mode === "recall" ? "retention" : attempt.mode === "transfer" ? "transfer" : attempt.mode === "practice" ? "practice_application" : "independent_application",taskVersion:attempt.task.version,family:attempt.task.family,assisted:saved.submission.frozen.assisted,demonstrated:independent,criteria:decision.criteria,rubricVersion:decision.rubricVersion,policyVersion:decision.policyVersion,assessedAt:assessedAt.toISOString()};
        const branding = decision.criteria.find(c=>c.id === "C5" && c.result === "not_met" && c.reason === "branding_authenticates")?.citations.find(c=>["checklist","explanation"].includes(c.field));
        if (branding) payload.misconception = {field:branding.field,quote:branding.quote};
        await tx.insert(learningEvidence).values({id:evidenceId,learnerId:owner,enrollmentId:attempt.enrollmentId,submissionId:saved.submission.id,payload});
        const projection = retentionProjection([...previousEvidence.map(e=>e.payload),payload],objective,now());
        const {capability,recallDueAt:due,transferAvailable} = projection;
        const recallDueAt = due ? new Date(due) : null;
        await tx.insert(learningCapability).values({enrollmentId:attempt.enrollmentId,learnerId:owner,payload:capability,recallDueAt,transferAvailable}).onConflictDoUpdate({target:learningCapability.enrollmentId,set:{payload:capability,recallDueAt,transferAvailable}});
        await tx.insert(capabilityChange).values({evidenceId,before:prior,after:capability});
        const gap = decision.criteria.find(c=>c.result !== "met");
        const reason = gap ? `${gap.id}: ${gap.feedback}` : "Supported/practice evidence meets criteria. Try a fresh independent task without instructional help.";
        const budget = (await tx.select().from(previewEnrollment).where(eq(previewEnrollment.id,attempt.enrollmentId)))[0].preferences?.sessionMinutes ?? 20;
        const recommendation = retentionRecommendation(projection,objective,budget,reason);
        await tx.insert(learningNext).values({enrollmentId:attempt.enrollmentId,learnerId:owner,payload:recommendation}).onConflictDoUpdate({target:learningNext.enrollmentId,set:{payload:recommendation}});
      });
      return readAttempt(db,owner,id);
    },
    async review(owner,id) {
      await db.transaction(async tx=>{
        await lockAttempt(tx,owner,id);
        const saved = await readAttempt(tx,owner,id);
        if (!saved.submission?.assessments.length) throw new Error("ASSESSMENT_REQUIRED");
        await tx.insert(optionalReview).values({submissionId:saved.submission.id}).onConflictDoNothing();
      });
      return readAttempt(db,owner,id);
    },
  };
}
