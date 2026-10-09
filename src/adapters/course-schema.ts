import { pgTable, text, timestamp, integer, jsonb, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import type { GoalInput, GenerationResult, Enrollment } from "../contracts/course-plan";

export const learnerGoal = pgTable("learner_goal", {
  id: text("id").primaryKey(), learnerId: text("learner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  version: integer("version").notNull(), input: jsonb("input").$type<GoalInput>().notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("learner_goal_owner_version").on(t.learnerId, t.version)]);
export const coursePlan = pgTable("course_plan", {
  id: text("id").primaryKey(), learnerId: text("learner_id").notNull().references(() => user.id, { onDelete: "cascade" }), goalId: text("goal_id").notNull().references(() => learnerGoal.id, { onDelete: "cascade" }),
  requestKey: text("request_key").notNull(), catalogueVersion: text("catalogue_version").notNull(), configuration: text("configuration").notNull(), state: text("state").notNull(), result: jsonb("result").$type<GenerationResult>(),
  attempts: integer("attempts").notNull().default(0), lease: text("lease"), leaseUntil: timestamp("lease_until", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("course_plan_owner_key").on(t.learnerId, t.requestKey)]);
export const previewEnrollment = pgTable("preview_enrollment", {
  id: text("id").primaryKey(), learnerId: text("learner_id").notNull().references(() => user.id, { onDelete: "cascade" }), planId: text("plan_id").notNull().unique().references(() => coursePlan.id, { onDelete: "cascade" }),
  placement: jsonb("placement").$type<Enrollment["placement"]>(), startObjectiveId: text("start_objective_id"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const enrollmentRequest = pgTable("enrollment_request", {
  learnerId: text("learner_id").notNull().references(() => user.id, { onDelete: "cascade" }), requestKey: text("request_key").notNull(), planId: text("plan_id").notNull().references(() => coursePlan.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.learnerId, t.requestKey] })]);
