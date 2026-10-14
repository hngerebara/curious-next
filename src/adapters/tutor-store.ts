import { and, desc, eq, sql } from "drizzle-orm";
import type { AccessDatabase } from "./access-repositories";
import type { TutorStore } from "../contracts/tutor";
import { tutorCanonical } from "../domain/tutor-policy";
import { tutorPathTable } from "./tutor-schema";
export function tutorStore(db: AccessDatabase): TutorStore {
  return {
    async list(owner) { return (await db.select().from(tutorPathTable).where(eq(tutorPathTable.learnerId,owner)).orderBy(desc(tutorPathTable.createdAt),desc(tutorPathTable.id))).map(row => row.snapshot); },
    async read(owner,id) { const [row] = await db.select().from(tutorPathTable).where(and(eq(tutorPathTable.learnerId,owner),eq(tutorPathTable.id,id))); return row?.snapshot ?? null; },
    async create(owner,path) {
      await db.insert(tutorPathTable).values({id:path.id,learnerId:owner,requestKey:path.requestKey,snapshot:path}).onConflictDoNothing();
      const [row] = await db.select().from(tutorPathTable).where(and(eq(tutorPathTable.learnerId,owner),eq(tutorPathTable.requestKey,path.requestKey)));
      if (!row || tutorCanonical(row.snapshot.goal) !== tutorCanonical(path.goal)) throw Error("REQUEST_CONFLICT");
      return row.snapshot;
    },
    async change(owner,id,update) {
      return db.transaction(async tx => {
        await tx.execute(sql`select id from ${tutorPathTable} where id = ${id} and learner_id = ${owner} for update`);
        const [row] = await tx.select().from(tutorPathTable).where(and(eq(tutorPathTable.learnerId,owner),eq(tutorPathTable.id,id)));
        if (!row) throw Error("NOT_FOUND");
        const next = update(row.snapshot);
        if (next === row.snapshot) return next;
        const saved = {...next,revision:row.revision+1};
        await tx.update(tutorPathTable).set({snapshot:saved,revision:saved.revision}).where(and(eq(tutorPathTable.learnerId,owner),eq(tutorPathTable.id,id)));
        return saved;
      });
    }
  };
}
