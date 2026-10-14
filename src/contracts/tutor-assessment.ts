import type { TutorDraft, TutorHelp, TutorLesson, TutorReference } from "./tutor-lesson";
export type TutorSubmission = { id:string; key:string; hash:string; contentHash:string; lesson:TutorLesson; references:TutorReference[]; draft:TutorDraft; help:TutorHelp[]; configuration:string; submittedAt:string; policy:"generated-practice-v1" };
export type TutorJudgment = { criterionId:string; result:"met"|"not_met"|"uncertain"; quote:string; feedback:string };
export type TutorAssessmentResult = { criteria:TutorJudgment[]; wentWell:string; needsAttention:string; nextAction:string };
export type TutorAssessmentRun = { id:string; status:"valid"|"uncertain"|"failed"; result:TutorAssessmentResult|null; code:string|null; configuration:string; createdAt:string };
export type TutorAssessmentJob = { state:"queued"|"assessing"|"succeeded"|"uncertain"|"failed"; lease:string|null; until:number; count:number; code:string|null };
export type TutorPracticeEvidence = { id:string; type:"supported-practice"; submissionId:string; submissionHash:string; contentHash:string; criterionIds:string[]; configuration:string; policy:"generated-practice-v1"; createdAt:string };
export interface TutorAssessor { configuration:string; assess(submission:TutorSubmission):Promise<unknown> }
