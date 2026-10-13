import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AccessDatabase } from "./access-repositories";
import type { AttemptStore } from "../contracts/attempt";
import { practiceRequest } from "./attempt-schema";
import { ensureDraft, lockAttempt, readAttempt, practiceRecord } from "./attempt-records";

export function practiceStore(db: AccessDatabase): Pick<AttemptStore,"reservePractice" | "finishPractice"> {
  return {
    async reservePractice(owner,id,key,revision,configuration) {
      const claim = await db.transaction(async tx=>{
        const row = await lockAttempt(tx,owner,id);
        if (row.task.objectiveId === "CY-2") throw new Error("ACTIVITY_NOT_AVAILABLE");
        const [prior] = await tx.select().from(practiceRequest).where(and(eq(practiceRequest.learnerId,owner),eq(practiceRequest.key,key)));
        if (prior && (prior.attemptId !== id || prior.revision !== revision)) throw new Error("REQUEST_CONFLICT");
        if (prior?.state === "succeeded") return {request:practiceRecord(prior),lease:null};
        await ensureDraft(tx,id);
        if (prior && prior.configuration !== configuration) throw new Error("CONFIGURATION_CHANGED");
        await tx.update(practiceRequest).set({state:"failed",code:"GENERATION_INTERRUPTED",lease:null,leaseUntil:null}).where(and(eq(practiceRequest.attemptId,id),eq(practiceRequest.state,"pending"),sql`${practiceRequest.leaseUntil} <= now()`));
        const history = await tx.select().from(practiceRequest).where(eq(practiceRequest.attemptId,id));
        if (history.some(r=>r.state === "pending")) {
          const existing = history.find(r=>r.key === key);
          if (existing) return {request:practiceRecord(existing),lease:null};
          throw new Error("GENERATION_PENDING");
        }
        if (!prior && (row.revision !== revision || !row.draft.prompt.trim())) throw new Error("DRAFT_CONFLICT");
        if (!prior && history.length >= 12) throw new Error("PRACTICE_LIMIT");
        const existing = history.find(r=>r.key === key);
        if (existing && existing.calls >= 3) return {request:practiceRecord(existing),lease:null};
        const lease = randomUUID();
        if (existing) {
          const [claimed] = await tx.update(practiceRequest).set({state:"pending",code:null,lease,leaseUntil:sql`now() + interval '45 seconds'`,calls:existing.calls+1}).where(eq(practiceRequest.id,existing.id)).returning();
          return {request:practiceRecord(claimed),lease};
        }
        const [claimed] = await tx.insert(practiceRequest).values({id:randomUUID(),learnerId:owner,attemptId:id,key,sequence:history.length+1,revision,prompt:row.draft.prompt,state:"pending",configuration,calls:1,lease,leaseUntil:sql`now() + interval '45 seconds'`}).returning();
        return {request:practiceRecord(claimed),lease};
      });
      return {...claim,attempt:await readAttempt(db,owner,id)};
    },
    async finishPractice(owner,id,requestId,lease,response,code) {
      await db.transaction(async tx=>{
        await lockAttempt(tx,owner,id);
        await ensureDraft(tx,id);
        await tx.update(practiceRequest).set({response,code,state:response === null ? "failed" : "succeeded",lease:null,leaseUntil:null}).where(and(eq(practiceRequest.id,requestId),eq(practiceRequest.attemptId,id),eq(practiceRequest.learnerId,owner),eq(practiceRequest.lease,lease),sql`${practiceRequest.leaseUntil} > now()`));
      });
      return readAttempt(db,owner,id);
    },
  };
}
