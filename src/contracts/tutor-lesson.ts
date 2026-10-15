import type { TutorAssessmentJob, TutorAssessmentRun, TutorPracticeEvidence, TutorSubmission } from "./tutor-assessment";
import type { TutorGoal, TutorModule, TutorPreferences } from "./tutor";
import type { LearningScene, SceneState } from "./learning-scene";
export type TutorReference = { id:string; title:string; url:string; summary:string; accessedAt:string; snapshotHash:string; review:"agent-reviewed" };
export type LessonNode = { label:string; detail:string; parts:number; total:number };
export type LessonBlock = { kind:"explanation"|"example"|"diagram"|"comparison"|"timeline"|"fractions"|"number-line"|"infographic"|"flowchart"|"concept-map"|"story"; title:string; text:string; nodes:LessonNode[]; scene?:LearningScene|null };
export type TutorActivity = { kind:"choice"|"matching"|"ordering"; prompt:string; labels:string[]; options:string[]; correctIndices:number[]; explanation:string };
export type TutorCriterion = { id:string; field:"application"|"teachBack"; description:string };
export type TutorLesson = { title:string; purpose:string; blocks:LessonBlock[]; activity:TutorActivity; applicationPrompt:string; teachBackPrompt:string; criteria:TutorCriterion[]; referenceIds:string[] };
export type TutorApproach = "balanced"|"story"|"flowchart"|"infographic"|"brain-sketch"|"everyday";
export type TutorDraft = { notes?:string; scenes?:Record<string,SceneState>; position:number; activity:number[]; application:string; teachBack:string };
export type TutorHelp = { approach?:TutorApproach; key:string; style:TutorPreferences["explanation"]; state:"generating"|"ready"|"failed"; lease:string|null; until:number; count:number; blocks:LessonBlock[]; code:string|null; configuration:string; createdAt:string };
export type TutorSession = { schemaVersion?:1|2|3; previousSessionId?:string; submission?:TutorSubmission; assessments?:TutorAssessmentRun[]; assessmentJob?:TutorAssessmentJob; evidence?:TutorPracticeEvidence; id:string; pathId:string; module:TutorModule; requestKey:string; revision:number; state:"generating"|"failed"|"ready"; preferences:TutorPreferences; configuration:string; lesson:TutorLesson|null; contentHash:string|null; references:TutorReference[]; draft:TutorDraft; help:TutorHelp[]; generation:{count:number;lease:string|null;until:number;code:string|null}; createdAt:string };
export type TutorPublicSession = Omit<TutorSession,"lesson"|"submission"> & { submission?:Omit<TutorSubmission,"lesson">; lesson:(Omit<TutorLesson,"activity"> & {activity:Omit<TutorActivity,"correctIndices"|"explanation">})|null };
export interface TutorLessonStore {
  list(owner:string,pathId:string):Promise<TutorSession[]>;
  read(owner:string,id:string):Promise<TutorSession|null>;
  create(owner:string,session:TutorSession):Promise<TutorSession>;
  change(owner:string,id:string,update:(session:TutorSession)=>TutorSession):Promise<TutorSession>;
}
export interface TutorLessonModel {
  configuration:string;
  lesson(goal:TutorGoal,module:TutorModule,references:TutorReference[],previous?:string):Promise<unknown>;
  explain(lesson:TutorLesson,style:TutorPreferences["explanation"],references:TutorReference[],approach?:TutorApproach):Promise<unknown>;
}
