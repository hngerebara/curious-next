import { integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import type { TutorPath } from "../contracts/tutor";
export const tutorPathTable = pgTable("tutor_path", { id: text("id").primaryKey(), learnerId: text("learner_id").notNull().references(() => user.id, { onDelete: "cascade" }), requestKey: text("request_key").notNull(), revision: integer("revision").notNull().default(0), snapshot: jsonb("snapshot").$type<TutorPath>().notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, table => [uniqueIndex("tutor_path_owner_request").on(table.learnerId, table.requestKey)]);
