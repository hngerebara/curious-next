import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./auth-schema";

export function postgres(connectionString: string) {
  const pool = new Pool({ connectionString, max: 3, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, statement_timeout: 10000, query_timeout: 12000 });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}
