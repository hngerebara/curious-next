// Explicit local setup only. Application startup never applies migrations.
import pg from "pg";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const files = ["0001-access.sql", "0002-course-plans.sql", "0003-enrollment-preferences.sql", "0004-attempt-loop.sql", "0005-retention-modes.sql"];
let pool;
try {
  const origin = new URL(process.env.BETTER_AUTH_URL ?? "invalid:");
  if (process.env.EMAIL_DELIVERY !== "local" || process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.CI || !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) throw new Error("LOCAL_SETUP_REQUIRED");
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_NOT_CONFIGURED");
  pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("select pg_advisory_xact_lock(731820941)");
    const existing = await client.query("select table_name from information_schema.tables where table_schema = 'public'");
    const hasLedger = existing.rows.some(row => row.table_name === "cn_schema_migration");
    if (existing.rows.length && !hasLedger) throw new Error("EXISTING_SCHEMA_REQUIRES_REVIEW");
    await client.query("create table if not exists cn_schema_migration (name text primary key, checksum text not null, applied_at timestamptz not null default now())");
    const applied = [];
    for (const name of files) {
      const text = await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8");
      const checksum = createHash("sha256").update(text).digest("hex");
      const found = await client.query("select checksum from cn_schema_migration where name = $1", [name]);
      if (found.rows.length) { if (found.rows[0].checksum !== checksum) throw new Error("MIGRATION_CHANGED"); continue; }
      await client.query(text);
      await client.query("insert into cn_schema_migration(name, checksum) values ($1, $2)", [name, checksum]);
      applied.push(name);
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({ status: "ready", applied }));
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
} catch (error) {
  const allowed = ["LOCAL_SETUP_REQUIRED", "DATABASE_NOT_CONFIGURED", "EXISTING_SCHEMA_REQUIRES_REVIEW", "MIGRATION_CHANGED"];
  console.error(JSON.stringify({ status: "failed", code: allowed.includes(error.message) ? error.message : "DATABASE_SETUP_FAILED" }));
  process.exitCode = 1;
} finally { if (pool) await pool.end(); }
