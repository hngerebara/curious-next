import type { Decision, Frozen, CriterionResult } from "../contracts/attempt";
import { blanketPhishingClaim, brandingEndorsement } from "./branding-inspection";
import { record } from "./course-policy";
import { choices } from "../contracts/simulation";

export const phishingReasons = ["complete","missing","ambiguous","branding_authenticates","conflicting_actions"];
export function validatePhishingAssessment(raw: unknown, frozen: Frozen): Decision {
  const failed: Decision = {status:"failed",rubricVersion:"CY-2-v2",policyVersion:"pilot-v1",criteria:[],code:"INVALID_ASSESSMENT"};
  const selected = choices(frozen.draft.prompt);
  if (!selected || !record(raw) || Object.keys(raw).sort().join() !== "criteria,policyVersion,rubricVersion,status" || raw.rubricVersion !== "CY-2-v2" || raw.policyVersion !== "pilot-v1" || !["succeeded","uncertain"].includes(String(raw.status)) || !Array.isArray(raw.criteria) || raw.criteria.length !== 6) return failed;
  const results: CriterionResult[] = [];
  for (const item of raw.criteria) {
    if (!record(item) || Object.keys(item).sort().join() !== "citations,id,reason,result" || !frozen.task.criteria.some(c=>c.id === item.id) || results.some(c=>c.id === item.id) || !["met","not_met","uncertain"].includes(String(item.result)) || !phishingReasons.includes(String(item.reason)) || !Array.isArray(item.citations) || !item.citations.length || item.citations.length > 8) return failed;
    const reason = String(item.reason);
    if (item.result === "met" ? reason !== "complete" : item.result === "uncertain" ? !["ambiguous","conflicting_actions"].includes(reason) : ["complete","ambiguous"].includes(reason)) return failed;
    if (reason === "branding_authenticates" && item.id !== "C5") return failed;
    const citations: CriterionResult["citations"] = [];
    for (const citation of item.citations) {
      if (!record(citation) || Object.keys(citation).sort().join() !== "field,quote" || !(item.id === "C2" ? ["prompt","checklist","explanation"] : ["checklist","explanation"]).includes(String(citation.field)) || typeof citation.quote !== "string" || !citation.quote.trim() || citation.quote.length > 600) return failed;
      const field = citation.field as "prompt" | "checklist" | "explanation";
      const start = frozen.draft[field].indexOf(citation.quote);
      if (start < 0) return failed;
      citations.push({field,quote:citation.quote,start,end:start+citation.quote.length});
    }
    const criterion = frozen.task.criteria.find(c=>c.id === item.id)!;
    const feedback = item.result === "met" ? `Your cited work meets ${criterion.title.toLowerCase()}.` : item.result === "uncertain" ? "This reasoning is ambiguous. No new demonstration is awarded. Review the cited work." : criterion.remediation;
    results.push({id:criterion.id,result:item.result as CriterionResult["result"],reason,citations,feedback});
  }
  if (raw.status === "succeeded" && results.some(c=>c.id !== "C2" && c.result === "uncertain")) return failed;
  // Selected unsafe actions are authoritative even when fluent reasoning or the model says otherwise.
  const unsafe = [...selected.request,...selected.routine].some(a=>a === "use-link" || a === "send-password");
  const safe = results.find(c=>c.id === "C2")!;
  safe.result = unsafe ? "not_met" : "met";
  safe.reason = unsafe ? "unsafe_action" : "complete";
  safe.feedback = unsafe ? "A selected message link or sensitive-information reply is unsafe. Choose a response through an independent trusted route." : "Neither message selects the link or sensitive-information reply.";
  safe.citations = [{field:"prompt",quote:frozen.draft.prompt,start:0,end:frozen.draft.prompt.length}];
  const reasoning = results.find(c=>c.id === "C5")!;
  const endorsement = brandingEndorsement(frozen.draft);
  if (endorsement) {
    reasoning.result = "not_met";
    reasoning.reason = "branding_authenticates";
    reasoning.citations = [endorsement];
    reasoning.feedback = "Your explicit rationale treats familiar branding as authentication. A logo does not establish who sent a message. Practise independent verification, then apply it to a fresh scenario.";
  } else if (reasoning.reason === "branding_authenticates") {
    // Do not confirm a quoted/rejected belief or an unsupported broad classifier output.
    reasoning.reason = "missing";
  }
  if (unsafe && reasoning.result === "met") {
    reasoning.result = "uncertain";
    reasoning.reason = "ambiguous";
    reasoning.feedback = "The selected unsafe action conflicts with otherwise safe reasoning. Clarify the decision on a fresh task. No new demonstration is awarded.";
  }
  const routineReasoning = results.find(c=>c.id === "C6")!;
  if (selected.routine.some(a=>a === "use-link" || a === "send-password") && routineReasoning.result === "met") {
    routineReasoning.result = "uncertain";
    routineReasoning.reason = "ambiguous";
    routineReasoning.feedback = "The routine-message action conflicts with the claimed safe response. Clarify the decision independently.";
  }
  const blanket = blanketPhishingClaim(frozen.draft);
  if (blanket) {
    for (const row of [reasoning,routineReasoning]) {
      row.result = "not_met";
      row.reason = "missing";
      row.citations = [blanket];
      row.feedback = "These cues do not establish that every message is phishing. Evaluate the routine message's lower-risk context and preserve uncertainty.";
    }
  }
  const status = results.some(c=>c.result === "uncertain") ? "uncertain" : "succeeded";
  return {status,rubricVersion:"CY-2-v2",policyVersion:"pilot-v1",criteria:results,code:status === "uncertain" ? "ASSESSOR_UNCERTAIN" : null};
}
