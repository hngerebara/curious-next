"use client";
import { useEffect, useRef, useState } from "react";
import type { TutorPublicPath, TutorPreferences, TutorNextAction } from "../contracts/tutor";
import type { TutorApproach, TutorDraft, TutorPublicSession } from "../contracts/tutor-lesson";
import { tutorRequest } from "./tutor-client";
import { useUnsavedTutor } from "./unsaved-tutor";
import { useTutorLease } from "./tutor-lease";
import { TutorPreferencesEditor } from "./tutor-preferences";
import { TutorLoading } from "./tutor-loading";
import { TutorLessonWorkspace } from "./tutor-lesson-workspace";
import "./tutor.css";
import { TextSizeControl } from "./display-preferences";
import { LogoutButton } from "./logout-button";
import { TutorToday, TutorRoadmap, TutorProgress } from "./tutor-journey-panels";
import { TutorCompanion } from "./tutor-companion";
export function TutorLearning({pathId}:{pathId:string}) {
  const [path,setPath]=useState<TutorPublicPath|null>(null),[sessions,setSessions]=useState<TutorPublicSession[]>([]),[session,setSession]=useState<TutorPublicSession|null>(null),[draft,setDraft]=useState<TutorDraft>({position:0,activity:[],application:"",teachBack:""}),[view,setView]=useState<"today"|"path"|"progress"|"lesson">("today"),[busy,setBusy]=useState(true),[message,setMessage]=useState("Loading your saved learning journey and recent work…"),[recommendation,setRecommendation]=useState<TutorNextAction|null>(null),[preferenceEpoch,setPreferenceEpoch]=useState(0),[preferencesDirty,setPreferencesDirty]=useState(false),[result,setResult]=useState<{correct:boolean;explanation:string}|null>(null);
  const [companionDirty,setCompanionDirty]=useState(false);
  const askKey=useRef("");
  const askTarget=useRef("");
  const heading=useRef<HTMLHeadingElement>(null),helpKey=useRef(""),generationKey=useRef(""),generationTarget=useRef(""),submitKey=useRef(""),helpTarget=useRef(""),running=useRef(false);
  const waiting=useTutorLease(session?.generation.until ?? 0);
  const dirty=companionDirty || preferencesDirty || (!!session && JSON.stringify(draft)!==JSON.stringify(session.draft));const leave=useUnsavedTutor(dirty);
  async function run(work:()=>Promise<void>,label="Loading…",success=""){if(running.current)return;running.current=true;setBusy(true);setMessage(label);try{await work();setMessage(success);}catch(error){setMessage(error instanceof Error?error.message:"Your work is preserved while this request needs another attempt.");}finally{running.current=false;setBusy(false);heading.current?.focus();}}
  function open(s:TutorPublicSession){if(s.pathId!==pathId)throw Error("This saved work belongs to another goal, so reopen it from that learning path.");submitKey.current=s.submission?.key ?? "";helpKey.current="";setSession(s);setDraft(s.draft);setView("lesson");setResult(null);window.history.replaceState(null,"","/learning?path="+pathId+"&session="+s.id);}
  async function restore(){
    const id=new URL(window.location.href).searchParams.get("session");
    const [p,items,next,saved]=await Promise.all([tutorRequest<TutorPublicPath>("/api/tutor/paths/"+encodeURIComponent(pathId)),tutorRequest<TutorPublicSession[]>("/api/tutor/sessions?pathId="+encodeURIComponent(pathId)),tutorRequest<TutorNextAction>("/api/tutor/paths/"+encodeURIComponent(pathId)+"/recommendation"),id?tutorRequest<TutorPublicSession>("/api/tutor/sessions/"+encodeURIComponent(id)):Promise.resolve(null)]);
    setPath(p);setSessions(items);setRecommendation(next);if(saved)open(saved);else {const requested=new URL(window.location.href).searchParams.get("view");setView(requested==="path"?"path":["progress","work"].includes(requested ?? "")?"progress":"today");}
  }
  useEffect(()=>{run(restore);},[pathId]);
  async function save(value=draft){if(!session)throw Error("NOT_FOUND");const s=await tutorRequest<TutorPublicSession>("/api/tutor/sessions/"+session.id+"/save",{revision:session.revision,draft:value});setSession(s);setDraft(s.draft);setSessions(items=>[s,...items.filter(i=>i.id!==s.id)]);return s;}
  async function start(moduleId:string,previousId?:string){const target=moduleId+":"+(previousId ?? "");if(generationTarget.current!==target){generationTarget.current=target;generationKey.current="";}generationKey.current ||= crypto.randomUUID();const s=await tutorRequest<TutorPublicSession>("/api/tutor/sessions",{pathId,moduleId,...(previousId?{previousId}:{})},generationKey.current);generationKey.current="";window.location.assign("/learning?path="+pathId+"&session="+s.id);}
  async function explain(style:TutorPreferences["explanation"],approach:TutorApproach){const target=style+":"+approach;if(helpTarget.current!==target){helpKey.current="";helpTarget.current=target;}const s=await save();setMessage("Preparing a different explanation and teaching approach for your saved lesson…");helpKey.current ||= s.help.filter(h=>h.state!=="ready" && h.style===style && (h.approach ?? "balanced")===approach && h.count<2).at(-1)?.key ?? crypto.randomUUID();const updated=await tutorRequest<TutorPublicSession>("/api/tutor/sessions/"+s.id+"/explain",{revision:s.revision,style,approach},helpKey.current);setSession(updated);setDraft(updated.draft);if(updated.help.some(h=>h.key===helpKey.current && h.state==="ready"))helpKey.current="";}
  async function assessSaved(s:TutorPublicSession){
    setMessage("Your answers are saved and frozen, while feedback is being assessed…");
    try{const updated=await tutorRequest<TutorPublicSession>("/api/tutor/sessions/"+s.id+"/assess",{revision:s.revision});open(updated);setSessions(items=>[updated,...items.filter(i=>i.id!==updated.id)]);}
    catch(error){try{const restored=await tutorRequest<TutorPublicSession>("/api/tutor/sessions/"+s.id);open(restored);}catch{/* The acknowledged frozen snapshot stays visible for recovery. */}throw error;}
    setRecommendation(await tutorRequest<TutorNextAction>("/api/tutor/paths/"+pathId+"/recommendation"));
  }
  async function submit(){setMessage("Saving your answers before freezing the submission for feedback…");const s=await save({...draft,position:(session?.lesson?.blocks.length ?? 0)+2});submitKey.current ||= s.submission?.key ?? crypto.randomUUID();setMessage("Saving a frozen copy so an interruption cannot lose your submission…");const frozen=await tutorRequest<TutorPublicSession>("/api/tutor/sessions/"+s.id+"/freeze",{revision:s.revision},submitKey.current);open(frozen);setSessions(items=>[frozen,...items.filter(i=>i.id!==frozen.id)]);await assessSaved(frozen);}
  async function retryAssessment(){if(session)await assessSaved(session);}
  async function ask(question:string,retryKey?:string){
    if(!session)return;
    if(askTarget.current!==question){askTarget.current=question;askKey.current="";}
    askKey.current=retryKey ?? (askKey.current || crypto.randomUUID());
    const saved=await save();
    setMessage("Your work is saved while your companion considers this lesson and your question…");
    const updated=await tutorRequest<TutorPublicSession>("/api/tutor/sessions/"+saved.id+"/ask",{revision:saved.revision,question},askKey.current);
    setSession(updated);setDraft(updated.draft);setSessions(items=>[updated,...items.filter(item=>item.id!==updated.id)]);
    if(updated.companion?.some(t=>t.key===askKey.current && t.state==="ready"))askKey.current="";
  }
  async function nextActivity(){
    if(!path)return;
    if(recommendation?.complete){window.location.assign("/learning?path="+pathId+"&view=progress");return;}
    if(recommendation?.sessionId && recommendation.kind!=="repair"){window.location.assign("/learning?path="+pathId+"&session="+recommendation.sessionId);return;}
    const moduleId=recommendation?.moduleId ?? path.placement?.selected;
    if(moduleId)await start(moduleId,recommendation?.kind==="repair"?recommendation.sessionId ?? undefined:undefined);
  }
  const journeyProps=path?{path,sessions,busy,open:(saved:TutorPublicSession)=>window.location.assign("/learning?path="+pathId+"&session="+saved.id),start:(id:string)=>run(()=>start(id))}:null;
  const title=busy && !path?"Opening your saved learning journey":view==="lesson"?session?.lesson?.title ?? "Prepare your next lesson":view==="path"?"My Path":view==="progress"?"My Progress":"What’s next";
  return <main id="main" className={"learning-shell tutor-shell journey-shell"+(view==="lesson"?" journey-is-learning":"")}>
    <div className="journey-appbar"><nav aria-label="Learning navigation">{(["today","path","progress"] as const).map(v=><a key={v} href={"/learning?path="+pathId+(v==="today"?"":"&view="+v)} aria-current={view===v?"page":undefined}>{v==="today"?"Today":v==="path"?"My Path":"My Progress"}</a>)}</nav>
    <details className="journey-account"><summary aria-label="Account and preferences"><span aria-hidden="true">◉</span><span>My account</span></summary><div><h2>Your learning preferences</h2><TextSizeControl/>{path && <TutorPreferencesEditor key={path.revision+":"+preferenceEpoch} path={path} busy={busy} onDirty={setPreferencesDirty} save={preferences=>run(async()=>{const updated=await tutorRequest<TutorPublicPath>("/api/tutor/paths/"+pathId+"/preferences",{revision:path.revision,preferences});setPath(updated);setPreferencesDirty(false);})}/>}<a href={"/onboarding?path="+encodeURIComponent(pathId)}>Review my goal and starting point</a><LogoutButton confirmLeave={leave.confirm}/></div></details></div>
    <header className="journey-page-heading">{view==="lesson"?<a className="journey-back" href={"/learning?path="+pathId+"&view=path"}>← Return to my path</a>:null}<h1 ref={heading} tabIndex={-1}>{title}</h1></header>
    <TutorLoading busy={busy} message={message}/>
    {!path && !busy && <section className="journey-empty"><h2>Your saved journey needs another attempt to load</h2><p>Your work remains stored, and you can reopen it without generating another path.</p><button onClick={()=>run(restore)}>Reload saved learning</button></section>}
    {path && !path.placement && <section className="journey-empty"><h2>Choose a comfortable place to begin your learning</h2><p>Your path is saved, and you can start from the beginning or try a short diagnostic.</p><a className="primary-button" href={"/onboarding?path="+pathId}>Choose my starting point →</a></section>}
    {journeyProps && view==="today" && <TutorToday {...journeyProps} recommendation={recommendation} onNext={()=>run(nextActivity)}/>}
    {journeyProps && view==="path" && <TutorRoadmap {...journeyProps} current={recommendation?.moduleId ?? path?.placement?.selected}/>}
    {journeyProps && view==="progress" && <TutorProgress {...journeyProps}/>}
    {view==="lesson" && session && (session.state!=="ready"?<section className="notice"><h2>Your lesson is saved while preparation needs another step</h2><p>{session.generation.code === "MODEL_VISUAL_REQUIRED"?"The generated lesson did not include the required interactive scenes, so retry explicitly to prepare visual teaching.":session.generation.code === "MODEL_LIMITED"?"The provider has reached a usage limit, so wait before making another request.":"Generation was interrupted, and retrying will preserve this saved request."}</p><button disabled={busy || session.generation.count>=2 || waiting} onClick={()=>run(async()=>open(await tutorRequest<TutorPublicSession>("/api/tutor/sessions/"+session.id+"/retry",{})))}>Retry saved lesson</button></section>:<div className={"journey-learning-layout"+(session.submission && !session.companion?.length?" showcase-feedback-layout":"")}><TutorLessonWorkspace key={session.id} session={session} draft={draft} setDraft={value=>{setDraft(value);setResult(null);}} busy={busy} save={()=>run(async()=>{await save();},"Saving…","Saved")} move={position=>run(async()=>{await save({...draft,position});},"Saving…")} result={result} check={()=>run(async()=>{const s=await save();setResult(await tutorRequest("/api/tutor/sessions/"+s.id+"/check",{revision:s.revision}));})} explain={(style,approach)=>run(()=>explain(style,approach),"Saving your work before preparing a different explanation…")} submit={()=>run(submit)} retry={()=>run(retryAssessment)} fresh={()=>run(()=>start(session.module.id,session.id),"Preparing a fresh practice task around your saved feedback…")} continueLearning={()=>window.location.assign("/learning?path="+pathId)}/>{(!session.submission || !!session.companion?.length) && <TutorCompanion key={session.id+"-companion"} session={session} busy={busy} ask={(question,key)=>run(()=>ask(question,key),"Saving your work before asking your learning companion…")} onDirty={setCompanionDirty}/>}</div>)}
    <details className="compact-limitations"><summary>About this preview</summary><p>Lessons and assessments still need independent review. Guided practice is recorded separately from independent demonstration.</p></details>{leave.dialog}
  </main>;
}
