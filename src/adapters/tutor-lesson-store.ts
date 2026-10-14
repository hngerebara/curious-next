import { and, desc, eq, sql } from "drizzle-orm";
import type { AccessDatabase } from "./access-repositories";
import type { TutorLessonStore } from "../contracts/tutor-lesson";
import { tutorSessionTable, tutorLessonRequest } from "./tutor-lesson-schema";
import { user } from "./auth-schema";
import { tutorPathTable } from "./tutor-schema";
export function tutorLessonStore(db:AccessDatabase):TutorLessonStore {
  return {
    async list(owner,pathId){return (await db.select().from(tutorSessionTable).where(and(eq(tutorSessionTable.learnerId,owner),eq(tutorSessionTable.pathId,pathId))).orderBy(desc(tutorSessionTable.createdAt),desc(tutorSessionTable.id))).map(r=>r.snapshot);},
    async read(owner,id){const [row]=await db.select().from(tutorSessionTable).where(and(eq(tutorSessionTable.learnerId,owner),eq(tutorSessionTable.id,id)));return row?.snapshot ?? null;},
    async create(owner,session){return db.transaction(async tx=>{
      await tx.execute(sql`select id from ${user} where id = ${owner} for update`);
      const [parent]=await tx.select().from(tutorPathTable).where(and(eq(tutorPathTable.learnerId,owner),eq(tutorPathTable.id,session.pathId)));if(!parent)throw Error("NOT_FOUND");
      const [request]=await tx.select().from(tutorLessonRequest).where(and(eq(tutorLessonRequest.learnerId,owner),eq(tutorLessonRequest.requestKey,session.requestKey)));
      if(request){if(request.pathId!==session.pathId || request.moduleId!==session.module.id)throw Error("REQUEST_CONFLICT");const [row]=await tx.select().from(tutorSessionTable).where(and(eq(tutorSessionTable.learnerId,owner),eq(tutorSessionTable.id,request.sessionId)));if(!row)throw Error("NOT_FOUND");if(row.snapshot.previousSessionId!==session.previousSessionId)throw Error("REQUEST_CONFLICT");return row.snapshot;}
      const cachedRows=session.previousSessionId?[]:await tx.select().from(tutorSessionTable).where(and(eq(tutorSessionTable.learnerId,owner),eq(tutorSessionTable.pathId,session.pathId),sql`${tutorSessionTable.snapshot}->'module'->>'id' = ${session.module.id}`,sql`(${tutorSessionTable.snapshot}->>'state' = 'ready' or (${tutorSessionTable.snapshot}->>'state' = 'generating' and ${tutorSessionTable.snapshot}->>'configuration' = ${session.configuration}))`)).orderBy(desc(tutorSessionTable.createdAt)).limit(1);
      const cached=cachedRows[0];
      if(!cached)await tx.insert(tutorSessionTable).values({id:session.id,learnerId:owner,pathId:session.pathId,requestKey:session.requestKey,snapshot:session});
      const saved=cached?.snapshot ?? session;
      await tx.insert(tutorLessonRequest).values({learnerId:owner,requestKey:session.requestKey,pathId:session.pathId,moduleId:session.module.id,sessionId:saved.id});return saved;
    });},
    async change(owner,id,update){return db.transaction(async tx=>{
      await tx.execute(sql`select id from ${tutorSessionTable} where id = ${id} and learner_id = ${owner} for update`);
      const [row]=await tx.select().from(tutorSessionTable).where(and(eq(tutorSessionTable.learnerId,owner),eq(tutorSessionTable.id,id)));if(!row)throw Error("NOT_FOUND");
      const next=update(row.snapshot);if(next===row.snapshot)return next;const saved={...next,revision:row.revision+1};
      await tx.update(tutorSessionTable).set({snapshot:saved,revision:saved.revision}).where(and(eq(tutorSessionTable.learnerId,owner),eq(tutorSessionTable.id,id)));return saved;
    }).catch((error:unknown)=>{const cause=error instanceof Error && "cause" in error?error.cause:error;if(cause && typeof cause==="object" && "code" in cause && cause.code==="23505")throw Error("REQUEST_CONFLICT");throw error;});}
  };
}
