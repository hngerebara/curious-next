import { pgTable, text, integer, boolean, timestamp, jsonb, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { previewEnrollment } from "./course-schema";
import type { AttemptMode, Task, Draft, Variant, Frozen, Decision, Evidence, Capability, LearningRecommendation } from "../contracts/attempt";

export const learningAttempt = pgTable("learning_attempt", {
  id: text("id").primaryKey(), learnerId: text("learner_id").notNull().references(()=>user.id,{onDelete:"cascade"}), enrollmentId: text("enrollment_id").notNull().references(()=>previewEnrollment.id,{onDelete:"cascade"}),
  requestKey: text("request_key").notNull(), mode: text("mode").$type<AttemptMode>().notNull(), task: jsonb("task").$type<Task>().notNull(), draft: jsonb("draft").$type<Draft>().notNull(), revision: integer("revision").notNull().default(0), assisted: boolean("assisted").notNull().default(false), variant: jsonb("variant").$type<Variant>().notNull(), createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull(),
},t=>[uniqueIndex("attempt_owner_key").on(t.learnerId,t.requestKey)]);
export const draftRevision = pgTable("attempt_draft_revision", {
  attemptId: text("attempt_id").notNull().references(()=>learningAttempt.id,{onDelete:"cascade"}), revision: integer("revision").notNull(), draft: jsonb("draft").$type<Draft>().notNull(), createdAt: timestamp("created_at",{withTimezone:true}).defaultNow().notNull(),
},t=>[primaryKey({columns:[t.attemptId,t.revision]})]);
export const lessonVariant = pgTable("attempt_lesson_variant", {
  id: text("id").primaryKey(), attemptId: text("attempt_id").notNull().references(()=>learningAttempt.id,{onDelete:"cascade"}), level: text("level").notNull(), payload: jsonb("payload").$type<Variant>().notNull(),
},t=>[uniqueIndex("variant_attempt_level").on(t.attemptId,t.level)]);
export const practiceRequest = pgTable("practice_request", {
  id:text("id").primaryKey(), learnerId:text("learner_id").notNull().references(()=>user.id,{onDelete:"cascade"}), attemptId:text("attempt_id").notNull().references(()=>learningAttempt.id,{onDelete:"cascade"}), key:text("request_key").notNull(), sequence:integer("sequence").notNull(), revision:integer("revision").notNull(), prompt:text("prompt").notNull(), response:text("response"), state:text("state").notNull(), code:text("code"), configuration:text("configuration").notNull(), calls:integer("calls").notNull().default(0), lease:text("lease"), leaseUntil:timestamp("lease_until",{withTimezone:true}),
},t=>[uniqueIndex("practice_owner_key").on(t.learnerId,t.key),uniqueIndex("practice_sequence").on(t.attemptId,t.sequence)]);
export const assistanceEvent = pgTable("attempt_assistance", {
  id:text("id").primaryKey(), learnerId:text("learner_id").notNull().references(()=>user.id,{onDelete:"cascade"}), attemptId:text("attempt_id").notNull().references(()=>learningAttempt.id,{onDelete:"cascade"}), key:text("request_key").notNull(), kind:text("kind").$type<"hint" | "worked_solution">().notNull(), content:text("content").notNull(), deliveredAt:timestamp("delivered_at",{withTimezone:true}).defaultNow().notNull(),
},t=>[uniqueIndex("help_owner_key").on(t.learnerId,t.key)]);
export const attemptSubmission = pgTable("attempt_submission", {
  id:text("id").primaryKey(), learnerId:text("learner_id").notNull().references(()=>user.id,{onDelete:"cascade"}), attemptId:text("attempt_id").notNull().unique().references(()=>learningAttempt.id,{onDelete:"cascade"}), key:text("request_key").notNull(), revision:integer("revision").notNull(), hash:text("hash").notNull(), frozen:jsonb("frozen").$type<Frozen>().notNull(), submittedAt:timestamp("submitted_at",{withTimezone:true}).defaultNow().notNull(),
},t=>[uniqueIndex("submission_owner_key").on(t.learnerId,t.key)]);
export const assessmentJob = pgTable("assessment_job", {
  submissionId:text("submission_id").primaryKey().references(()=>attemptSubmission.id,{onDelete:"cascade"}), state:text("state").notNull().default("pending"), claims:integer("claims").notNull().default(0), lease:text("lease"), leaseUntil:timestamp("lease_until",{withTimezone:true}), configuration:text("configuration"),
});
export const assessmentRun = pgTable("assessment_run", {
  id:text("id").primaryKey(), submissionId:text("submission_id").notNull().references(()=>attemptSubmission.id,{onDelete:"cascade"}), claim:integer("claim").notNull(), decision:jsonb("decision").$type<Decision>().notNull(), configuration:text("configuration").notNull(), assessedAt:timestamp("assessed_at",{withTimezone:true}).defaultNow().notNull(),
},t=>[uniqueIndex("assessment_submission_claim").on(t.submissionId,t.claim)]);
export const learningEvidence = pgTable("learning_evidence", {
  id:text("id").primaryKey(), learnerId:text("learner_id").notNull().references(()=>user.id,{onDelete:"cascade"}), enrollmentId:text("enrollment_id").notNull().references(()=>previewEnrollment.id,{onDelete:"cascade"}), submissionId:text("submission_id").notNull().unique().references(()=>attemptSubmission.id,{onDelete:"cascade"}), payload:jsonb("payload").$type<Evidence>().notNull(),
});
export const learningCapability = pgTable("learning_capability", {
  enrollmentId:text("enrollment_id").primaryKey().references(()=>previewEnrollment.id,{onDelete:"cascade"}), learnerId:text("learner_id").notNull().references(()=>user.id,{onDelete:"cascade"}), payload:jsonb("payload").$type<Capability>().notNull(), recallDueAt:timestamp("recall_due_at",{withTimezone:true}), transferAvailable:boolean("transfer_available").notNull().default(false),
});
export const capabilityChange = pgTable("learning_capability_change", {
  evidenceId:text("evidence_id").primaryKey().references(()=>learningEvidence.id,{onDelete:"cascade"}), before:jsonb("before_state").$type<Capability>().notNull(), after:jsonb("after_state").$type<Capability>().notNull(),
});
export const learningNext = pgTable("learning_next", {
  enrollmentId:text("enrollment_id").primaryKey().references(()=>previewEnrollment.id,{onDelete:"cascade"}), learnerId:text("learner_id").notNull().references(()=>user.id,{onDelete:"cascade"}), payload:jsonb("payload").$type<LearningRecommendation>().notNull(),
});
export const optionalReview = pgTable("attempt_optional_review", {
  submissionId:text("submission_id").primaryKey().references(()=>attemptSubmission.id,{onDelete:"cascade"}), requestedAt:timestamp("requested_at",{withTimezone:true}).defaultNow().notNull(),
});
