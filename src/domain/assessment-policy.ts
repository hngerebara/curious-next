import type { Capability, Decision, Frozen, LearningRecommendation, Evidence, CriterionResult, EvidenceField } from "../contracts/attempt";
import { record } from "./course-policy";

const boundedText = (value: unknown, minimum: number, maximum: number): value is string => typeof value === "string" && value.trim().length >= minimum && value.length <= maximum && !/[\u0000-\u0008]/.test(value);

export const emptyCapability: Capability = { state: "not_assessed", firstIndependentEvidenceId: null, latestEvidenceId: null, retention: "not_checked", transfer: "not_checked", policyVersion: "pilot-v1" };
export function validateAssessment(raw: unknown, frozen: Frozen): Decision {
  const failed: Decision = { status: "failed", rubricVersion: "AI-2-v2", policyVersion: "pilot-v1", criteria: [], code: "INVALID_ASSESSMENT" };
  if (!record(raw) || Object.keys(raw).sort().join() !== "criteria,policyVersion,rubricVersion,status" || raw.rubricVersion !== frozen.task.rubricVersion || raw.policyVersion !== frozen.task.policyVersion || !["succeeded", "uncertain"].includes(String(raw.status)) || !Array.isArray(raw.criteria) || raw.criteria.length !== 6) return failed;
  const criteria: CriterionResult[] = [];
  const fields = { ...frozen.draft, response: frozen.response };
  for (const row of raw.criteria) {
    if (!record(row) || Object.keys(row).sort().join() !== "citations,feedback,id,result" || !frozen.task.criteria.some(c=>c.id === row.id) || criteria.some(c=>c.id === row.id) || !["met", "not_met", "uncertain"].includes(String(row.result)) || !boundedText(row.feedback, 5, 600) || !Array.isArray(row.citations) || row.citations.length < 1 || row.citations.length > 9) return failed;
    const citations: CriterionResult["citations"] = [];
    for (const citation of row.citations) {
      if (!record(citation) || Object.keys(citation).sort().join() !== "field,quote" || !["prompt", "checklist", "explanation", "response"].includes(String(citation.field)) || !boundedText(citation.quote, 1, 600)) return failed;
      const field = citation.field as EvidenceField;
      const start = fields[field].indexOf(citation.quote);
      if (start < 0) return failed;
      citations.push({ field, quote: citation.quote, start, end: start + citation.quote.length });
    }
    // Task/context/constraint/format claims require prompt evidence, inspection and reasoning their own learner fields.
    const requiredField = ["A1", "A2", "A3", "A4"].includes(String(row.id)) ? "prompt" : row.id === "A5" ? "checklist" : "explanation";
    if (!citations.some(c=>c.field === requiredField)) return failed;
    if (row.id === "A5" && !citations.some(c=>c.field === "response")) return failed;
    criteria.push({ id: row.id as CriterionResult["id"], result: row.result as CriterionResult["result"], feedback: row.feedback, citations });
  }
  if (raw.status === "succeeded" && criteria.some(c=>c.result === "uncertain")) return failed;
  return { status: raw.status as "succeeded" | "uncertain", rubricVersion: "AI-2-v2", policyVersion: "pilot-v1", criteria, code: raw.status === "uncertain" ? "ASSESSOR_UNCERTAIN" : null };
}
export function demonstrates(frozen: Frozen, decision: Decision) {
  return frozen.mode === "independent" && !frozen.assisted && decision.status === "succeeded" && decision.criteria.length === 6 && decision.criteria.every(c=>c.result === "met");
}
export function projectCapability(prior: Capability, independent: boolean, evidenceId: string): Capability {
  return { ...prior, state: independent || prior.firstIndependentEvidenceId ? "demonstrated" : "developing", firstIndependentEvidenceId: prior.firstIndependentEvidenceId ?? (independent ? evidenceId : null), latestEvidenceId: evidenceId };
}
export function learningRecommendation(capability: Capability, budget: number, gap?: string): LearningRecommendation {
  const demonstrated = capability.state === "demonstrated";
  return { objectiveId: demonstrated ? "AI-3" : "AI-2", kind: demonstrated ? "learn" : "practise", title: demonstrated ? "Learn to iterate against a brief" : budget === 10 ? "Inspect one prompt requirement" : "Practise a clear prompt, then try fresh proof", reason: demonstrated ? "Independent preview evidence meets AI-2 criteria. Next, revise outputs against requirements. AI-1 prerequisite evidence is still separate. AI-3 content is awaiting implementation/review." : gap ?? "Independent evidence is still missing. Use the reference practice without changing the proof standard.", minutes: budget === 10 ? 10 : 20, evidenceId: capability.latestEvidenceId, scope: "preview" };
}

export function compatibleEvidence(evidence: Evidence[]) {
  return evidence.filter(e=>e.objectiveId === "AI-2" && e.rubricVersion === "AI-2-v2" && e.policyVersion === "pilot-v1").sort((a,b)=>a.assessedAt.localeCompare(b.assessedAt) || a.id.localeCompare(b.id));
}
export function capabilityFromEvidence(evidence: Evidence[]): Capability {
  return compatibleEvidence(evidence).reduce((prior,e)=>projectCapability(prior,e.demonstrated,e.id),emptyCapability);
}
