import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { makeAuth } from "../src/adapters/better-auth";
import { confirmationPort } from "../src/adapters/confirmation";
import { repositories } from "../src/adapters/access-repositories";
import { accessService } from "../src/application/access-service";
import { accessHttp } from "../src/application/access-http";
import * as schema from "../src/adapters/auth-schema";
import type { AuthPort } from "../src/contracts/access";

export const origin = "https://curiousnext.test";
export const secret = "synthetic-test-secret-with-at-least-32-characters";
export async function harness() {
  const sql = new PGlite();
  await sql.exec(await readFile(new URL("../migrations/0001-access.sql", import.meta.url), "utf8"));
  const db = drizzle(sql, { schema });
  const mail: { email: string; link: string }[] = [];
  const outcomes: { event: string; outcome: string }[] = [];
  let failMail = false;
  const makeInstance = (override: (auth: AuthPort) => AuthPort = (auth) => auth) => {
    const auth = override(makeAuth(db, origin, secret, async (email, link) => {
      if (failMail) throw new Error("SIMULATED_EMAIL_FAILURE");
      mail.push({ email, link });
    }));
    const { abuse, records } = repositories(db, secret);
    const confirmation = confirmationPort(secret);
    const events = { emit(event: string, outcome: string) { outcomes.push({ event, outcome }); } };
    return accessHttp({ auth, confirmation, records, service: accessService(auth, abuse, events), origin, trustedProxy: true });
  };
  return { sql, db, mail, outcomes, app: makeInstance(), makeInstance, failMail: () => { failMail = true; }, close: () => sql.close() };
}
export function post(operation: string, body: object, cookie = "", ip = "192.0.2.1", requestOrigin = origin) {
  return new Request(`${origin}/api/access/${operation}`, {
    method: "POST", headers: { origin: requestOrigin, cookie, "content-type": "application/json", "x-vercel-forwarded-for": ip }, body: JSON.stringify(body),
  });
}
export function cookies(response: Response) {
  return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}
export async function receipt(app: ReturnType<Awaited<ReturnType<typeof harness>>["makeInstance"]>, link: string) {
  const scan = await app.scan(new Request(link));
  const cookie = cookies(scan);
  const context = app.context(new Request(`${origin}/access/confirm/ready`, { headers: { cookie } }));
  if (!context) throw new Error("TEST_CONTEXT_MISSING");
  return { cookie, csrf: context.csrf, scan };
}
