"use client";
import type { Draft, Task } from "../contracts/attempt";
import { choices, simulationActions } from "../contracts/simulation";

export const simulationLabels = {verify:"Open the established official app independently", "use-link":"Use the message link (simulated decision only)", "send-password":"Reply with sensitive information (simulated decision only)", "report-known":"Report through the known service channel", delete:"Delete without verification", "continue-routine":"Take no sensitive action and continue the planned activity"};
export function SimulationWorkspace({task,draft,setDraft,disabled}:{task:Task;draft:Draft;setDraft:(draft:Draft)=>void;disabled:boolean}) {
  let selected: Record<string,string[]> = {request:[],routine:[]};
  const saved = choices(draft.prompt);
  if (saved) selected = saved;
  else { try { const partial = JSON.parse(draft.prompt); if (partial && Array.isArray(partial.request) && Array.isArray(partial.routine)) selected = partial; } catch { selected = {request:[],routine:[]}; } }
  return <><p>All messages and destinations are fictional, inert text. Controls record decisions and perform no external action. Do not enter real account or identity information.</p>{task.messages?.map(message=><fieldset key={message.id} disabled={disabled}><legend>{message.id === "request" ? "Unexpected request" : "Routine message"}</legend><dl><dt>Display name</dt><dd>{message.displayName} (familiar branding)</dd><dt>Sender address</dt><dd>{message.sender}</dd><dt>Message</dt><dd>{message.text}</dd><dt>Displayed destination, inert</dt><dd>{message.destination}</dd></dl><p>Select one or more decisions.</p>{simulationActions.map(action=><label className="simulation-choice" key={action}><input type="checkbox" checked={selected[message.id].includes(action)} onChange={e=>setDraft({...draft,prompt:JSON.stringify({...selected,[message.id]:e.target.checked ? [...selected[message.id],action] : selected[message.id].filter(a=>a !== action)})})}/>{simulationLabels[action]}</label>)}</fieldset>)}<label htmlFor="checklist">Explain your actions for the unexpected message</label><textarea id="checklist" maxLength={2000} disabled={disabled} value={draft.checklist} onChange={e=>setDraft({...draft,checklist:e.target.value})}/><p>What looks suspicious? How would you check and report it? What does the branding tell you, and what is still uncertain?</p><label htmlFor="teach-back">Explain your actions for the routine message</label><textarea id="teach-back" maxLength={2000} disabled={disabled} value={draft.explanation} onChange={e=>setDraft({...draft,explanation:e.target.value})}/></>;
}

export function SimulationAnswer({value}:{value:string}) {
  const saved=choices(value);
  if(!saved)return <p className="preserve-text">{value}</p>;
  return <div>{(["request","routine"] as const).map(message=><section key={message}><h3>{message === "request" ? "Unexpected request" : "Routine message"}</h3><ul>{saved[message].map(action=><li key={action}>{simulationLabels[action]}</li>)}</ul></section>)}</div>;
}
