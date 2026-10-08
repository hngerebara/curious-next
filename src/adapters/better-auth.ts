import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { randomBytes } from "node:crypto";
import type { AuthPort } from "../contracts/access";
import { accessPolicy } from "../domain/access-policy";
import * as schema from "./auth-schema";

export type AuthDatabase = Parameters<typeof drizzleAdapter>[0];
export type EmailSender = (email: string, link: string) => Promise<void>;

export function makeAuth(db: AuthDatabase, origin: string, secret: string, send: EmailSender): AuthPort {
  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
    baseURL: origin, secret, trustedOrigins: [origin],
    emailAndPassword: { enabled: false },
    session: { expiresIn: accessPolicy.sessionSeconds, disableSessionRefresh: true, cookieCache: { enabled: false } },
    advanced: { useSecureCookies: origin.startsWith("https:"), cookies: { session_token: { attributes: { httpOnly: true, sameSite: "lax" } } } },
    logger: { disabled: true },
    plugins: [magicLink({
      expiresIn: accessPolicy.linkSeconds, storeToken: "hashed",
      generateToken: () => randomBytes(32).toString("base64url"),
      async sendMagicLink({ email, token }) {
        const link = new URL("/access/confirm", origin);
        link.searchParams.set("token", token);
        await send(email, link.toString());
      },
    })],
  });
  return {
    async request(email) {
      await auth.api.signInMagicLink({ body: { email }, headers: { origin } });
    },
    async redeem(token) {
      const response = await auth.api.magicLinkVerify({ query: { token }, headers: { origin }, asResponse: true });
      if (response.status >= 500) throw new Error("VERIFICATION_UNAVAILABLE");
      if (!response.ok) return null;
      const value = await response.json();
      if (!value.user?.id || !value.user?.emailVerified) return null;
      return { learner: { id: value.user.id, email: value.user.email }, cookies: response.headers.getSetCookie() };
    },
    async session(headers) {
      const value = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
      return value?.user.emailVerified ? { id: value.user.id, email: value.user.email } : null;
    },
    async logout(headers) {
      const response = await auth.api.signOut({ headers, asResponse: true });
      if (!response.ok) throw new Error("SESSION_REVOCATION_FAILED");
      return response.headers.getSetCookie();
    },
  };
}
