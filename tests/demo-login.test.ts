import { expect, it, vi } from "vitest";
import { accessHttp } from "../src/application/access-http";
import { accessService } from "../src/application/access-service";
import { confirmationPort } from "../src/adapters/confirmation";
import type { AuthPort } from "../src/contracts/access";
import { demoLogin } from "../src/adapters/demo-login";
import { harness, origin, secret } from "./auth-harness";

it("creates a real shared session without email, rejects passwords and revokes logout", async () => {
  const test = await harness();
  try {
    const allow = vi.fn(async () => true);
    const login = demoLogin(test.db, origin, secret, "fictional-demo-password", { allow });
    expect(await login("wrong", "client")).toBeNull();
    expect(await login(undefined, "client")).toBeNull();
    const first = await login("fictional-demo-password", "client");
    expect(first?.learner.email).toBe("shared-demo@curiousnext.invalid");
    expect(first?.cookies.join(";")).toContain("HttpOnly");
    const second = await login("fictional-demo-password", "client");
    expect(second?.learner.id).toBe(first?.learner.id);
    expect(test.mail).toHaveLength(0);
    allow.mockResolvedValueOnce(false);
    expect(await login("fictional-demo-password", "client")).toBeNull();
    expect(allow).toHaveBeenCalledWith("demo:client", 5, 900);
    const cookie = first!.cookies.map(value => value.split(";")[0]).join("; ");
    const sessionRequest = () => new Request(`${origin}/api/access/session`, { headers: { cookie } });
    expect((await test.app.handle(sessionRequest(), "session")).status).toBe(200);
    await test.app.handle(new Request(`${origin}/api/access/logout`, { method: "POST", headers: { origin, cookie, "content-type": "application/json" }, body: "{}" }), "logout");
    expect((await test.app.handle(sessionRequest(), "session")).status).toBe(401);
  } finally { await test.close(); }
});

it("guards demo entry and disables email operations only while enabled", async () => {
  const auth: AuthPort = { request: vi.fn(), redeem: vi.fn(), session: vi.fn(), logout: vi.fn() };
  const demo = vi.fn(async (password: unknown) => password === "correct" ? { cookies: ["session=fictional; HttpOnly; Secure"] } : null);
  const deps = { auth, confirmation: confirmationPort(secret), records: { read: async () => null }, service: accessService(auth, { allow: async () => true }, { emit() {} }), origin, trustedProxy: false };
  const app = accessHttp({ ...deps, demo });
  const request = (operation: string, password = "correct", source = origin) => new Request(`${origin}/api/access/${operation}`, { method: "POST", headers: { origin: source, "content-type": "application/json" }, body: JSON.stringify({ password }) });
  expect((await app.handle(request("demo", "correct", "https://untrusted.test"), "demo")).status).toBe(403);
  expect(demo).not.toHaveBeenCalled();
  expect((await app.handle(request("demo", "wrong"), "demo")).status).toBe(401);
  const result = await app.handle(request("demo"), "demo");
  expect(result.status).toBe(303);
  expect(result.headers.get("location")).toBe(`${origin}/onboarding`);
  expect(result.headers.get("set-cookie")).toContain("HttpOnly");
  expect((await app.handle(request("request"), "request")).status).toBe(404);
  expect((await app.handle(request("confirm"), "confirm")).status).toBe(404);
  expect((await accessHttp(deps).handle(request("demo"), "demo")).status).toBe(404);
});
