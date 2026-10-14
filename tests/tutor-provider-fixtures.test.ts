import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { tutorLesson } from "../src/domain/tutor-lesson-policy";
import { tutorAssessment } from "../src/domain/tutor-assessment-policy";
import { tutorReferences } from "../src/adapters/tutor-references";
import type { TutorLesson, TutorReference } from "../src/contracts/tutor-lesson";
import type { TutorAssessmentResult, TutorSubmission } from "../src/contracts/tutor-assessment";
const read=async(name:string)=>JSON.parse(await readFile(new URL("../docs/design-artifacts/goal-first-tutor/"+name,import.meta.url),"utf8"));
describe("preserved fictional provider contracts",()=>{
 for(const id of ["fractions","speaking","programming","phishing"]){
  it("retains structural and citation compatibility for "+id,async()=>{
   const lessons=await read("lessons-study-v2.json") as {cases:{id:string;lesson:TutorLesson;references:TutorReference[]}[]};
   const assessments=await read("feedback-study-v1.json") as {cases:{id:string;answers:{activity:number[];application:string;teachBack:string};feedback:TutorAssessmentResult}[]};
   const lesson=lessons.cases.find(c=>c.id===id)!,result=assessments.cases.find(c=>c.id===id)!;
   expect(tutorLesson(lesson.lesson,lesson.references)).toEqual(lesson.lesson);
   const snapshot:TutorSubmission={id:"fictional-contract-submission",key:"fictional-contract-key",hash:"fixture-only",contentHash:"fixture-only",lesson:lesson.lesson,references:lesson.references,draft:{...result.answers,position:lesson.lesson.blocks.length+2},help:[],configuration:"preserved-fixture-only",submittedAt:"2026-10-14T00:00:00Z",policy:"generated-practice-v1"};
   expect(tutorAssessment(result.feedback,snapshot)).toEqual(result.feedback);
  });
 }
 it("preserves rejection of the incomplete key and unsupported drawing task",async()=>{const prior=await read("lesson-probe-v2.json");expect(prior.valid).toBe(false);expect(()=>tutorLesson(prior.output,tutorReferences)).toThrow("MODEL_INVALID");});
});
