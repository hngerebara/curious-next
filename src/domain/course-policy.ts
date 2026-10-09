import type { Catalogue, GenerationResult, GoalInput, Intent } from "../contracts/course-plan";
import { intentRules, requiredObjectives } from "./course-catalogue";

export function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
export function boundedText(value: unknown, minimum: number, maximum: number): value is string { return typeof value === "string" && value.trim().length >= minimum && value.length <= maximum && !/[<>\u0000-\u0008]/.test(value); }
export function goalInput(value: unknown): GoalInput | null {
  if (!record(value) || Object.keys(value).some((k) => !["goalText", "explanationLevel", "teachingLanguage", "sessionMinutes", "clarification", "version"].includes(k))) return null;
  if (!boundedText(value.goalText, 10, 1000) || !["very-simple", "beginner", "standard", "technical"].includes(String(value.explanationLevel)) || value.teachingLanguage !== "en" || ![10, 20, 40].includes(Number(value.sessionMinutes)) || typeof value.sessionMinutes !== "number") return null;
  if (value.clarification !== undefined && !boundedText(value.clarification, 1, 500)) return null;
  return { goalText: value.goalText.trim(), explanationLevel: value.explanationLevel as GoalInput["explanationLevel"], teachingLanguage: "en", sessionMinutes: value.sessionMinutes as GoalInput["sessionMinutes"], ...(value.clarification ? { clarification: value.clarification as string } : {}) };
}
const prohibitedClaims = /\b(guarantee[d]?|certif(?:ied|ication)|accredit(?:ed|ation)|expert|professional qualification|hack(?:ing)?|exploit|diagnos(?:e|is)|treat(?:ment)?|cure|investment returns)\b/i;
export function validateGeneration(raw: unknown, input: GoalInput, catalogue: Catalogue): GenerationResult {
  const fail = (): GenerationResult => ({ state: "failed", code: "INVALID_GENERATION" });
  if (!record(raw) || Object.keys(raw).sort().join() !== ["state", "subject", "intent", "title", "reason", "goalEvidence", "context", "modules", "question"].sort().join()) return fail();
  if (raw.state === "unsupported") return { state: "unsupported", message: "This preview supports introductory Practical AI and Cybersecurity. Choose a related goal or revise yours." };
  if (raw.state === "clarification") return input.clarification || !boundedText(raw.question, 10, 250) || prohibitedClaims.test(raw.question) ? fail() : { state: "clarification", question: raw.question };
  if (raw.state !== "ready-preview" || typeof raw.intent !== "string" || !Object.hasOwn(intentRules, raw.intent)) return fail();
  const intent = raw.intent as Intent;
  const rule = intentRules[intent];
  const goal = `${input.goalText} ${input.clarification ?? ""}`;
  if (raw.subject !== rule.subject || !boundedText(raw.goalEvidence, 3, 150) || !goal.toLowerCase().includes(raw.goalEvidence.toLowerCase()) || !rule.terms.test(raw.goalEvidence)) return fail();
  if (!boundedText(raw.title, 8, 100) || !boundedText(raw.reason, 15, 400) || !boundedText(raw.context, 10, 400) || prohibitedClaims.test(`${raw.title} ${raw.reason} ${raw.context}`) || !Array.isArray(raw.modules)) return fail();
  const ids = requiredObjectives(intent, catalogue);
  if (raw.modules.length !== ids.length) return fail();
  const modules = [];
  for (let index = 0; index < ids.length; index++) {
    const item = raw.modules[index];
    if (!record(item) || Object.keys(item).sort().join() !== "introduction,objectiveId" || item.objectiveId !== ids[index] || !boundedText(item.introduction, 10, 300) || prohibitedClaims.test(item.introduction)) return fail();
    const objective = catalogue.objectives.find((o) => o.id === ids[index]);
    if (!objective || objective.prerequisites.some((id) => !ids.slice(0, index).includes(id))) return fail();
    modules.push({ objective: { ...objective, prerequisites: [...objective.prerequisites], references: [...objective.references] }, introduction: item.introduction });
  }
  return { state: "ready-preview", proposal: { subject: raw.subject as "practical-ai" | "cybersecurity", intent, title: raw.title, outcome: rule.outcome, reason: raw.reason, goalEvidence: raw.goalEvidence, context: raw.context, modules } };
}
