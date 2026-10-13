import type { AiCriterionId, Frozen } from "../contracts/attempt";
import { responseInspection } from "./response-inspection";

// Versioned adapter configuration pins this wording. Historical feedback is never rebuilt.
const reasons = {
  A1: { complete: "Your prompt states the task, audience and required topics.", missing_task: "State the FAQ task explicitly.", missing_audience: "Name the audience in your prompt.", missing_topics: "Include all three topics from the brief.", missing_count: "Request exactly three FAQ entries." },
  A2: { complete: "Your prompt includes or explicitly references the supplied source pack.", source_missing: "Include the supplied facts or explicitly tell Practice AI to use the task's source pack." },
  A3: { complete: "Your prompt specifies answer length, source-only claims and missing-policy uncertainty.", length_missing: "Specify fewer than 30 words per answer.", source_only_missing: "Tell Practice AI to use only the supplied source facts.", unknown_policy_missing: "Require an explicit acknowledgement when the source does not provide a policy." },
  A4: { complete: "Your prompt requests question-and-answer pairs.", format_missing: "Specify question-and-answer pairs. Any clear markup style is acceptable." },
  A5: { complete: "Your checklist accurately inspects the saved response against the brief.", count_check: "Correct your checklist's inspection of the number of FAQ pairs.", length_check: "Check each actual answer's length, excluding questions and labels.", source_check: "Compare each actual claim with the supplied source and flag unsupported claims.", uncertainty_check: "Check whether the response acknowledges the missing policy rather than inventing it.", checklist_inaccurate: "Revise your checklist to accurately check count, answer length, source fidelity and missing-policy uncertainty." },
  A6: { complete: "Your explanation connects prompt choices to the brief and explains why verification remains necessary.", brief_connection_missing: "Explain how your prompt choices meet the brief's requirements.", verification_missing: "Explain why you still need to verify the actual response.", guarantee_claim: "A detailed prompt does not guarantee a correct response. Explain why verification remains necessary." },
};
export const feedbackVersion = "criterion-reasons-v1";
export const feedbackConfiguration = JSON.stringify({version:feedbackVersion,reasons,inspectionVersion:"complete-explicit-qa-v2"});
export function assessmentReasons(id: AiCriterionId) { return [...Object.keys(reasons[id]), "ambiguous"]; }
export function assessmentFeedback(id: AiCriterionId, result: unknown, reason: unknown, frozen: Frozen): string | null {
  if (typeof reason !== "string" || !assessmentReasons(id).includes(reason)) return null;
  if (result === "met" ? reason !== "complete" : result === "uncertain" ? reason !== "ambiguous" : result === "not_met" ? ["complete", "ambiguous"].includes(reason) : true) return null;
  let text = reason === "ambiguous" ? "The saved evidence is ambiguous for this criterion. No new demonstration is awarded. Review the cited work or request optional review." : (reasons[id] as Record<string,string>)[reason];
  if (id === "A5") {
    const inspection = responseInspection(frozen.response);
    if (inspection.state === "parsed") {
      const counts = inspection.answerWordCounts.slice(0, 8).join(", ");
      text += ` Saved response: ${inspection.entryCount} explicit Q:/A: pairs. ${inspection.answerWordCounts.length > 8 ? "First eight answer" : "Answer"} word counts: ${counts}. Required: exactly 3 pairs and fewer than 30 words per answer.`;
    } else text += " This format was not counted automatically. Inspect count and answer length directly against the brief.";
  }
  return text;
}
