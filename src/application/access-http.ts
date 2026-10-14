import type { AuthPort, ConfirmationPort, OwnedRecordPort } from "../contracts/access";
import { accessPolicy, emailAddress, isToken } from "../domain/access-policy";
import type { accessService } from "./access-service";

type Service = ReturnType<typeof accessService>;
type Dependencies = { auth: AuthPort; confirmation: ConfirmationPort; service: Service; records: OwnedRecordPort; origin: string; trustedProxy: boolean; demo?: (password: unknown, client: string) => Promise<{ cookies: string[] } | null> };

export function accessHttp(deps: Dependencies) {
  const cookieName = deps.origin.startsWith("https:") ? "__Host-cn-confirm" : "cn-confirm";
  const contextCookie = (value: string, seconds: number) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${deps.origin.startsWith("https:") ? "; Secure" : ""}`;
  const json = (status: number, data: unknown) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  const redirect = (path: string, cookies: string[] = []) => {
    const response = new Response(null, { status: 303, headers: { Location: new URL(path, deps.origin).toString(), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
    for (const cookie of cookies) response.headers.append("Set-Cookie", cookie);
    return response;
  };
  const context = (request: Request) => {
    const cookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));
    return deps.confirmation.read(cookie?.slice(cookieName.length + 1));
  };
  const client = (request: Request) => deps.trustedProxy ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown" : "local-untrusted";
  const responseError = (status: number, code: string) => json(status, { error: { code }, requestId: crypto.randomUUID() });

  return {
    context,
    learner: (headers: Headers) => deps.auth.session(headers),
    async scan(request: Request) {
      const token = new URL(request.url).searchParams.get("token");
      if (!isToken(token)) return redirect("/access?state=invalid", [contextCookie("", 0)]);
      const created = deps.confirmation.create(token);
      return redirect("/access/confirm/ready", [contextCookie(created.value, accessPolicy.linkSeconds)]);
    },
    async handle(request: Request, operation: string) {
      if (operation === "session" && request.method === "GET") {
        const learner = await deps.auth.session(request.headers);
        return learner ? json(200, { data: learner, requestId: crypto.randomUUID() }) : responseError(401, "SESSION_REQUIRED");
      }
      if (operation === "record" && request.method === "GET") {
        const learner = await deps.auth.session(request.headers);
        if (!learner) return responseError(401, "SESSION_REQUIRED");
        const id = new URL(request.url).searchParams.get("id") ?? "";
        const record = await deps.records.read(id, learner.id);
        return record ? json(200, { data: record, requestId: crypto.randomUUID() }) : responseError(404, "NOT_FOUND");
      }
      if (request.method !== "POST" || !["request", "confirm", "logout", "demo"].includes(operation)) return responseError(404, "NOT_FOUND");
      if (request.headers.get("origin") !== deps.origin) return responseError(403, "ORIGIN_REJECTED");
      const contentType = request.headers.get("content-type")?.split(";")[0];
      if (!["application/json", "application/x-www-form-urlencoded"].includes(contentType ?? "")) return responseError(400, "INVALID_BODY");
      // Bound the stream, including requests without a Content-Length header.
      const reader = request.body?.getReader();
      let bytes = new Uint8Array();
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (bytes.length + value.length > accessPolicy.bodyBytes) {
            await reader.cancel();
            return responseError(413, "BODY_TOO_LARGE");
          }
          const joined = new Uint8Array(bytes.length + value.length);
          joined.set(bytes); joined.set(value, bytes.length); bytes = joined;
        }
      }
      let body: Record<string, unknown>;
      try {
        const text = new TextDecoder().decode(bytes);
        body = contentType === "application/json" ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text));
        if (!body || typeof body !== "object" || Array.isArray(body)) return responseError(400, "INVALID_BODY");
      } catch {
        return responseError(400, "INVALID_BODY");
      }
      if (operation === "demo") {
        if (!deps.demo) return responseError(404, "NOT_FOUND");
        const result = await deps.demo(body.password, client(request));
        return result ? redirect("/onboarding", result.cookies) : responseError(401, "DEMO_LOGIN_REJECTED");
      }
      if (operation === "request") {
        if (deps.demo) return responseError(404, "NOT_FOUND");
        const email = emailAddress(body.email);
        if (!email || body.destination !== undefined) return responseError(400, "INVALID_EMAIL_OR_DESTINATION");
        const result = await deps.service.request(email, client(request));
        if (result === "limited") return responseError(429, "TRY_LATER");
        if (result === "unavailable") return responseError(503, "DELIVERY_UNAVAILABLE");
        return json(202, { data: { message: "Check your inbox for a sign-in link." }, requestId: crypto.randomUUID() });
      }
      if (operation === "confirm") {
        if (deps.demo) return responseError(404, "NOT_FOUND");
        const saved = context(request);
        if (!saved || typeof body.csrf !== "string" || body.csrf !== saved.csrf) return redirect("/access?state=invalid", [contextCookie("", 0)]);
        const result = await deps.service.confirm(saved.token, client(request));
        if (result.status === "verified") return redirect("/access/verified", [...result.result.cookies, contextCookie("", 0)]);
        if (result.status === "invalid") return redirect("/access?state=invalid", [contextCookie("", 0)]);
        return redirect(`/access/confirm/ready?state=${result.status}`);
      }
      const cookies = await deps.auth.logout(request.headers);
      return redirect("/access", cookies);
    },
  };
}
