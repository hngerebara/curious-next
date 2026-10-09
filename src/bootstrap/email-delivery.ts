import { localEmail } from "../adapters/local-email";
import { resendEmail } from "../adapters/resend-email";
import type { LocalEmailEnvironment } from "../contracts/access";
import { localEmailOrigin } from "../domain/local-email-policy";

export function localEmailEnvironment(): LocalEmailEnvironment {
  return { origin: process.env.BETTER_AUTH_URL, nodeEnv: process.env.NODE_ENV, vercel: process.env.VERCEL, netlify: process.env.NETLIFY, aws: process.env.AWS_LAMBDA_FUNCTION_NAME, ci: process.env.CI };
}
export function emailDelivery() {
  const mode = process.env.EMAIL_DELIVERY ?? "resend";
  if (mode === "local") return localEmail(localEmailEnvironment()).send;
  if (mode !== "resend") throw new Error("INVALID_EMAIL_DELIVERY");
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error("ACCESS_NOT_CONFIGURED");
  return resendEmail(process.env.RESEND_API_KEY, process.env.EMAIL_FROM);
}
export function localEmailMode() {
  if (process.env.EMAIL_DELIVERY !== "local") return false;
  localEmailOrigin(localEmailEnvironment()); return true;
}
