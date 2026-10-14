import { createHash, timingSafeEqual } from "node:crypto";
import type { AbusePort } from "../contracts/access";
import { makeAuth } from "./better-auth";
import type { AuthDatabase } from "./better-auth";

export function demoLogin(db: AuthDatabase, origin: string, secret: string, password: string, abuse: AbusePort) {
  if (password.length < 16) throw new Error("DEMO_PASSWORD_REQUIRED");
  const expected = createHash("sha256").update(password).digest();
  return async (provided: unknown, client: string) => {
    if (!await abuse.allow(`demo:${client}`, 5, 900)) return null;
    if (typeof provided !== "string" || !timingSafeEqual(createHash("sha256").update(provided).digest(), expected)) return null;
    let token: string | null = null;
    const login = makeAuth(db, origin, secret, async (_email, link) => { token = new URL(link).searchParams.get("token"); });
    await login.request("shared-demo@curiousnext.invalid");
    return token ? login.redeem(token) : null;
  };
}
