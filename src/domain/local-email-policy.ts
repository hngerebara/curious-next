import type { LocalEmailEnvironment } from "../contracts/access";

export function localEmailOrigin(environment: LocalEmailEnvironment): string {
  if (environment.nodeEnv !== "development" || environment.vercel || environment.netlify || environment.aws || environment.ci) throw new Error("LOCAL_EMAIL_FORBIDDEN");
  const url = new URL(environment.origin ?? "invalid:");
  if (!["http:", "https:"].includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.origin !== environment.origin) throw new Error("LOCAL_EMAIL_FORBIDDEN");
  return url.origin;
}
export function localInboxRequest(request: Request, environment: LocalEmailEnvironment): void {
  const origin = localEmailOrigin(environment);
  if (request.method !== "GET" || request.headers.get("host") !== new URL(origin).host || new URL(request.url).origin !== origin || (request.headers.get("origin") && request.headers.get("origin") !== origin) || ![null, "none", "same-origin"].includes(request.headers.get("sec-fetch-site"))) throw new Error("LOCAL_EMAIL_FORBIDDEN");
}
