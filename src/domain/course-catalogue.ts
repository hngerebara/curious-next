import type { Catalogue, Intent } from "../contracts/course-plan";

export const courseCatalogue: Catalogue = {
  version: "demo-objectives-v1", status: "draft", objectives: [
    { id: "AI-1", title: "Understand strengths and limits", prerequisites: [], rubricVersion: "AI-1-draft-v1", references: ["R-AI-2"] },
    { id: "AI-2", title: "Write clear prompts", prerequisites: ["AI-1"], rubricVersion: "AI-2-v2", references: ["R-AI-1", "R-AI-2"] },
    { id: "AI-3", title: "Improve through iteration", prerequisites: ["AI-2"], rubricVersion: "AI-3-draft-v1", references: [] },
    { id: "AI-4", title: "Verify and protect information", prerequisites: ["AI-1"], rubricVersion: "AI-4-draft-v1", references: [] },
    { id: "AI-5", title: "Complete a workflow", prerequisites: ["AI-2", "AI-3", "AI-4"], rubricVersion: "AI-5-draft-v1", references: [] },
    { id: "CY-1", title: "Understand digital risk", prerequisites: [], rubricVersion: "CY-1-draft-v1", references: [] },
    { id: "CY-2", title: "Recognise phishing", prerequisites: ["CY-1"], rubricVersion: "CY-2-v2", references: ["R-CY-1", "R-CY-2"] },
    { id: "CY-3", title: "Protect accounts", prerequisites: ["CY-1"], rubricVersion: "CY-3-draft-v1", references: [] },
    { id: "CY-4", title: "Protect devices and data", prerequisites: ["CY-1", "CY-3"], rubricVersion: "CY-4-draft-v1", references: [] },
    { id: "CY-5", title: "Respond to compromise", prerequisites: ["CY-2", "CY-3", "CY-4"], rubricVersion: "CY-5-draft-v1", references: [] },
  ],
};
export const intentRules: Record<Intent, { subject: string; targets: string[]; outcome: string; terms: RegExp }> = {
  "customer-emails": { subject: "practical-ai", targets: ["AI-2", "AI-3", "AI-4"], outcome: "Draft customer emails with AI and check them against supplied facts.", terms: /\b(email|emails|customer|customers)\b/i },
  "study-notes": { subject: "practical-ai", targets: ["AI-2", "AI-4"], outcome: "Use AI to organise study notes and verify them against supplied sources.", terms: /\b(study|studying|notes|summari[sz]e|summaries)\b/i },
  "ai-workflow": { subject: "practical-ai", targets: ["AI-5"], outcome: "Complete a small AI-assisted work or study workflow and explain verification decisions.", terms: /\b(ai|prompt|prompts|chatgpt|workflow)\b/i },
  phishing: { subject: "cybersecurity", targets: ["CY-2"], outcome: "Recognise suspicious messages and choose independent verification in simulations.", terms: /\b(phishing|scam|scams|suspicious|fraud)\b/i },
  accounts: { subject: "cybersecurity", targets: ["CY-3"], outcome: "Choose account protections and recovery steps in fictional settings.", terms: /\b(account|accounts|password|passwords|mfa|passkey)\b/i },
  "digital-safety": { subject: "cybersecurity", targets: ["CY-5"], outcome: "Make protective and recovery decisions for introductory digital-security scenarios.", terms: /\b(cybersecurity|security|digital|devices|compromise|protect)\b/i },
};
export function requiredObjectives(intent: Intent, catalogue: Catalogue): string[] {
  const selected = new Set<string>();
  function include(id: string) { const item = catalogue.objectives.find((o) => o.id === id); if (!item || selected.has(id)) return; item.prerequisites.forEach(include); selected.add(id); }
  intentRules[intent].targets.forEach(include);
  return catalogue.objectives.filter((o) => selected.has(o.id)).map((o) => o.id);
}
