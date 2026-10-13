import type { Frozen } from "../src/contracts/attempt";
export const simulationDraft={prompt:JSON.stringify({request:["verify","report-known"],routine:["continue-routine"]}),checklist:"The unexpected urgent sign-in demand is suspicious, not conclusive proof. Familiar branding does not authenticate a sender. I open the official app independently and use Help → Report suspicious message if suspicion persists.",explanation:"The expected reminder requires no sensitive action. I continue the planned activity without claiming its sender is proven genuine."};
export function simulationDecision(frozen:Frozen) {
  return {rubricVersion:"CY-2-v2",policyVersion:"pilot-v1",status:"succeeded",criteria:frozen.task.criteria.map(c=>({id:c.id,result:"met",reason:"complete",citations:[{field:c.id === "C6" ? "explanation" : "checklist",quote:c.id === "C6" ? frozen.draft.explanation : frozen.draft.checklist}]}))};
}
