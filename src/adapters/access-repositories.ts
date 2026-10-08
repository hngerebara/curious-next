import { and, eq, sql } from "drizzle-orm";
import { createHmac } from "node:crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { AbusePort, OwnedRecordPort } from "../contracts/access";
import * as schema from "./auth-schema";

export type AccessDatabase = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

export function repositories(db: AccessDatabase, secret: string): { abuse: AbusePort; records: OwnedRecordPort } {
  return {
    abuse: {
      async allow(rawKey, limit, seconds) {
        const key = createHmac("sha256", secret).update(rawKey).digest("hex");
        const rows = await db.insert(schema.abuseWindow).values({ key, count: 1, expiresAt: sql`now() + ${seconds} * interval '1 second'` })
          .onConflictDoUpdate({ target: schema.abuseWindow.key, set: {
            count: sql`case when ${schema.abuseWindow.expiresAt} <= now() then 1 else ${schema.abuseWindow.count} + 1 end`,
            expiresAt: sql`case when ${schema.abuseWindow.expiresAt} <= now() then now() + ${seconds} * interval '1 second' else ${schema.abuseWindow.expiresAt} end`,
          } }).returning();
        return rows[0].count <= limit;
      },
    },
    records: {
      async read(id, learnerId) {
        const rows = await db.select({ id: schema.proofRecord.id, label: schema.proofRecord.label }).from(schema.proofRecord)
          .where(and(eq(schema.proofRecord.id, id), eq(schema.proofRecord.learnerId, learnerId)));
        return rows[0] ?? null;
      },
    },
  };
}
