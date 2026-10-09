"use client";
import { useEffect, useRef, useState } from "react";
import type { Goal, GoalInput, Plan, Enrollment } from "../contracts/course-plan";
import { CoursePlanView } from "./course-plan-view";
import { PlacementView } from "./placement-view";

const defaults: GoalInput = { goalText: "", explanationLevel: "beginner", teachingLanguage: "en", sessionMinutes: 20 };
export function OnboardingView() {
  const [input, setInput] = useState<GoalInput>(defaults);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("Loading your saved goal…");
  const [expired, setExpired] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const planKey = useRef<string>("");
  const acceptKey = useRef<string>("");
  async function request<T>(url: string, method = "GET", body?: unknown, key?: string): Promise<T> {
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    if (!response.ok) { if (response.status === 401) setExpired(true); throw new Error(result.error?.code === "REVISION_CONFLICT" ? "This goal changed in another session. Reload the saved goal before editing." : response.status === 401 ? "Your session ended. Confirmed work is saved. Sign in again." : "This request could not be completed. Your input is still here. Try again."); }
    return result.data as T;
  }
  async function run(work: () => Promise<void>) { setBusy(true); setMessage(""); try { await work(); } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed. Your input is still here."); } finally { setBusy(false); heading.current?.focus(); } }
  async function restore() {
    const saved = await request<{ goal: Goal | null; plan: Plan | null }>("/api/profile/goal");
    setGoal(saved.goal); setInput(saved.goal?.input ?? defaults); setPlan(saved.plan); setEnrollment(null);
    if (saved.plan) planKey.current = saved.plan.requestKey;
    const enrollmentId = new URL(window.location.href).searchParams.get("enrollment");
    if (enrollmentId) { const item = await request<Enrollment>(`/api/enrollments/${encodeURIComponent(enrollmentId)}`); setEnrollment(item); setPlan(item.plan); }
  }
  useEffect(() => { run(restore); }, []);
  async function generate() {
    const saved = await request<Goal>("/api/profile/goal", "PUT", { ...input, version: goal?.version ?? 0 });
    setGoal(saved); setEnrollment(null); setPlan(null); planKey.current = crypto.randomUUID(); acceptKey.current = "";
    setMessage("Building a course plan for your goal…");
    try { const result = await request<Plan>("/api/course-plans", "POST", { goalId: saved.id }, planKey.current); setPlan(result); setMessage(""); }
    catch { throw new Error("Your goal is saved. Reload the saved goal and plan to recover an interrupted generation."); }
    window.history.replaceState(null, "", "/onboarding");
  }
  async function retry() {
    if (!plan) return;
    // Reuse the saved request key after reload or an interrupted request.
    const result = await request<Plan>("/api/course-plans", "POST", { goalId: plan.goal.id }, plan.requestKey); setPlan(result);
  }
  async function accept() {
    if (!plan) return;
    acceptKey.current ||= crypto.randomUUID();
    const item = await request<Enrollment>("/api/enrollments", "POST", { planId: plan.id }, acceptKey.current); setEnrollment(item);
    window.history.replaceState(null, "", `/onboarding?enrollment=${encodeURIComponent(item.id)}`);
  }
  async function place(mode: "skip" | "diagnostic" | "beginning", answers?: string[]) {
    if (!enrollment) return;
    setEnrollment(await request<Enrollment>(`/api/enrollments/${enrollment.id}/placement`, "POST", { mode, ...(answers ? { answers } : {}) }));
  }
  return <main id="main" className="onboarding-shell" aria-busy={busy}>
    <p className="eyebrow">Goal-based course preview</p><h1 ref={heading} tabIndex={-1}>What would you like to achieve?</h1><p>We’ll propose a personalised plan within Practical AI or Cybersecurity. English preview only. Draft content is awaiting review.</p>
    <p role="status" className="status">{message}</p>{expired && <a href="/access">Sign in with a magic link</a>}
    <form className="card" onSubmit={(e) => { e.preventDefault(); run(generate); }}>
      <label htmlFor="goal">Your learning goal</label><textarea id="goal" required minLength={10} maxLength={1000} value={input.goalText} onChange={(e) => setInput({ ...input, goalText: e.target.value, clarification: undefined })} placeholder="For example, use AI to write clearer customer emails" />
      <label htmlFor="explanation">How should explanations feel?</label><select id="explanation" value={input.explanationLevel} onChange={(e) => setInput({ ...input, explanationLevel: e.target.value as GoalInput["explanationLevel"] })}><option value="very-simple">Very simple</option><option value="beginner">Beginner-friendly</option><option value="standard">Standard</option><option value="technical">Technical</option></select>
      <label htmlFor="language">Teaching language</label><select id="language" value="en" aria-describedby="language-note"><option value="en">English (preview)</option><option disabled>Nigerian Pidgin (review pending)</option><option disabled>Igbo (review pending)</option><option disabled>Yoruba (review pending)</option><option disabled>Hausa (review pending)</option></select><p id="language-note" className="muted">Other languages are unavailable until reviewed. No automatic translation is applied.</p>
      <label htmlFor="time">Time for a session</label><select id="time" value={input.sessionMinutes} onChange={(e) => setInput({ ...input, sessionMinutes: Number(e.target.value) as GoalInput["sessionMinutes"] })}>{[10, 20, 40].map((n) => <option key={n} value={n}>{n} minutes</option>)}</select><p className="muted">Session time shapes pacing, not course coverage or assessment difficulty.</p>
      {plan?.result?.state === "clarification" && <><label htmlFor="clarification">Your answer</label><textarea id="clarification" required maxLength={500} value={input.clarification ?? ""} onChange={(e) => setInput({ ...input, clarification: e.target.value })} /></>}
      <button type="submit" disabled={busy || expired}>{busy ? "Please wait…" : goal ? "Create an updated course plan" : "Create my course plan"}</button>
      <button type="button" className="secondary-button" disabled={busy} onClick={() => run(restore)}>Reload saved goal and plan</button>
    </form>
    {plan && <CoursePlanView plan={plan} enrollment={enrollment} accept={() => run(accept)} retry={() => run(retry)} busy={busy} />}
    {enrollment && <PlacementView enrollment={enrollment} place={(mode, answers) => run(() => place(mode, answers))} busy={busy} />}
  </main>;
}
