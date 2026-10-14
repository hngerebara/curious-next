import type { LessonBlock, TutorDraft, TutorLesson, TutorPublicSession, TutorReference, TutorSession } from "../contracts/tutor-lesson";
import { tutorRecord, tutorText, tutorKeys } from "./tutor-policy";
export function tutorBlocks(value:unknown):LessonBlock[] {
  if(!Array.isArray(value) || value.length<2 || value.length>8)throw Error("MODEL_INVALID");
  for(const block of value) {
    if(!tutorRecord(block) || !tutorKeys(block,["kind","title","text","nodes"]) || !["explanation","example","diagram","comparison","timeline","fractions","number-line","infographic","flowchart","concept-map","story"].includes(String(block.kind)) || !tutorText(block.title,1,160) || !tutorText(block.text,8,1800) || !Array.isArray(block.nodes) || block.nodes.length>6)throw Error("MODEL_INVALID");
    if(["diagram","comparison","timeline","fractions","number-line","infographic","flowchart","concept-map","story"].includes(String(block.kind)) && block.nodes.length<2)throw Error("MODEL_INVALID");
    for(const node of block.nodes) {
      if(!tutorRecord(node) || !tutorKeys(node,["label","detail","parts","total"]) || !tutorText(node.label,1,100) || !tutorText(node.detail,1,500) || !Number.isInteger(node.parts) || !Number.isInteger(node.total) || Number(node.parts)<0 || Number(node.total)<0 || Number(node.total)>12 || Number(node.parts)>Number(node.total))throw Error("MODEL_INVALID");
      if(block.kind === "fractions" && Number(node.total)<1)throw Error("MODEL_INVALID");
    }
  }
  if(!value.some(b=>b.kind === "explanation") || !value.some(b=>b.kind === "example"))throw Error("MODEL_INVALID");
  return value;
}
export function tutorLesson(value:unknown,references:TutorReference[]):TutorLesson {
  if(!tutorRecord(value) || !tutorKeys(value,["title","purpose","blocks","activity","applicationPrompt","teachBackPrompt","criteria","referenceIds"]) || !tutorText(value.title,1,160) || !tutorText(value.purpose,8,1000) || !tutorText(value.applicationPrompt,8,1200) || !tutorText(value.teachBackPrompt,8,1200) || !Array.isArray(value.criteria) || value.criteria.length<2 || value.criteria.length>5 || !Array.isArray(value.referenceIds) || value.referenceIds.some(id=>!references.some(r=>r.id===id)))throw Error("MODEL_INVALID");
  if(/\b(draw|sketch|upload|attach|record a video|record your|speak aloud|execute code)\b/i.test(String(value.applicationPrompt)+" "+String(value.teachBackPrompt)+" "+JSON.stringify(value.criteria)))throw Error("MODEL_INVALID");
  tutorBlocks(value.blocks);
  if(!Array.isArray(value.blocks) || !value.blocks.some(b=>["diagram","comparison","timeline","fractions","number-line","infographic","flowchart","concept-map","story"].includes(b.kind)))throw Error("MODEL_INVALID");
  const activity=value.activity;
  if(!tutorRecord(activity) || !tutorKeys(activity,["kind","prompt","labels","options","correctIndices","explanation"]) || !["choice","matching","ordering"].includes(String(activity.kind)) || !tutorText(activity.prompt,8,800) || !tutorText(activity.explanation,8,1000) || !Array.isArray(activity.options) || activity.options.length<2 || activity.options.length>6 || activity.options.some(o=>!tutorText(o,1,400)) || new Set(activity.options).size!==activity.options.length || !Array.isArray(activity.labels) || activity.labels.some(l=>!tutorText(l,1,400)) || !Array.isArray(activity.correctIndices) || activity.correctIndices.some(i=>!Number.isInteger(i) || i<0 || i>=(activity.options as unknown[]).length))throw Error("MODEL_INVALID");
  if(activity.kind === "choice" && (activity.correctIndices.length!==1 || activity.labels.length))throw Error("MODEL_INVALID");
  if(activity.kind === "ordering" && (activity.correctIndices.length!==activity.options.length || new Set(activity.correctIndices).size!==activity.options.length || activity.labels.length))throw Error("MODEL_INVALID");
  if(activity.kind === "matching" && (activity.labels.length<2 || activity.labels.length!==activity.options.length || activity.correctIndices.length!==activity.labels.length || new Set(activity.correctIndices).size!==activity.options.length))throw Error("MODEL_INVALID");
  const ids=new Set<string>();
  for(const c of value.criteria){if(!tutorRecord(c) || !tutorKeys(c,["id","field","description"]) || !tutorText(c.id,1,40) || !/^[a-z0-9-]+$/.test(c.id) || ids.has(c.id) || !["application","teachBack"].includes(String(c.field)) || !tutorText(c.description,8,600))throw Error("MODEL_INVALID");ids.add(c.id);}
  if(!value.criteria.some(c=>c.field === "application") || !value.criteria.some(c=>c.field === "teachBack"))throw Error("MODEL_INVALID");
  return value as TutorLesson;
}
export function tutorDraft(value:unknown,session:TutorSession):TutorDraft {
  if(!tutorRecord(value) || !["activity,application,position,teachBack","activity,application,notes,position,teachBack"].includes(Object.keys(value).sort().join()) || ("notes" in value && !tutorText(value.notes,0,3000)) || !Number.isInteger(value.position) || Number(value.position)<0 || Number(value.position)>(session.lesson?.blocks.length ?? 0)+2 || !tutorText(value.application,0,6000) || !tutorText(value.teachBack,0,6000) || !Array.isArray(value.activity))throw Error("INVALID_DRAFT");
  const activity=session.lesson?.activity;
  const length=activity?.kind === "choice"?1:activity?.kind === "matching"?activity.labels.length:activity?.options.length ?? 0;
  if(value.activity.length>length || value.activity.some(i=>!Number.isInteger(i) || i < -1 || i >= (activity?.options.length ?? 0)))throw Error("INVALID_DRAFT");
  return value as TutorDraft;
}
export function publicTutorSession(session:TutorSession):TutorPublicSession {
  const {submission,...record}=session;
  const publicSubmission=submission?(({lesson,...snapshot})=>snapshot)(submission):undefined;
  if(!session.lesson)return {...record,submission:publicSubmission,lesson:null};
  const {correctIndices,explanation,...activity}=session.lesson.activity;
  return {...record,submission:publicSubmission,lesson:{...session.lesson,activity}};
}
