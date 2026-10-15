import type { TutorAssessmentResult, TutorSubmission } from "../contracts/tutor-assessment";
import type { TutorSession } from "../contracts/tutor-lesson";
import type { TutorPath } from "../contracts/tutor";
import { tutorRecord, tutorText, tutorKeys } from "./tutor-policy";
export function tutorComplete(session:TutorSession){
  if(!session.lesson || session.state!=="ready" || session.draft.position<session.lesson.blocks.length+2 || !tutorText(session.draft.application,20,6000) || !tutorText(session.draft.teachBack,20,6000))throw Error("INCOMPLETE_SUBMISSION");
  const activity=session.lesson.activity,answers=session.draft.activity;
  if(answers.length!==activity.correctIndices.length || answers.some(a=>!Number.isInteger(a) || a<0 || a>=activity.options.length) || (activity.kind!=="choice" && new Set(answers).size!==answers.length))throw Error("INCOMPLETE_SUBMISSION");
  if(session.help.some(h=>h.state==="generating" && h.until>Date.now()) || session.companion?.some(t=>t.state==="generating" && t.until>Date.now()))throw Error("HELP_PENDING");
}
export function tutorAssessment(value:unknown,submission:TutorSubmission):TutorAssessmentResult {
  if(!tutorRecord(value) || !tutorKeys(value,["criteria","wentWell","needsAttention","nextAction"]) || !Array.isArray(value.criteria) || value.criteria.length!==submission.lesson.criteria.length || !["wentWell","needsAttention","nextAction"].every(key=>tutorText(value[key],8,1200)))throw Error("MODEL_INVALID");
  const seen=new Set<string>();
  for(const item of value.criteria){
    if(!tutorRecord(item) || !tutorKeys(item,["criterionId","result","quote","feedback"]) || !tutorText(item.criterionId,1,40) || seen.has(item.criterionId) || !["met","not_met","uncertain"].includes(String(item.result)) || !tutorText(item.quote,0,1200) || !tutorText(item.feedback,8,1200))throw Error("MODEL_INVALID");
    const criterion=submission.lesson.criteria.find(c=>c.id===item.criterionId);if(!criterion)throw Error("MODEL_INVALID");
    const answer=submission.draft[criterion.field];
    if((item.result==="met" && !tutorText(item.quote,3,1200)) || (item.quote && !answer.includes(item.quote)))throw Error("MODEL_INVALID");
    seen.add(item.criterionId);
  }
  return value as TutorAssessmentResult;
}
export function tutorPracticePassed(submission:TutorSubmission,result:TutorAssessmentResult){return result.criteria.every(c=>c.result==="met") && submission.draft.activity.every((a,i)=>a===submission.lesson.activity.correctIndices[i]);}
export function tutorRecommendation(path:TutorPath,sessions:TutorSession[],configuration?:string){
  const modules=path.proposal?.modules ?? [],start=Math.max(0,modules.findIndex(m=>m.id===path.placement?.selected));
  for(const module of modules.slice(start)){
    const work=sessions.filter(s=>s.module.id===module.id),passed=work.find(s=>s.evidence);
    if(passed)continue;
    const current=work.find(s=>s.state==="ready") ?? work.find(s=>(!configuration || s.configuration===configuration) && s.generation.count<2);
    const terminal=current?.assessmentJob && ["succeeded","uncertain"].includes(current.assessmentJob.state);
    return {moduleId:module.id,sessionId:current?.id ?? null,kind:terminal?"repair":"learn",reason:terminal?"Your latest feedback identifies a gap, so revisit that idea and try a fresh practice task.":current?.submission?"Your answers are saved as a frozen submission, so reopen their feedback or retry the saved assessment.":"This module is your next learning step, and guided practice will help check your understanding.",complete:false};
  }
  return {moduleId:modules.at(-1)?.id ?? null,sessionId:null,kind:"review",reason:"You completed the supported practice in this path, while independent demonstration and retention remain unassessed.",complete:true};
}
