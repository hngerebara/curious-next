"use client";
import "./tutor.css";
import { useEffect, useRef, useState } from "react";
import type { TutorGoal, TutorPublicPath } from "../contracts/tutor";
import { tutorDefaults, tutorRequest } from "./tutor-client";
import { TutorSetupForm } from "./tutor-setup-form";
import { TutorPathPreview } from "./tutor-path-preview";
import { TutorLoading } from "./tutor-loading";
import { useUnsavedTutor } from "./unsaved-tutor";
import { TutorDiagnostic } from "./tutor-diagnostic";
export function TutorOnboarding(){
 const [step,setStep]=useState<"goal"|"path">("goal"),[goal,setGoal]=useState<TutorGoal>(tutorDefaults),[baseline,setBaseline]=useState<TutorGoal>(tutorDefaults),[path,setPath]=useState<TutorPublicPath|null>(null),[paths,setPaths]=useState<TutorPublicPath[]>([]),[diagnosticDirty,setDiagnosticDirty]=useState(false),[diagnosticOpen,setDiagnosticOpen]=useState(false),[busy,setBusy]=useState(true),[message,setMessage]=useState("Loading…");
 const heading=useRef<HTMLHeadingElement>(null),key=useRef(""),running=useRef(false);
 const leave=useUnsavedTutor(diagnosticDirty || JSON.stringify(goal)!==JSON.stringify(baseline));
 async function run(work:()=>Promise<void>,label="Saving…"){
  if(running.current)return;running.current=true;setBusy(true);setMessage(label);
  try{await work();setMessage("");}catch(error){setMessage(error instanceof Error?error.message:"Your saved work is available, so try again.");}finally{running.current=false;setBusy(false);heading.current?.focus();}
 }
 function open(item:TutorPublicPath){const savedGoal={...item.goal,preferences:item.preferences ?? item.goal.preferences};setPath(item);setGoal(savedGoal);setBaseline(savedGoal);setStep("path");key.current=item.requestKey;setPaths(items=>[item,...items.filter(p=>p.id!==item.id)]);window.history.replaceState(null,"","/onboarding?path="+item.id);}
 async function restore(){const items=await tutorRequest<TutorPublicPath[]>("/api/tutor/paths");setPaths(items);const id=new URL(window.location.href).searchParams.get("path"),item=id?await tutorRequest<TutorPublicPath>("/api/tutor/paths/"+encodeURIComponent(id)):items[0];if(item)open(item);}
 useEffect(()=>{run(restore,"Loading your setup…");},[]);
 async function generate(){if(JSON.stringify(goal)!==JSON.stringify(baseline) || !key.current)key.current=crypto.randomUUID();setDiagnosticOpen(false);open(await tutorRequest<TutorPublicPath>("/api/tutor/paths",goal,key.current));}
 async function accepted(){if(!path)throw Error("NOT_FOUND");if(path.state==="accepted")return path;const saved=await tutorRequest<TutorPublicPath>("/api/tutor/paths/"+path.id+"/accept",{revision:path.revision});open(saved);return saved;}
 async function begin(){if(diagnosticDirty && !await leave.confirm())return;let saved=await accepted();if(!saved.placement)saved=await tutorRequest<TutorPublicPath>("/api/tutor/paths/"+saved.id+"/placement",{revision:saved.revision,answers:[]});window.location.assign("/learning?path="+encodeURIComponent(saved.id));}
 async function place(answers:number[],selected?:string){const saved=await accepted();open(await tutorRequest<TutorPublicPath>("/api/tutor/paths/"+saved.id+"/placement",{revision:saved.revision,answers,...(selected?{selected}:{})}));setDiagnosticOpen(false);setDiagnosticDirty(false);}
 async function edit(){if(!await leave.confirm())return;setDiagnosticOpen(false);setDiagnosticDirty(false);setStep("goal");heading.current?.focus();}
 const ready=path?.proposal?.state==="ready" && ["proposed","accepted"].includes(path.state);
 const actions=ready?<div className="compact-path-start"><button disabled={busy} onClick={()=>run(begin,"Opening your learning…")}>{busy && <span className="tutor-spinner" aria-hidden="true"/>}{path?.placement?"Continue learning →":diagnosticOpen?"Start from the beginning →":"Start learning →"}</button><button className="text-button" disabled={busy} onClick={edit}>Edit goal or preferences</button></div>:undefined;
 return <main id="main" className="onboarding-shell journey-setup journey-shell compact-setup"><a href="/learning" className="journey-back">← My learning</a><h1 ref={heading} tabIndex={-1}>{step==="goal"?"What would you like to learn?":"Your learning path"}</h1><TutorLoading busy={busy} message={message}/>
 {step==="goal" && !(busy && message.startsWith("Loading"))?<TutorSetupForm goal={goal} setGoal={setGoal} step="goal" busy={busy} back={()=>setStep("path")} generate={()=>run(generate,"Building your path…")}/>:step==="path" && path && <>
 <TutorPathPreview path={path} busy={busy} showActions={false} introActions={actions} accept={()=>run(begin)} retry={()=>run(async()=>open(await tutorRequest<TutorPublicPath>("/api/tutor/paths/"+path.id+"/retry",{})),"Preparing your saved path…")}/>
 {ready && <>
 <details className="compact-placement" open={diagnosticOpen} onToggle={event=>setDiagnosticOpen(event.currentTarget.open)}><summary>{path.placement?"Starting point":"Check my starting point (optional)"}</summary>{path.state==="accepted"?<TutorDiagnostic key={path.id} embedded path={path} busy={busy} onDirty={setDiagnosticDirty} place={(answers,selected)=>run(()=>place(answers,selected),"Saving your starting point…")}/>:<button className="secondary-button" disabled={busy} onClick={()=>run(async()=>{await accepted();setDiagnosticOpen(true);},"Preparing your check…")}>Use this path and try the check</button>}</details></>}
 {path.proposal && path.proposal.state!=="ready" && <form onSubmit={event=>{event.preventDefault();run(generate,"Updating your path…");}}><label htmlFor="clarification">{path.proposal.question}</label><textarea id="clarification" required maxLength={500} value={goal.clarification} disabled={busy} onChange={event=>setGoal({...goal,clarification:event.target.value})}/><button disabled={busy}>Update my path</button></form>}
 {!ready && <button className="text-button" disabled={busy} onClick={edit}>Edit goal or preferences</button>}
 </>}
 <details className="compact-setup-tools"><summary>Saved goals and more options</summary>{paths.map(item=><p key={item.id}><button className="text-button" disabled={busy} onClick={async()=>{if(await leave.confirm()){setDiagnosticOpen(false);open(item);}}}>{item.proposal?.title ?? item.goal.text}</button></p>)}<a href="/learning?legacy=1">Earlier course work</a><button className="text-button" disabled={busy} onClick={async()=>{if(await leave.confirm())await run(restore,"Reloading…");}}>Reload saved setup</button><button className="text-button" disabled={busy} onClick={async()=>{if(!await leave.confirm())return;setPath(null);setGoal(tutorDefaults);setBaseline(tutorDefaults);setDiagnosticOpen(false);setDiagnosticDirty(false);key.current="";setStep("goal");window.history.replaceState(null,"","/onboarding");}}>Choose a new goal</button>{path && ["failed","generating"].includes(path.state) && <button className="text-button" disabled={busy} onClick={()=>run(async()=>{key.current=crypto.randomUUID();await generate();},"Building an updated path…")}>Build an updated path</button>}</details>
 <details className="compact-limitations"><summary>About this preview</summary><p>Lessons and assessment still need independent review, while your saved work remains available.</p></details>{leave.dialog}</main>;
}
