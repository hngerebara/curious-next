import { integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { tutorPathTable } from "./tutor-schema";
import type { TutorSession } from "../contracts/tutor-lesson";
export const tutorSessionTable=pgTable("tutor_session",{id:text("id").primaryKey(),learnerId:text("learner_id").notNull().references(()=>user.id,{onDelete:"cascade"}),pathId:text("path_id").notNull().references(()=>tutorPathTable.id,{onDelete:"cascade"}),requestKey:text("request_key").notNull(),revision:integer("revision").notNull().default(0),snapshot:jsonb("snapshot").$type<TutorSession>().notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()},table=>[uniqueIndex("tutor_session_owner_key").on(table.learnerId,table.requestKey)]);

export const tutorLessonRequest=pgTable("tutor_lesson_request",{learnerId:text("learner_id").notNull().references(()=>user.id,{onDelete:"cascade"}),requestKey:text("request_key").notNull(),pathId:text("path_id").notNull(),moduleId:text("module_id").notNull(),sessionId:text("session_id").notNull().references(()=>tutorSessionTable.id,{onDelete:"cascade"})},table=>[primaryKey({columns:[table.learnerId,table.requestKey]})]);
