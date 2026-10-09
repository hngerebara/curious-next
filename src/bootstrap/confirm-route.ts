import { runtime } from "./runtime";

export async function GET(request: Request) {
  try {
    return await runtime().scan(request);
  } catch {
    return new Response(null, { status: 303, headers: { Location: "/access?state=unavailable", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  }
}
