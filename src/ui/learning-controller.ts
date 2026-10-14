"use client";
import { useEffect, useRef, useState } from "react";
import type { Attempt, Draft, Learning, ExplanationLevel, Help, Practice } from "../contracts/attempt";
import type { Enrollment } from "../contracts/course-plan";
import { submitForFeedback } from "../application/submit-feedback";

export type LearningPageView = "today" | "path" | "work" | "activity";
export function useLearningController() {
  const [learning,setLearning]=useState<Learning|null>(null);
  const [course,setCourse]=useState<Enrollment|null>(null);
  const [attempt,setAttempt]=useState<Attempt|null>(null);
  const [draft,setDraft]=useState<Draft>({prompt:"",checklist:"",explanation:""});
  const [view,setView]=useState<LearningPageView>("today");
  const [busy,setBusy]=useState(true);const [expired,setExpired]=useState(false);
  const [message,setMessage]=useState("Loading your saved learning...");
  const heading=useRef<HTMLHeadingElement>(null);
  const enrollment=useRef("");const route=useRef("");
  const createKey=useRef({mode:"" as Attempt["mode"]|"",key:""});
  const submissionKey=useRef("");const practiceKey=useRef({revision:-1,key:""});
  const dirty=!!attempt && (draft.prompt !== attempt.draft.prompt || draft.checklist !== attempt.draft.checklist || draft.explanation !== attempt.draft.explanation);
  async function request<T>(url:string,method="GET",body?:unknown,key?:string):Promise<T> {
    const response=await fetch(url,{method,headers:{"Content-Type":"application/json",...(key ? {"Idempotency-Key":key} : {})},...(body ? {body:JSON.stringify(body)} : {})});
    const result=await response.json();
    if(!response.ok) {
      if(response.status === 401)setExpired(true);
      const code=result.error?.code;
      const messages:Record<string,string>={DRAFT_CONFLICT:"This work changed in another session. Your local edits are retained. Reload saved work to inspect the newer version.",GENERATION_PENDING:"An AI response is still pending. Wait up to 45 seconds, then reload and retry.",INCOMPLETE_SUBMISSION:"Complete both explanations and your decisions. For AI tasks, run your current prompt before submitting.",CONFIGURATION_CHANGED:"AI settings changed. Your saved work is safe. Start a fresh task to use the current service.",FRESH_TASKS_EXHAUSTED:"All twelve fresh preview tasks have been used. Guided practice remains available.",ACTIVITY_ALREADY_STARTED:"This recall check already has saved work. Open it from Your work.",ACTIVITY_NOT_AVAILABLE:"This check is not available yet. Reload your next step to see its prerequisites and due time.",NOT_FOUND:"This work is unavailable to your account."};
      throw Error(response.status === 401 ? "Your session ended. Saved work is safe. Sign in again, then reopen this page." : messages[code] ?? "The request did not finish. Your input is retained. Reload saved work or retry.");
    }
    return result.data as T;
  }
  async function run(work:()=>Promise<void>) {setBusy(true);setMessage("Updating your saved learning...");try{await work();}catch(e){setMessage(e instanceof Error ? e.message : "The request did not finish. Your input is retained.");}finally{setBusy(false);setMessage(current=>current === "Updating your saved learning..." ? "" : current);}}
  async function loadContext(id:string) {
    const [next,accepted]=await Promise.all([request<Learning>("/api/learning?enrollmentId="+encodeURIComponent(id)),request<Enrollment>("/api/enrollments/"+encodeURIComponent(id))]);
    enrollment.current=id;setLearning(next);setCourse(accepted);
  }
  function url(next:LearningPageView,id?:string) {return "/learning?enrollment="+encodeURIComponent(enrollment.current)+(next === "activity" && id ? "&attempt="+encodeURIComponent(id) : "&view="+next);}
  function locate(next:LearningPageView,id?:string,push=true) {setMessage("");setView(next);route.current=url(next,id);if(push)window.history.pushState(null,"",route.current);else window.history.replaceState(null,"",route.current);heading.current?.focus();}
  function confirmLeave() {return !dirty || window.confirm("Your edits are not saved. Leave this work and discard them?");}
  async function open(id:string,push=true) {
    const saved=await request<Attempt>("/api/attempts/"+encodeURIComponent(id));
    if(saved.enrollmentId !== enrollment.current)await loadContext(saved.enrollmentId);
    setAttempt(saved);setDraft(saved.draft);submissionKey.current=saved.submission?.key ?? "";practiceKey.current={revision:-1,key:""};locate("activity",saved.id,push);
  }
  async function restore() {
    setMessage("Loading your saved learning...");
    const query=new URL(window.location.href).searchParams;let id=query.get("enrollment");
    if(!id){const profile=await request<{latestEnrollmentId:string|null}>("/api/profile/goal");id=profile.latestEnrollmentId;}
    if(!id){setMessage("Choose a learning goal to get your first next step.");return;}
    enrollment.current=id;await loadContext(id);
    const saved=query.get("attempt");const selected=query.get("view");
    if(saved)await open(saved,false);else {setAttempt(null);setDraft({prompt:"",checklist:"",explanation:""});locate(selected === "path" || selected === "work" ? selected : "today",undefined,false);}
    setMessage("Saved work restored.");
  }
  useEffect(()=>{run(restore);},[]);
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue="";}};const pop=()=>{if(!confirmLeave()){window.history.pushState(null,"",route.current);return;}run(restore);};window.addEventListener("beforeunload",warn);window.addEventListener("popstate",pop);return()=>{window.removeEventListener("beforeunload",warn);window.removeEventListener("popstate",pop);};},[dirty]);
  function navigate(next:LearningPageView) {if(busy || !confirmLeave())return;if(next !== "activity" && attempt)setDraft(attempt.draft);locate(next,attempt?.id);}
  async function refresh() {if(enrollment.current)await loadContext(enrollment.current);}
  async function saveDraft() {
    if(!attempt)throw Error("Choose a task first.");
    if(!dirty)return attempt;
    setMessage("Saving your work...");
    const saved=await request<Attempt>("/api/attempts/"+attempt.id,"PATCH",{revision:attempt.revision,draft});setAttempt(saved);setDraft(saved.draft);setMessage("Work saved.");return saved;
  }
  async function create(mode:Attempt["mode"]) {
    if(!confirmLeave())return;
    if(createKey.current.mode !== mode)createKey.current={mode,key:""};
    createKey.current.key ||= crypto.randomUUID();setMessage("Preparing your activity...");
    const saved=await request<Attempt>("/api/learning","POST",{enrollmentId:enrollment.current,mode},createKey.current.key);
    createKey.current={mode:"",key:""};await open(saved.id);await refresh();setMessage("Your new task is ready.");
  }
  async function assess(saved=attempt) {
    if(!saved)throw Error("Choose a task first.");
    setMessage("Checking your saved answers...");
    const result=await request<Attempt>("/api/attempts/"+saved.id+"/assess","POST",{});
    setAttempt(result);await refresh();setMessage("Feedback saved. Read what went well and what to try next.");return result;
  }
  async function submit() {
    setMessage("Saving your answers...");
    await submitForFeedback({save:saveDraft,freeze:async saved=>{submissionKey.current ||= crypto.randomUUID();return request<Attempt>("/api/attempts/"+saved.id+"/submit","POST",{revision:saved.revision},submissionKey.current);},onSaved:saved=>{setAttempt(saved);setMessage("Answers saved. Checking your work...");},assess});
  }
  async function practice(prior?:Practice) {
    const saved=prior ? attempt! : await saveDraft();const revision=prior?.revision ?? saved.revision;
    if(!prior && practiceKey.current.revision !== revision)practiceKey.current={revision,key:crypto.randomUUID()};
    setMessage("Running your saved prompt...");
    setAttempt(await request<Attempt>("/api/attempts/"+saved.id+"/practice","POST",{revision},prior?.key ?? practiceKey.current.key));setMessage("AI response saved. Check the answer against your task.");
  }
  async function variant(level:ExplanationLevel) {if(attempt)setAttempt(await request<Attempt>("/api/attempts/"+attempt.id+"/variant","POST",{explanationLevel:level}));setMessage("Explanation updated for this task.");}
  async function help(kind:Help["kind"]) {if(attempt)setAttempt(await request<Attempt>("/api/attempts/"+attempt.id+"/help","POST",{kind,confirm:true},crypto.randomUUID()));setMessage("Help recorded. Use a fresh task later to show independent skill.");}
  async function review() {if(attempt)setAttempt(await request<Attempt>("/api/attempts/"+attempt.id+"/review","POST",{}));setMessage("Optional review requested. You can keep practising.");}
  async function reload() {if(attempt && confirmLeave()){await open(attempt.id,false);await refresh();setMessage("Saved work reloaded.");}}
  async function inspect(id:string) {if(confirmLeave())await open(id);}
  return {learning,course,attempt,draft,setDraft,view,busy,expired,message,heading,dirty,enrollmentId:enrollment.current,run,restore,navigate,create,saveDraft,submit,practice,variant,help,review,reload,inspect,refresh,confirmLeave,assess};
}
