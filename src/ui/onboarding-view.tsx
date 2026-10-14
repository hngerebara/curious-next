"use client";
import { useEffect, useRef, useState } from "react";
import type { Goal, GoalInput, Plan, Enrollment, DiagnosticPacket, EntryRecommendation, EntryPreferences } from "../contracts/course-plan";
import { CoursePlanView } from "./course-plan-view";
import { EntryGuidanceView } from "./entry-guidance-view";
import { PlacementView } from "./placement-view";
import { GoalStep, PreferencesStep } from "./setup-steps";

const defaults: GoalInput = { goalText: "", explanationLevel: "beginner", teachingLanguage: "en", sessionMinutes: 20 };
export function OnboardingView() {
  const [step,setStep]=useState<"goal"|"preferences"|"proposal"|"start">("goal");
  const [input, setInput] = useState<GoalInput>(defaults);
  const [savedInput,setSavedInput]=useState<GoalInput>(defaults);
  const [preferencesDirty,setPreferencesDirty]=useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [packet, setPacket] = useState<DiagnosticPacket | null>(null);
  const [recommendation, setRecommendation] = useState<EntryRecommendation | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("Loading your saved goal…");
  const [expired, setExpired] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const planKey = useRef<string>("");
  const acceptKey = useRef<string>("");
  async function request<T>(url: string, method = "GET", body?: unknown, key?: string): Promise<T> {
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    if (!response.ok) { if (response.status === 401) setExpired(true); throw new Error(result.error?.code === "CONFIGURATION_CHANGED" ? "Generation settings changed, but your previous work remains saved. Create an updated course plan to use the current model." : ["PREFERENCE_CONFLICT", "DIAGNOSTIC_CHANGED"].includes(result.error?.code) ? "Your saved preferences or starting questions have changed, so reload saved work before trying again." : result.error?.code === "REVISION_CONFLICT" ? "This goal changed in another session, so reload the saved goal before editing." : response.status === 401 ? "Your session ended, but your confirmed work remains saved. Sign in again to continue with your saved setup." : "This request could not be completed, but your input remains here. Try the request again when you are ready to continue."); }
    return result.data as T;
  }
  async function run(work: () => Promise<void>) { setBusy(true); setMessage("Saving and loading your next step…"); try { await work(); } catch (error) { setMessage(error instanceof Error ? error.message : "The request failed, but your input remains here for another attempt."); } finally { setBusy(false); setMessage(current=>current === "Saving and loading your next step…" ? "Your saved setup is ready for you to continue." : current); heading.current?.focus(); } }
  async function showEnrollment(item: Enrollment | null) {
    setEnrollment(item); setPacket(null); setRecommendation(null); setRecommendation(item ? await request<EntryRecommendation>(`/api/recommendation?enrollmentId=${item.id}`) : null);
  }
  async function restore() {
    const saved = await request<{ goal: Goal | null; plan: Plan | null; enrollment: Enrollment | null; latestEnrollmentId: string | null }>("/api/profile/goal");
    setResumeId(saved.latestEnrollmentId !== saved.enrollment?.id ? saved.latestEnrollmentId : null); setGoal(saved.goal); setInput(saved.goal?.input ?? defaults);setSavedInput(saved.goal?.input ?? defaults); setPlan(saved.plan); await showEnrollment(saved.enrollment);
    setStep(saved.enrollment ? "start" : saved.plan ? "proposal" : "goal");
    if (saved.plan) planKey.current = saved.plan.requestKey;
    const enrollmentId = new URL(window.location.href).searchParams.get("enrollment");
    if (enrollmentId) { if(saved.latestEnrollmentId && saved.latestEnrollmentId !== enrollmentId)setResumeId(saved.latestEnrollmentId); const item = await request<Enrollment>(`/api/enrollments/${encodeURIComponent(enrollmentId)}`); await showEnrollment(item); setPlan(item.plan);setInput(item.plan.goal.input);setSavedInput(item.plan.goal.input);setStep("start"); }
  }
  useEffect(() => { run(restore); }, []);
  async function generate() {
    setStep("proposal");setPlan(null);
    const saved = await request<Goal>("/api/profile/goal", "PUT", { ...input, version: goal?.version ?? 0 });
    setGoal(saved);setSavedInput(saved.input); if (enrollment) setResumeId(enrollment.id); await showEnrollment(null); setPlan(null); planKey.current = crypto.randomUUID(); acceptKey.current = "";
    setMessage("Building a course plan for your goal…");
    try { const result = await request<Plan>("/api/course-plans", "POST", { goalId: saved.id }, planKey.current); setPlan(result); setMessage(""); }
    catch { throw new Error("Your goal is saved, so reload the saved goal and plan to recover an interrupted generation."); }
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
    const item = await request<Enrollment>("/api/enrollments", "POST", { planId: plan.id }, acceptKey.current); await showEnrollment(item);setStep("start");
    window.history.replaceState(null, "", `/onboarding?enrollment=${encodeURIComponent(item.id)}`);
  }
  async function place(mode: "skip" | "diagnostic" | "beginning", answers?: string[], diagnosticVersion?: string) {
    if (!enrollment) return;
    await showEnrollment(await request<Enrollment>(`/api/enrollments/${enrollment.id}/placement`, "POST", { mode, ...(answers ? { answers, diagnosticVersion } : {}) }));
  }
  const baseline=savedInput;
  const dirty=preferencesDirty || input.goalText !== baseline.goalText || input.explanationLevel !== baseline.explanationLevel || input.teachingLanguage !== baseline.teachingLanguage || input.sessionMinutes !== baseline.sessionMinutes || (input.clarification ?? "") !== (baseline.clarification ?? "");
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue="";}};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
  const title=step === "goal" ? "Build a useful skill around your learning goal" : step === "preferences" ? "Choose the pace and explanations that suit you" : step === "proposal" ? "Explore a learning path built around your goal" : "Choose where to begin and understand your starting point";
  const proposal=plan?.result?.state === "ready-preview" ? plan.result.proposal : null;
  const reference=proposal?.modules.some(item=>item.objective.id === (proposal.subject === "cybersecurity" ? "CY-2" : "AI-2"));
  return <main id="main" className="onboarding-shell setup-layout" aria-busy={busy}>
    <p className="eyebrow">Your learning setup</p><h1 ref={heading} tabIndex={-1}>{title}</h1><p className="muted">Choose a small goal and follow a focused path towards your next useful step.</p>
    <ol className="onboarding-progress" aria-label="Setup progress">{["goal","preferences","proposal","start"].map((item,index)=><li key={item} aria-current={step === item ? "step" : undefined}>{index+1}. {item === "goal" ? "Your goal" : item === "preferences" ? "Your pace" : item === "proposal" ? "Your path" : "Your start"}</li>)}</ol>
    <p role="status" className="save-status">{message}</p>{expired && <a href="/access">Sign in again</a>}
    {resumeId && <p><a href={"/onboarding?enrollment="+encodeURIComponent(resumeId)}>Open another saved course</a></p>}
    {step === "goal" && <GoalStep input={input} setInput={setInput} busy={busy || expired} next={()=>{setStep("preferences");heading.current?.focus();}}/>}
    {step === "preferences" && <PreferencesStep input={input} setInput={setInput} busy={busy || expired} back={()=>{setStep("goal");heading.current?.focus();}} generate={()=>run(generate)}/>}
    {step === "proposal" && <>{plan && <CoursePlanView plan={plan} enrollment={enrollment} accept={()=>run(accept)} retry={()=>run(retry)} busy={busy || expired}/>}{plan?.result?.state === "clarification" && <form onSubmit={e=>{e.preventDefault();run(generate);}}><label htmlFor="clarification">{plan.result.question}</label><textarea id="clarification" required maxLength={500} disabled={busy || expired} value={input.clarification ?? ""} onChange={e=>setInput({...input,clarification:e.target.value})}/><button disabled={busy || expired}>Update my path</button></form>}<div className="section-actions"><button className="text-button" disabled={busy} onClick={()=>setStep("goal")}>← Edit my goal</button><button className="text-button" disabled={busy} onClick={()=>setStep("preferences")}>Change my preferences</button></div></>}
    {step === "start" && enrollment && <>{enrollment.placement && <section className="next-action" style={{gridTemplateColumns:"1fr",gap:16}}><div><p className="eyebrow">Your goal</p><h2>{proposal?.title}</h2><p>{proposal?.reason}</p><p className="muted">{enrollment.placement.reason}</p></div>{reference ? <a className="primary-button" href={"/learning?enrollment="+encodeURIComponent(enrollment.id)}>Go to my next step <span aria-hidden="true">↗</span></a> : <p className="notice">This path previews your course plan while its learning activities are still being prepared.</p>}</section>}{!enrollment.placement ? <PlacementView key={enrollment.id} enrollment={enrollment} packet={packet} diagnose={()=>run(async()=>setPacket(await request<DiagnosticPacket>("/api/enrollments/"+enrollment.id+"/diagnostic")))} place={(mode,answers,version)=>run(()=>place(mode,answers,version))} busy={busy}/> : <details><summary>Change my starting point</summary><PlacementView key={enrollment.id} enrollment={enrollment} packet={packet} diagnose={()=>run(async()=>setPacket(await request<DiagnosticPacket>("/api/enrollments/"+enrollment.id+"/diagnostic")))} place={(mode,answers,version)=>run(()=>place(mode,answers,version))} busy={busy}/></details>}{recommendation && <details><summary>Course preferences and other options</summary><EntryGuidanceView onDirtyChange={setPreferencesDirty} key={enrollment.id+"-"+enrollment.preferences.version} enrollment={enrollment} recommendation={recommendation} beginning={()=>run(()=>place("beginning"))} busy={busy} save={preferences=>run(async()=>showEnrollment(await request<Enrollment>("/api/enrollments/"+enrollment.id+"/preferences","PATCH",preferences)))}/></details>}<details><summary>Read my course plan</summary>{plan && <CoursePlanView plan={plan} enrollment={enrollment} accept={()=>run(accept)} retry={()=>run(retry)} busy={busy}/>}</details><button className="text-button" disabled={busy} onClick={()=>{if(!preferencesDirty || window.confirm("Discard unsaved course preferences and change your goal?"))setStep("goal");}}>Change my learning goal</button></>}
    <div className="section-actions"><button className="text-button" disabled={busy} onClick={()=>{if(!dirty || window.confirm("Discard unsaved setup edits and reload your saved goal?"))run(restore);}}>Reload saved setup</button></div><p className="preview">This English learning preview still requires independent curriculum and assessment review.</p>
  </main>;
}
