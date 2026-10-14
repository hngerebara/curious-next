"use client";
import { useState } from "react";
import type { DiagnosticPacket, Enrollment } from "../contracts/course-plan";

export function PlacementView({ enrollment, packet, diagnose, place, busy }: { enrollment: Enrollment; packet: DiagnosticPacket | null; diagnose: () => void; place: (mode: "skip" | "diagnostic" | "beginning", answers?: string[], version?: string) => void; busy: boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const proposal = enrollment.plan.result?.state === "ready-preview" ? enrollment.plan.result.proposal : null;
  return <section className="card" id="starting-point" tabIndex={-1} aria-label="Optional starting point">
    <h2>{enrollment.placement ? "Your provisional starting point" : "Where would you like to begin?"}</h2>
    <p className="notice">You can begin straight away or answer a few optional questions. Questions suggest a starting point, they do not demonstrate a skill.</p>
    {!enrollment.placement && <><button type="button" disabled={busy} onClick={() => place("skip")}>Start from the beginning</button><button className="secondary-button" type="button" disabled={busy} onClick={diagnose}>Answer optional starting questions</button>{packet && <form onSubmit={(e) => { e.preventDefault(); place("diagnostic", packet.questions.map(q => answers[q.id]), packet.version); }}>{packet.questions.map(question => <fieldset key={question.id}><legend>{question.prompt}</legend>{question.options.map(option => <label className="radio-choice" key={option.id}><input required type="radio" name={question.id} checked={answers[question.id] === option.id} onChange={() => setAnswers({ ...answers, [question.id]: option.id })} />{option.label}</label>)}</fieldset>)}<button type="submit" disabled={busy}>Suggest a starting point</button></form>}</>}
    {enrollment.placement && <><p>{enrollment.placement.reason}</p>{enrollment.placement.mode === "diagnostic" && !enrollment.placement.policyVersion && <p>This saved placement used the earlier self-reported readiness check.</p>}<p><strong>Starting module:</strong> {proposal?.modules.find(m => m.objective.id === enrollment.startObjectiveId)?.objective.title}</p>{enrollment.startObjectiveId !== proposal?.modules[0].objective.id && <button className="secondary-button" type="button" disabled={busy} onClick={() => place("beginning")}>Start from the beginning instead</button>}<p>Your starting point is saved separately from the diagnostic. Available activities remain learning previews until content and assessment review is complete.</p></>}
  </section>;
}
