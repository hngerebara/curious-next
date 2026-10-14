"use client";
import { useEffect, useState } from "react";
import type { Enrollment, EntryPreferences, EntryRecommendation } from "../contracts/course-plan";

export function EntryGuidanceView({ enrollment, recommendation, save, beginning, busy, onDirtyChange }: { enrollment: Enrollment; recommendation: EntryRecommendation; save: (input: EntryPreferences) => void; beginning: () => void; busy: boolean; onDirtyChange?:(dirty:boolean)=>void }) {
  const [preferences, setPreferences] = useState(enrollment.preferences);
  const dirty=preferences.explanationLevel !== enrollment.preferences.explanationLevel || preferences.sessionMinutes !== enrollment.preferences.sessionMinutes;
  useEffect(()=>{onDirtyChange?.(dirty);return()=>onDirtyChange?.(false);},[dirty,onDirtyChange]);
  const [overview, setOverview] = useState(false);
  const proposal = enrollment.plan.result?.state === "ready-preview" ? enrollment.plan.result.proposal : null;
  const module = proposal?.modules.find(m => m.objective.id === enrollment.startObjectiveId) ?? proposal?.modules[0];
  function action(id: string) {
    if (id === "choose-beginning") beginning();
    else if (id === "preview-module") setOverview(true);
    else document.getElementById(id === "preferences" ? "saved-explanation" : "starting-point")?.focus();
  }
  return <section className="card" aria-label="Your next action"><h2>Your next action</h2><p>{recommendation.primary.reason}</p><button disabled={busy} onClick={() => action(recommendation.primary.id)}>{recommendation.primary.title} (about {recommendation.primary.minutes} minutes)</button>{recommendation.alternatives.map(item => <button className="secondary-button" disabled={busy} key={item.id} onClick={() => action(item.id)}>{item.title} (about {item.minutes} minutes)</button>)}
    {overview && module && <section aria-label="Module preview" role="status"><h3>{module.objective.title}</h3><p>{module.introduction}</p><p>Capability: not assessed. This is a module overview. Reviewed learning and practice activities are pending.</p></section>}
    {enrollment.placement && proposal?.subject === "practical-ai" && proposal.modules.some(m => m.objective.id === "AI-2") && <a className="primary-button" href={`/learning?enrollment=${encodeURIComponent(enrollment.id)}`}>Open Practical AI activity</a>}
    {enrollment.placement && proposal?.subject === "cybersecurity" && proposal.modules.some(m=>m.objective.id === "CY-2") && <a className="primary-button" href={`/learning?enrollment=${encodeURIComponent(enrollment.id)}`}>Open phishing activity</a>}
    <form onSubmit={e => { e.preventDefault(); save(preferences); }}><h3>Saved course preferences</h3><label htmlFor="saved-explanation">Explanation level</label><select disabled={busy} id="saved-explanation" value={preferences.explanationLevel} onChange={e => setPreferences({ ...preferences, explanationLevel: e.target.value as EntryPreferences["explanationLevel"] })}>{["very-simple", "beginner", "standard", "technical"].map(level => <option key={level} value={level}>{level === "very-simple" ? "Very simple" : level === "beginner" ? "Beginner-friendly" : level === "standard" ? "Standard" : "Technical"}</option>)}</select><label htmlFor="saved-time">Session length</label><select disabled={busy} id="saved-time" value={preferences.sessionMinutes} onChange={e => setPreferences({ ...preferences, sessionMinutes: Number(e.target.value) as EntryPreferences["sessionMinutes"] })}>{[10, 20, 40].map(n => <option key={n} value={n}>{n} minutes</option>)}</select><p>English preview. Preferences change pacing and explanation style, while assessment criteria stay fixed.</p><button disabled={busy}>Save course preferences</button></form>
  </section>;
}
