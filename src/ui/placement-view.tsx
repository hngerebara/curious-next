"use client";
import { useState } from "react";
import type { Enrollment } from "../contracts/course-plan";

export function PlacementView({ enrollment, place, busy }: { enrollment: Enrollment; place: (mode: "skip" | "diagnostic" | "beginning", answers?: string[]) => void; busy: boolean }) {
  const [diagnostic, setDiagnostic] = useState(false);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const proposal = enrollment.plan.result?.state === "ready-preview" ? enrollment.plan.result.proposal : null;
  const questions = proposal?.subject === "practical-ai" ? ["Do you distinguish fluent AI output from verified facts?", "Have you written a prompt with a task and relevant context?", "Have you checked an AI answer against supplied sources?", "Have you avoided sharing unnecessary personal information with AI?"] : ["Do you distinguish a digital threat from its possible consequence?", "Have you verified a suspicious message through a known channel?", "Have you used unique passwords or MFA?", "Do you know a safe way to recover an account?"];
  return <section className="card" aria-label="Optional starting point">
    <h2>{enrollment.placement ? "Your provisional starting point" : "Where would you like to begin?"}</h2>
    <p className="notice">Optional self-reported readiness check. These four questions are not an assessed ability test and create no achievement evidence.</p>
    {!enrollment.placement && <><button type="button" disabled={busy} onClick={() => place("skip")}>Start from the beginning</button><button className="secondary-button" type="button" disabled={busy} onClick={() => setDiagnostic(!diagnostic)}>Answer optional starting questions</button>{diagnostic && <form onSubmit={(e) => { e.preventDefault(); place("diagnostic", answers); }}>{questions.map((question, i) => <fieldset key={question}><legend>{question}</legend>{["yes", "no"].map((answer) => <label className="radio-choice" key={answer}><input required type="radio" name={`readiness-${i}`} value={answer} checked={answers[i] === answer} onChange={() => setAnswers(answers.map((v, index) => index === i ? answer : v))} />{answer === "yes" ? "Yes" : "Not yet / unsure"}</label>)}</fieldset>)}<button type="submit" disabled={busy}>Suggest a starting point</button></form>}</>}
    {enrollment.placement && <><p>{enrollment.placement.reason}</p><p><strong>Starting module:</strong> {proposal?.modules.find((m) => m.objective.id === enrollment.startObjectiveId)?.objective.title}</p>{enrollment.placement.mode === "diagnostic" && enrollment.startObjectiveId !== proposal?.modules[0].objective.id && <button className="secondary-button" type="button" disabled={busy} onClick={() => place("beginning")}>Start from the beginning instead</button>}<p>Your enrollment and placement are saved. Your selected starting module is saved separately from the provisional diagnostic. Learning activities will become available after their content and assessment review.</p></>}
  </section>;
}
