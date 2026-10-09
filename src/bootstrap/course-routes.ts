import { courseRuntime } from "./course-runtime";

const unavailable = () => Response.json({ error: { code: "UNAVAILABLE" }, requestId: crypto.randomUUID() }, { status: 503, headers: { "Cache-Control": "no-store" } });
export async function goalRoute(request: Request) { try { return await courseRuntime()(request, "goal"); } catch { return unavailable(); } }
export async function plansRoute(request: Request) { try { return await courseRuntime()(request, "plans"); } catch { return unavailable(); } }
export async function planRoute(request: Request, context: { params: Promise<{ id: string }> }) { try { return await courseRuntime()(request, "plans", (await context.params).id); } catch { return unavailable(); } }
export async function enrollmentsRoute(request: Request) { try { return await courseRuntime()(request, "enrollments"); } catch { return unavailable(); } }
export async function enrollmentRoute(request: Request, context: { params: Promise<{ id: string }> }) { try { return await courseRuntime()(request, "enrollments", (await context.params).id); } catch { return unavailable(); } }
export async function placementRoute(request: Request, context: { params: Promise<{ id: string }> }) { try { return await courseRuntime()(request, "enrollments", (await context.params).id, "placement"); } catch { return unavailable(); } }
