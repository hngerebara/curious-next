import { afterEach, expect, it, vi } from "vitest";
import { tutorPathModel } from "../src/adapters/tutor-path-model";
import { closeTutorHarnesses, generatedPath, tutorHarness, tutorInput } from "./tutor-harness";
afterEach(async () => { vi.useRealTimers(); vi.restoreAllMocks(); await closeTutorHarnesses(); });

it("accepts a path response after the former 25-second deadline", async () => {
  vi.useFakeTimers();
  const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(milliseconds => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new DOMException("Timed out", "TimeoutError")), milliseconds);
    return controller.signal;
  });
  const transport: typeof fetch = async (_url, init) => new Promise((resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
    setTimeout(() => resolve(Response.json({status:"completed",output:[{type:"message",role:"assistant",content:[{type:"output_text",text:JSON.stringify(generatedPath())}]}]})), 30000);
  });
  const result = tutorPathModel("fictional-key", "configured-model", transport).path(tutorInput);
  await vi.advanceTimersByTimeAsync(30000);
  expect(await result).toEqual(generatedPath());
  expect(timeout).toHaveBeenCalledWith(60000);
});

it("keeps the generation lease longer than the provider deadline", async () => {
  const h = await tutorHarness(async () => {
    const [pending] = await h.store.list("learner-a");
    expect(pending.generation.until - Date.now()).toBeGreaterThan(60000);
    return generatedPath();
  });
  const path = await h.service.generate("learner-a", tutorInput, "fictional-deadline-request");
  expect(path.state).toBe("proposed");
  expect(path.generation.lease).toBeNull();
  expect(h.count()).toBe(1);
});
