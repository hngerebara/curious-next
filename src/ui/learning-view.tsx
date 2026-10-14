"use client";
import { useLearningController } from "./learning-controller";
import { LearningNavigation } from "./learning-navigation";
import { TodayPanel, PathPanel, WorkPanel, activityLabel } from "./learning-panels";
import { AttemptWorkspace } from "./attempt-workspace";

export function LearningView() {
  const c=useLearningController();
  const courseResult=c.course?.plan.result;
  const modules=courseResult?.state === "ready-preview" ? courseResult.proposal.modules : [];
  const position=modules.findIndex(module=>module.objective.id === c.attempt?.task.objectiveId);
  const goal=c.course?.plan.goal.input.goalText;
  const title=c.view === "today" ? "Your next step, made clear." : c.view === "path" ? "Your learning path." : c.view === "work" ? "Your work, kept together." : c.attempt?.task.objectiveId === "CY-2" ? "Pause. Check. Choose safely." : "Make your prompt work.";
  return <main id="main" className="learning-shell" aria-busy={c.busy}><LearningNavigation view={c.view} enrollmentId={c.enrollmentId} busy={c.busy || !c.learning} navigate={c.navigate} confirmLeave={c.confirmLeave}/><div className="page-intro"><div><p className="eyebrow">{c.view === "activity" && c.attempt ? activityLabel(c.attempt.mode) : "Your learning space"}</p><h1 ref={c.heading} tabIndex={-1}>{title}</h1>{goal && <p className="lead">Your goal: {goal}</p>}</div><details className="preview-note"><summary>English learning preview</summary><p>Curriculum and AI assessment await independent review. Skill labels describe preview evidence, not approved qualifications. Diagnostic placement is separate.</p></details></div><p role="status" className="save-status">{c.message}{c.dirty ? " You have unsaved edits." : ""}</p>{c.expired && <a href="/access">Sign in again</a>}
    {!c.learning && !c.busy && !c.enrollmentId && <section className="empty-state"><h2>What would you like to be able to do?</h2><p>Choose a goal in Practical AI or Cybersecurity to get a useful starting point.</p><a className="primary-button" href="/onboarding">Set my learning goal <span aria-hidden="true">↗</span></a></section>}
    {!c.learning && !c.busy && c.enrollmentId && <section className="empty-state"><h2>Could not open saved learning.</h2><p>Retry loading your saved course and work.</p><button disabled={c.expired} onClick={()=>c.run(c.restore)}>Reload saved learning</button></section>}
    {c.learning && c.view === "today" && <TodayPanel learning={c.learning} busy={c.busy || c.expired} create={mode=>c.run(()=>c.create(mode))} inspect={id=>c.run(()=>c.inspect(id))}/>}
    {c.learning && c.view === "path" && <PathPanel learning={c.learning} course={c.course}/>}
    {c.learning && c.view === "work" && <WorkPanel learning={c.learning} busy={c.busy || c.expired} inspect={id=>c.run(()=>c.inspect(id))}/>}
    {c.view === "activity" && c.attempt && <>{position>=0 && <p className="muted">Your path: skill {position+1} of {modules.length}, {modules[position].objective.title}.</p>}<div className="section-actions"><button className="text-button" disabled={c.busy} onClick={()=>c.navigate("today")}>← Back to Today</button><span className="muted">{c.attempt.assisted ? "Help recorded" : "No instructional help"} · {c.attempt.submission ? "Answers submitted" : "Saved task"}</span></div><AttemptWorkspace key={c.attempt.id} attempt={c.attempt} draft={c.draft} setDraft={c.setDraft} busy={c.busy || c.expired} save={()=>c.run(async()=>{await c.saveDraft();})} variant={level=>c.run(()=>c.variant(level))} practice={prior=>c.run(()=>c.practice(prior))} help={kind=>c.run(()=>c.help(kind))} submit={()=>c.run(c.submit)} assess={()=>c.run(async()=>{await c.assess();})} review={()=>c.run(c.review)} reload={()=>c.run(c.reload)} recommendation={c.learning?.recommendation} next={()=>c.navigate("today")}/></>}
  </main>;
}
