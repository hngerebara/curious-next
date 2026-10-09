import type { DiagnosticPacket, Enrollment } from "../contracts/course-plan";

export const diagnosticVersion = "entry-diagnostic-v1";
type Task = { prompt: string; options: string[]; correct: string };
const tasks: Record<string, Task> = {
  "AI-1": { prompt: "An AI answer sounds confident, but you cannot find support for one claim. What should you do?", options: ["Trust the confident wording", "Check the claim against a reliable supplied source", "Ask for a more confident answer"], correct: "b" },
  "AI-2": { prompt: "You want an AI draft for a fictional customer reply. Which prompt gives the most useful direction?", options: ["Write something good", "Make it longer", "State the task, supplied facts, audience, constraints and required format"], correct: "c" },
  "AI-3": { prompt: "An AI draft leaves out a deadline required by your fictional brief. What is the best next step?", options: ["Identify the missing requirement, revise the instruction and compare the new draft", "Repeat the same request without identifying the gap", "Accept the draft because it reads smoothly"], correct: "a" },
  "AI-4": { prompt: "Your fictional task includes unnecessary personal details and a claim needing verification. What should you do?", options: ["Share all details to get a longer answer", "Remove unnecessary personal details and check the claim against the supplied source", "Treat agreement from another AI answer as proof"], correct: "b" },
  "AI-5": { prompt: "Which process best supports a small AI-assisted workflow using a fictional brief?", options: ["Submit the first polished answer", "Keep only the final wording", "Preserve instructions and revisions, verify facts, protect information and explain decisions"], correct: "c" },
  "CY-1": { prompt: "In a fictional online shop, an attacker might access an account. Which distinction is accurate?", options: ["Unauthorised access is a threat, lost customer data is a possible consequence", "A familiar account is automatically safe", "A possible threat proves an incident occurred"], correct: "a" },
  "CY-2": { prompt: "A simulated message uses a bank logo and asks you to follow an urgent login link. What is the safest next action?", options: ["Follow the link because the logo is familiar", "Avoid the message link and verify through an independently known channel", "Reply with the fictional login details"], correct: "b" },
  "CY-3": { prompt: "For two fictional accounts in a simulation, which protection is strongest among these options?", options: ["Reuse a password on both accounts", "Share passwords with a friend for recovery", "Use unique passwords, available MFA or passkeys, and a safe recovery plan"], correct: "c" },
  "CY-4": { prompt: "A simulated app requests unnecessary permissions. Which choice best protects the fictional device and data?", options: ["Limit permissions to what is needed, keep updates current and plan backups", "Allow every permission", "Disable updates to avoid interruptions"], correct: "a" },
  "CY-5": { prompt: "In a simulation, fictional credentials were entered into a suspicious page. Which response fits the known facts?", options: ["Assume nothing happened because the page had a logo", "Use trusted account recovery/protection channels and report through the appropriate known channel", "Enter more details to test the page"], correct: "b" },
};
function modules(enrollment: Enrollment) {
  if (enrollment.plan.result?.state !== "ready-preview") throw new Error("PLAN_NOT_READY");
  return enrollment.plan.result.proposal.modules;
}
export function diagnosticPacket(enrollment: Enrollment): DiagnosticPacket {
  return { version: diagnosticVersion, questions: modules(enrollment).map(({ objective }) => {
    const task = tasks[objective.id];
    if (!task) throw new Error("DIAGNOSTIC_UNAVAILABLE");
    return { id: `${objective.id}-entry-v1`, objectiveId: objective.id, prompt: task.prompt, options: [...task.options.map((label, i) => ({ id: ["a", "b", "c"][i], label })), { id: "unsure", label: "I am not sure yet" }] };
  }) };
}
export function diagnosticPlacement(enrollment: Enrollment, answers: string[], version: string): NonNullable<Enrollment["placement"]> {
  if (version !== diagnosticVersion) throw new Error("DIAGNOSTIC_CHANGED");
  const selected = modules(enrollment);
  if (answers.length !== selected.length || answers.some((answer) => !["a", "b", "c", "unsure"].includes(answer))) throw new Error("INVALID_PLACEMENT");
  const gap = selected.findIndex(({ objective }, i) => tasks[objective.id].correct !== answers[i]);
  const target = selected[gap === -1 ? selected.length - 1 : gap].objective;
  const reason = gap === -1 ? `Your starting checks were consistent with these objectives. Begin with ${target.title} to apply or review them. This is provisional, not proof of ability.` : `Your answer for ${target.title} suggests starting there to build the missing foundation. This is provisional, and earlier answers do not award prerequisite achievement.`;
  return { mode: "diagnostic", objectiveId: target.id, reason, answers, questionIds: selected.map(({ objective }) => `${objective.id}-entry-v1`), policyVersion: diagnosticVersion };
}
