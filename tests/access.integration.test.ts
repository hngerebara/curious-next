import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { harness, origin, post, receipt, cookies, secret } from "./auth-harness";
import { confirmationPort } from "../src/adapters/confirmation";
import * as schema from "../src/adapters/auth-schema";

describe("magic-link boundary with real Better Auth and PostgreSQL schema", () => {
  let test: Awaited<ReturnType<typeof harness>>;
  beforeEach(async () => { test = await harness(); });
  afterEach(async () => { await test.close(); });

  async function issue(email = "learner@example.test", ip = "192.0.2.1") {
    expect((await test.app.handle(post("request", { email }, "", ip), "request")).status).toBe(202);
    return test.mail.at(-1)!.link;
  }
  async function verify(link: string, app = test.app, ip = "192.0.2.1") {
    const { cookie, csrf } = await receipt(app, link);
    return app.handle(post("confirm", { csrf }, cookie, ip), "confirm");
  }
  async function session(cookie: string, app = test.app) {
    return app.handle(new Request(`${origin}/api/access/session`, { headers: { cookie } }), "session");
  }

  it("stores hashed tokens and repeated GET scans create no account or session", async () => {
    const link = await issue();
    const raw = new URL(link).searchParams.get("token")!;
    const rows = await test.db.select().from(schema.verification);
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(raw);
    const first = await receipt(test.app, link);
    await receipt(test.app, link);
    expect(first.scan.headers.get("location")).toBe(`${origin}/access/confirm/ready`);
    expect(first.scan.headers.get("referrer-policy")).toBe("no-referrer");
    expect(first.scan.headers.get("cache-control")).toBe("no-store");
    expect(first.cookie).not.toContain(raw);
    expect(first.scan.headers.get("set-cookie")).toContain("HttpOnly");
    expect(first.scan.headers.get("set-cookie")).toContain("Secure");
    expect(await test.db.select().from(schema.user)).toHaveLength(0);
    expect(await test.db.select().from(schema.session)).toHaveLength(0);
    expect(await test.db.select().from(schema.verification)).toHaveLength(1);
  });

  it("verifies on a different device, creates one account, and rejects replay", async () => {
    const link = await issue();
    const verified = await verify(link, test.makeInstance(), "192.0.2.2");
    expect(verified.headers.get("location")).toBe(`${origin}/access/verified`);
    expect(verified.headers.get("set-cookie")).toContain("HttpOnly");
    expect(verified.headers.get("set-cookie")).toContain("Secure");
    expect(verified.headers.get("set-cookie")).toContain("SameSite=Lax");
    expect((await session(cookies(verified))).status).toBe(200);
    expect(await test.db.select().from(schema.user)).toHaveLength(1);
    const replay = await verify(link);
    expect(replay.headers.get("location")).toBe(`${origin}/access?state=invalid`);
    expect(await test.db.select().from(schema.session)).toHaveLength(1);
  });

  it("permits exactly one concurrent redemption across two library instances", async () => {
    const link = await issue();
    const other = test.makeInstance();
    const first = await receipt(test.app, link);
    const second = await receipt(other, link);
    const results = await Promise.all([
      test.app.handle(post("confirm", { csrf: first.csrf }, first.cookie), "confirm"),
      other.handle(post("confirm", { csrf: second.csrf }, second.cookie, "192.0.2.2"), "confirm"),
    ]);
    expect(results.filter((response) => response.headers.get("location") === `${origin}/access/verified`)).toHaveLength(1);
    expect(await test.db.select().from(schema.session)).toHaveLength(1);
    expect(await test.db.select().from(schema.user)).toHaveLength(1);
  });

  it("rejects expired database tokens without creating an account", async () => {
    const link = await issue();
    await test.db.update(schema.verification).set({ expiresAt: new Date(Date.now() - 1000) });
    expect((await verify(link)).headers.get("location")).toBe(`${origin}/access?state=invalid`);
    expect(await test.db.select().from(schema.user)).toHaveLength(0);
  });

  it("rejects cross-origin mutations, forged and expired confirmation contexts", async () => {
    const link = await issue();
    const { csrf, cookie } = await receipt(test.app, link);
    expect((await test.app.handle(post("confirm", { csrf }, cookie, "192.0.2.1", "https://attacker.test"), "confirm")).status).toBe(403);
    expect((await test.app.handle(post("confirm", { csrf: "wrong" }, cookie), "confirm")).headers.get("location")).toContain("state=invalid");
    expect(confirmationPort("a-different-32-character-secret-value").read(cookie.split("=")[1])).toBeNull();
    const old = confirmationPort(secret, () => Date.now() - 700000).create(new URL(link).searchParams.get("token")!);
    expect(confirmationPort(secret).read(old.value)).toBeNull();
    expect(await test.db.select().from(schema.user)).toHaveLength(0);
  });

  it("returns the same acknowledgement for existing and new learners", async () => {
    await verify(await issue());
    await test.db.delete(schema.abuseWindow);
    const existing = await test.app.handle(post("request", { email: "learner@example.test" }), "request");
    const fresh = await test.app.handle(post("request", { email: "new@example.test" }, "", "192.0.2.2"), "request");
    expect(existing.status).toBe(fresh.status);
    expect((await existing.json()).data).toEqual((await fresh.json()).data);
    expect(await test.db.select().from(schema.user)).toHaveLength(1);
  });

  it("shares email cooldown across instances and stores no email in limit keys", async () => {
    await issue();
    const response = await test.makeInstance().handle(post("request", { email: "learner@example.test" }), "request");
    expect(response.status).toBe(429);
    expect(test.mail).toHaveLength(1);
    expect(JSON.stringify(await test.db.select().from(schema.abuseWindow))).not.toContain("learner@example.test");
  });

  it("limits concurrent requests across instances and resets expired windows", async () => {
    const responses = await Promise.all(Array.from({ length: 12 }, (_, i) =>
      test.makeInstance().handle(post("request", { email: `learner-${i}@example.test` }), "request")));
    expect(responses.filter((response) => response.status === 202)).toHaveLength(10);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(2);
    await test.db.update(schema.abuseWindow).set({ expiresAt: sql`now() - interval '1 second'` });
    expect((await test.app.handle(post("request", { email: "learner-0@example.test" }), "request")).status).toBe(202);
  });

  it("keeps confirmation context for retries during service failures", async () => {
    const link = await issue();
    const unavailable = test.makeInstance((auth) => ({ ...auth, redeem: async () => { throw new Error("SIMULATED_OUTAGE"); } }));
    const pending = await receipt(unavailable, link);
    const response = await unavailable.handle(post("confirm", { csrf: pending.csrf }, pending.cookie), "confirm");
    expect(response.headers.get("location")).toBe(`${origin}/access/confirm/ready?state=unavailable`);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await test.db.select().from(schema.user)).toHaveLength(0);
    expect((await test.app.handle(post("confirm", { csrf: pending.csrf }, pending.cookie), "confirm")).headers.get("location")).toBe(`${origin}/access/verified`);
  });

  it("keeps unused links when confirmation abuse limits are reached", async () => {
    const link = await issue();
    const { cookie, csrf } = await receipt(test.app, link);
    for (let i = 0; i < 30; i++) {
      await test.app.handle(post("confirm", { csrf }, cookie), "confirm");
    }
    const fresh = await issue("fresh@example.test", "192.0.2.2");
    const pending = await receipt(test.app, fresh);
    const response = await test.app.handle(post("confirm", { csrf: pending.csrf }, pending.cookie), "confirm");
    expect(response.headers.get("location")).toBe(`${origin}/access/confirm/ready?state=limited`);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect((await verify(fresh, test.app, "192.0.2.2")).headers.get("location")).toBe(`${origin}/access/verified`);
  });

  it("rejects malformed bodies, oversized streams, external destinations and unsupported routes", async () => {
    expect((await test.app.handle(post("request", { email: "not-an-email" }), "request")).status).toBe(400);
    expect((await test.app.handle(post("request", { email: "a@example.test", destination: "https://attacker.test" }), "request")).status).toBe(400);
    expect((await test.app.handle(post("request", { email: "a".repeat(5000) }), "request")).status).toBe(413);
    expect((await test.app.handle(new Request(`${origin}/api/access/confirm`), "confirm")).status).toBe(404);
    expect((await test.app.handle(post("magic-link/verify", {}), "magic-link/verify")).status).toBe(404);
    expect(test.mail).toHaveLength(0);
  });

  it("revokes sessions on logout and denies missing or expired sessions", async () => {
    const cookie = cookies(await verify(await issue()));
    expect((await session("")).status).toBe(401);
    expect((await session(cookie)).status).toBe(200);
    const loggedOut = await test.app.handle(post("logout", {}, cookie), "logout");
    expect(loggedOut.status).toBe(303);
    expect((await session(cookie)).status).toBe(401);
    expect(loggedOut.headers.get("set-cookie")).toContain("Max-Age=0");
    expect((await test.app.handle(post("logout", {}, cookie), "logout")).status).toBe(303);
    await test.db.delete(schema.abuseWindow);
    const again = cookies(await verify(await issue()));
    await test.db.update(schema.session).set({ expiresAt: new Date(Date.now() - 1000) });
    expect((await session(again)).status).toBe(401);
  });

  it("enforces owner filtering even when another learner knows the record ID", async () => {
    const a = cookies(await verify(await issue()));
    const b = cookies(await verify(await issue("second@example.test", "192.0.2.2")));
    const learner = (await (await session(a)).json()).data;
    await test.db.insert(schema.proofRecord).values({ id: "known-id", learnerId: learner.id, label: "Synthetic private record" });
    const read = (cookie: string) => test.app.handle(new Request(`${origin}/api/access/record?id=known-id`, { headers: { cookie } }), "record");
    expect((await read(a)).status).toBe(200);
    expect((await read(b)).status).toBe(404);
  });

  it("preserves failure status and logs only outcome codes when email delivery fails", async () => {
    test.failMail();
    const response = await test.app.handle(post("request", { email: "failed@example.test" }), "request");
    expect(response.status).toBe(503);
    expect(await test.db.select().from(schema.user)).toHaveLength(0);
    expect(JSON.stringify(test.outcomes)).not.toContain("failed@example.test");
    expect(test.outcomes).toContainEqual({ event: "access_request", outcome: "delivery_unavailable" });
  });
});
