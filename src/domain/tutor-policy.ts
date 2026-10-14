import type { TutorGoal, TutorPath, TutorProposal, TutorPublicPath, TutorPlacement } from "../contracts/tutor";
export const tutorRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export const tutorKeys=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).sort().join()===[...keys].sort().join();
export const tutorText = (value: unknown, min = 1, max = 1200): value is string => typeof value === "string" && value.trim().length >= min && value.length <= max;
export function tutorGoal(value: unknown): TutorGoal {
  if (!tutorRecord(value) || Object.keys(value).sort().join() !== "clarification,preferences,text" || !tutorText(value.text, 8, 1000) || !tutorText(value.clarification, 0, 500) || !tutorRecord(value.preferences)) throw Error("INVALID_GOAL");
  const p = value.preferences;
  if (Object.keys(p).sort().join() !== "explanation,language,minutes,visuals" || !["simple", "beginner", "standard", "technical"].includes(String(p.explanation)) || !["balanced", "visual"].includes(String(p.visuals)) || ![10,20,40].includes(Number(p.minutes)) || typeof p.minutes !== "number" || p.language !== "en") throw Error("INVALID_GOAL");
  return { text: value.text.trim(), clarification: value.clarification.trim(), preferences: p as TutorGoal["preferences"] };
}
export function tutorProposal(value: unknown): TutorProposal {
  if (!tutorRecord(value) || !tutorKeys(value,["state","title","outcome","reason","question","modules","diagnostic"]) || !["ready","clarification","limited"].includes(String(value.state)) || !["title","outcome","reason","question"].every(key => tutorText(value[key], key === "question" ? 0 : 1)) || !Array.isArray(value.modules) || !Array.isArray(value.diagnostic)) throw Error("MODEL_INVALID");
  if (value.state !== "ready") {
    if (!tutorText(value.question) || value.modules.length || value.diagnostic.length) throw Error("MODEL_INVALID");
    return value as TutorProposal;
  }
  if (value.modules.length < 4 || value.modules.length > 8 || value.diagnostic.length < 4 || value.diagnostic.length > 6) throw Error("MODEL_INVALID");
  const seen = new Set<string>();
  for (const module of value.modules) {
    if (!tutorRecord(module) || !tutorKeys(module,["id","title","outcome","reason","prerequisites"]) || !tutorText(module.id,1,40) || !/^[a-z0-9-]+$/.test(module.id) || seen.has(module.id) || !["title","outcome","reason"].every(key => tutorText(module[key])) || !Array.isArray(module.prerequisites) || module.prerequisites.some(id => typeof id !== "string" || !seen.has(id))) throw Error("MODEL_INVALID");
    seen.add(module.id);
  }
  const questions = new Set<string>();
  for (const item of value.diagnostic) {
    if (!tutorRecord(item) || !tutorKeys(item,["id","moduleId","prompt","options","correct"]) || !tutorText(item.id,1,40) || questions.has(item.id) || !seen.has(String(item.moduleId)) || !tutorText(item.prompt) || !Array.isArray(item.options) || item.options.length !== 3 || item.options.some(x => !tutorText(x,1,400)) || new Set(item.options).size !== 3 || !Number.isInteger(item.correct) || Number(item.correct)<0 || Number(item.correct)>2) throw Error("MODEL_INVALID");
    questions.add(item.id);
  }
  return value as TutorProposal;
}
export function publicTutorPath(path: TutorPath): TutorPublicPath {
  return { ...path, proposal: path.proposal ? { ...path.proposal, diagnostic: path.proposal.diagnostic.map(({ correct, ...question }) => question) } : null };
}
export function tutorPlace(path: TutorPath, answers: unknown, selected?: unknown): TutorPlacement {
  if (path.state !== "accepted" || path.proposal?.state !== "ready") throw Error("PATH_NOT_READY");
  if (!Array.isArray(answers) || (answers.length !== 0 && answers.length !== path.proposal.diagnostic.length) || answers.some(a => !Number.isInteger(a) || a < -1 || a > 2)) throw Error("INVALID_PLACEMENT");
  const modules = path.proposal.modules;
  // Require every earlier prerequisite to be probed before recommending a later start.
  let index = 0;
  if (answers.length) {
    while (index < modules.length-1) {
      const related = path.proposal.diagnostic.map((q,i) => ({q,i})).filter(({q}) => q.moduleId === modules[index].id);
      if (!related.length || related.some(({q,i}) => answers[i] !== q.correct)) break;
      index++;
    }
  }
  const suggested = modules[index].id;
  const chosen = selected ?? suggested;
  if (typeof chosen !== "string" || !modules.slice(0,index+1).some(m => m.id === chosen)) throw Error("INVALID_PLACEMENT");
  return { answers, suggested, selected: chosen, reason: answers.length ? "Your answers suggest this starting point, while later practice will help check your understanding." : "You chose to begin with the foundations, and your learning path will adapt through practice." };
}

export function tutorCanonical(value: unknown): string {
  if (Array.isArray(value)) return "["+value.map(tutorCanonical).join(",")+"]";
  if (tutorRecord(value)) return "{"+Object.keys(value).sort().map(key=>JSON.stringify(key)+":"+tutorCanonical(value[key])).join(",")+"}";
  return JSON.stringify(value) ?? "null";
}
