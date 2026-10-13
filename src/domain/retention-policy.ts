import type { Capability, Evidence, ObjectiveId, LearningRecommendation, Learning } from "../contracts/attempt";

export const recallPolicy = { version:"pilot-v1", intervalDays:[1,3,7,14,30], failedCheckDelayDays:1 } as const;
const intervals = recallPolicy.intervalDays;
export function objectiveEvidence(evidence: Evidence[], objective: ObjectiveId) {
  return evidence.filter(e=>e.objectiveId === objective && e.rubricVersion === `${objective}-v2` && e.policyVersion === "pilot-v1").sort((a,b)=>(a.sequence ?? 0)-(b.sequence ?? 0) || a.assessedAt.localeCompare(b.assessedAt) || a.id.localeCompare(b.id));
}
export function retentionProjection(evidence: Evidence[], objective: ObjectiveId, now = new Date()) {
  const rows = objectiveEvidence(evidence,objective);
  const capability: Capability = {state:"not_assessed",firstIndependentEvidenceId:null,latestEvidenceId:null,retention:"not_checked",transfer:"not_checked",reviewReasons:[],policyVersion:"pilot-v1"};
  const misconceptions: Learning["misconceptions"] = [];
  let recallDueAt: string | null = null;
  let interval = 0;
  let lastRecall: Evidence | null = null;
  let lastTransfer: Evidence | null = null;
  for (const row of rows) {
    capability.latestEvidenceId = row.id;
    const allMet = row.criteria.length === 6 && row.criteria.every(c=>c.result === "met");
    const initial = row.type === "independent_application" && !row.assisted && row.demonstrated && allMet;
    if (initial && !capability.firstIndependentEvidenceId) {
      capability.firstIndependentEvidenceId = row.id;
      recallDueAt = new Date(Date.parse(row.assessedAt)+intervals[0]*86400000).toISOString();
    }
    if (row.misconception) {
      const open = misconceptions.find(m=>m.state === "confirmed");
      if (!open) misconceptions.push({state:"confirmed",sourceEvidenceId:row.id,resolutionEvidenceId:null,...row.misconception});
    } else if (!row.assisted && allMet && ["independent_application","transfer"].includes(row.type)) {
      for (const misconception of misconceptions.filter(m=>m.state === "confirmed")) {
        const source = rows.find(e=>e.id === misconception.sourceEvidenceId)!;
        // A copied correction, the same scenario or another assessment of the same attempt cannot resolve history.
        if (row.attemptId !== source.attemptId && row.taskVersion && source.taskVersion && row.taskVersion !== source.taskVersion) {
          misconception.state = "resolved";
          misconception.resolutionEvidenceId = row.id;
        }
      }
    }
    if (capability.firstIndependentEvidenceId && !row.assisted && ["retention","transfer"].includes(row.type)) {
      if (row.type === "retention") {
        capability.retention = allMet ? "demonstrated" : "needs_review";
        interval = allMet ? Math.min(interval+1,intervals.length-1) : 0;
        recallDueAt = new Date(Date.parse(row.assessedAt)+(allMet ? intervals[interval] : recallPolicy.failedCheckDelayDays)*86400000).toISOString();
        lastRecall = row;
      } else { capability.transfer = allMet ? "demonstrated" : "needs_review"; lastTransfer = row; }
    }
    capability.state = capability.firstIndependentEvidenceId ? "demonstrated" : "developing";
  }
  capability.reviewReasons = [ ...(misconceptions.some(m=>m.state === "confirmed") ? ["branding-authenticity"] : []), ...(capability.retention === "needs_review" ? ["retention"] : []), ...(capability.transfer === "needs_review" ? ["transfer"] : []) ];
  if (capability.firstIndependentEvidenceId && capability.reviewReasons.length) capability.state = "needs_review";
  const recallAvailable = !!recallDueAt && Date.parse(recallDueAt) <= now.getTime();
  // A recall success schedules the next check. The UI always offers a non-review action alongside it.
  const transferAvailable = !!capability.firstIndependentEvidenceId && capability.transfer !== "demonstrated";
  return {capability,recallDueAt,recallAvailable,transferAvailable,misconceptions,lastRecall,lastTransfer};
}
export function retentionRecommendation(projection: ReturnType<typeof retentionProjection>, objective: ObjectiveId, budget: number, gap?: string): LearningRecommendation {
  const {capability,misconceptions,recallAvailable,transferAvailable} = projection;
  const base = {objectiveId:objective,minutes:budget === 10 ? 10 : 20,evidenceId:capability.latestEvidenceId,scope:"preview" as const};
  const open = misconceptions.find(m=>m.state === "confirmed");
  if (open) return {...base,evidenceId:open.sourceEvidenceId,kind:"fix",title:"Compare appearance with independent verification",reason:"Your cited explanation treats familiar branding as authentication. Practise the distinction, then apply it independently to a fresh scenario."};
  if (!capability.firstIndependentEvidenceId) return {...base,kind:"practise",title:budget === 10 ? "Inspect one task requirement" : "Practise, then try a fresh independent task",reason:gap ?? "Independent evidence is still missing. Supported practice does not establish independent demonstration."};
  if (capability.transfer === "needs_review") return {...base,evidenceId:projection.lastTransfer?.id ?? base.evidenceId,kind:"transfer",title:"Recheck the skill in a new context",reason:"The latest transfer evidence needs work. Earlier independent demonstration remains visible."};
  if (recallAvailable) return {...base,kind:"recall",title:"Recall the skill on a fresh task",reason:"Your evidence-based recall check is due. One recall check is suggested alongside a non-review option."};
  if (capability.retention === "needs_review") return {...base,evidenceId:projection.lastRecall?.id ?? base.evidenceId,kind:"practise",title:budget === 10 ? "Practise one missed recall requirement" : "Practise the missed recall criteria",reason:`${projection.lastRecall?.criteria.find(c=>c.result !== "met")?.feedback ?? "The latest recall check needs work."} Earlier independent demonstration remains visible. A fresh recall recheck appears when due.`};
  if (transferAvailable) return {...base,kind:"transfer",title:"Apply the skill in a new context",reason:"Initial demonstration is recorded. Transfer to a different scenario family has not passed yet."};
  return {...base,kind:"learn",title:objective === "CY-2" ? "Prepare for safer account protection" : "Learn to iterate against a brief",reason:"Initial demonstration and separate transfer are recorded. The next module remains awaiting implementation/review. Recall appears when due."};
}
