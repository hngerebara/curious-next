import type { Enrollment, EntryAction, EntryRecommendation } from "../contracts/course-plan";

export function entryGuidance(enrollment: Enrollment): EntryRecommendation {
  if (enrollment.plan.result?.state !== "ready-preview") throw new Error("PLAN_NOT_READY");
  const modules = enrollment.plan.result.proposal.modules;
  const target = modules.find((m) => m.objective.id === enrollment.startObjectiveId) ?? modules[0];
  const budget = enrollment.preferences.sessionMinutes;
  const minutes = budget === 10 ? 5 : budget === 20 ? 10 : 15;
  const overview: EntryAction = { id: "preview-module", title: `Review ${target.objective.title}`, minutes, reason: `This overview fits your ${budget}-minute session. ${enrollment.placement ? "It follows your saved starting point." : "You can inspect the first module before choosing a starting point."} Reviewed learning activities will follow later.` };
  const choose: EntryAction = { id: "choose-start", title: "Choose your starting point", minutes: 5, reason: "Take the optional short starting check, or begin with the first module. Neither creates achievement evidence." };
  const preferences: EntryAction = { id: "preferences", title: "Adjust explanation and session preferences", minutes: 2, reason: "Set the support and time budget that suit you, without changing objectives or assessment standards." };
  const beginning: EntryAction = { id: "choose-beginning", title: "Start from the beginning instead", minutes: 2, reason: "Review foundations while keeping the original diagnostic answers and recommendation." };
  return { policyVersion: "entry-guidance-v1", enrollmentId: enrollment.id, preferenceVersion: enrollment.preferences.version, primary: enrollment.placement ? overview : choose, alternatives: enrollment.placement ? (target.objective.id !== modules[0].objective.id ? [beginning, preferences] : [preferences]) : [overview, preferences], capabilities: modules.map(({ objective }) => ({ objectiveId: objective.id, state: "not_assessed" })) };
}
