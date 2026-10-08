import { runtime } from "./runtime";

type Context = { params: Promise<{ operation: string }> };
async function handle(request: Request, context: Context) {
  const { operation } = await context.params;
  try {
    return await runtime().handle(request, operation);
  } catch {
    return Response.json({ error: { code: "ACCESS_UNAVAILABLE" }, requestId: crypto.randomUUID() }, { status: 503, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  }
}
export const GET = handle;
export const POST = handle;
