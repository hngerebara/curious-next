import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { localEmail } from "../src/adapters/local-email";
import { localEmailOrigin, localInboxRequest } from "../src/domain/local-email-policy";
import { emailDelivery } from "../src/bootstrap/email-delivery";
import { harness, post, receipt, cookies } from "./auth-harness";
import { makeAuth } from "../src/adapters/better-auth";
import { secret } from "./auth-harness";

const environment = { nodeEnv: "development", origin: "http://127.0.0.1:3000" };
const token = "a".repeat(43);
const link = `${environment.origin}/access/confirm?token=${token}`;
const directories: string[] = [];
afterEach(async () => { vi.unstubAllEnvs(); for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });
async function directory() { const value = await mkdtemp(join(tmpdir(), "cn-local-mail-")); directories.push(value); return value; }

describe("local email boundary", () => {
  it.each([{ nodeEnv: "production" }, { nodeEnv: "test" }, { origin: "https://preview.example.test" }, { origin: "http://localhost.evil.test" }, { vercel: "1" }, { netlify: "true" }, { aws: "function" }, { ci: "true" }])("rejects nonlocal deployment settings %j", override => {
    expect(() => localEmailOrigin({ ...environment, ...override })).toThrow("LOCAL_EMAIL_FORBIDDEN");
  });
  it("denies cross-site, wrong-host and non-GET inbox access", () => {
    for (const headers of [{ host: "evil.test" }, { host: "127.0.0.1:3000", "sec-fetch-site": "cross-site" }, { host: "127.0.0.1:3000", origin: "https://evil.test" }]) expect(() => localInboxRequest(new Request(environment.origin + "/dev/mail", { headers: Object.fromEntries(Object.entries(headers).filter((entry): entry is [string, string] => typeof entry[1] === "string")) }), environment)).toThrow();
    expect(() => localInboxRequest(new Request(environment.origin + "/dev/mail", { method: "POST", headers: { host: "127.0.0.1:3000" } }), environment)).toThrow();
    expect(() => localInboxRequest(new Request(environment.origin + "/dev/mail", { headers: { host: "127.0.0.1:3000", "sec-fetch-site": "none" } }), environment)).not.toThrow();
  });
  it("captures privately, drops expired links, and rejects unsafe destinations", async () => {
    const path = await directory(); let now = Date.now(); const mail = localEmail(environment, path, () => now);
    await mail.send("fictional@example.test", link); const messages = await mail.inbox();
    expect(messages).toHaveLength(1); expect(messages[0].link).toBe(link);
    expect((await stat(path)).mode & 0o777).toBe(0o700);
    expect((await stat(join(path, (await readdir(path))[0]))).mode & 0o777).toBe(0o600);
    await expect(mail.send("fictional@example.test", "https://evil.test/access/confirm?token=" + token)).rejects.toThrow("LOCAL_EMAIL_INVALID");
    now += 600001; expect(await Promise.all([mail.inbox(), mail.inbox()])).toEqual([[], []]); expect(await readdir(path)).toEqual([]);
  });
  it("rejects malformed message IDs instead of trusting file content", async () => {
    const path = await directory(); const mail = localEmail(environment, path); await mail.send("fictional@example.test", link);
    const file = join(path, (await readdir(path))[0]); const data = JSON.parse(await readFile(file, "utf8"));
    await writeFile(file, JSON.stringify({ ...data, id: "../outside" })); await expect(mail.inbox()).rejects.toThrow("LOCAL_EMAIL_INVALID");
  });
  it("does not silently use local mail when real delivery is unconfigured", () => {
    vi.stubEnv("EMAIL_DELIVERY", "resend"); vi.stubEnv("RESEND_API_KEY", ""); vi.stubEnv("EMAIL_FROM", "");
    expect(() => emailDelivery()).toThrow("ACCESS_NOT_CONFIGURED");
    vi.stubEnv("EMAIL_DELIVERY", "local"); vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("BETTER_AUTH_URL", environment.origin);
    expect(() => emailDelivery()).toThrow("LOCAL_EMAIL_FORBIDDEN");
  });
});

it("uses captured local links with real Better Auth confirmation and replay protection", { timeout: 15000 }, async () => {
  const path = await directory(); const h = await harness();
  try {
    // Existing harness policy is reused, with its send port replaced by local capture.
    const mail = localEmail({ ...environment, origin: "https://localhost:3000" }, path);
    const auth = makeAuth(h.db, "https://localhost:3000", secret, mail.send);
    const app = h.makeInstance(() => auth);
    await app.handle(post("request", { email: "fictional@example.test" }), "request");
    const captured = (await mail.inbox())[0];
    const { cookie, csrf } = await receipt(app, captured.link);
    expect(await app.learner(new Headers())).toBeNull();
    const verified = await app.handle(post("confirm", { csrf }, cookie), "confirm");
    expect((await app.learner(new Headers({ cookie: cookies(verified) })))?.email).toBe("fictional@example.test");
    const replay = await receipt(app, captured.link);
    expect((await app.handle(post("confirm", { csrf: replay.csrf }, replay.cookie), "confirm")).headers.get("location")).toContain("state=invalid");
  } finally { await h.close(); }
});
