import { afterEach, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { closeTutorHarnesses } from "./tutor-harness";
import { lessonHarness } from "./tutor-lesson-harness";
import { tutorCompanionService } from "../src/application/tutor-companion-service";
import { tutorAssessmentService } from "../src/application/tutor-assessment-service";
import { tutorCanonical } from "../src/domain/tutor-policy";
afterEach(closeTutorHarnesses);
it("owns companion history, redacts private keys, replays and freezes assistance",async()=>{
 const h=await lessonHarness();let calls=0;
 const service=tutorCompanionService(h.store,h.lessonStore,{configuration:"fictional-companion-v1",async answer(context){calls++;expect(JSON.stringify(context)).not.toContain("correctIndices");return {answer:"Equal shares contain the same amount of one clearly defined whole.",followUp:"",referenceIds:[]};}},{async allow(){return true;}},{emit(){}});
 let s=await h.lessonService.generate("learner-a",h.path.id,"module-0","fictional-companion-lesson");
 await expect(service.ask("learner-b",s.id,s.revision,"fictional-companion-question","Why do shares need equal sizes?")).rejects.toThrow();
 s=await service.ask("learner-a",s.id,s.revision,"fictional-companion-question","Why do shares need equal sizes?");
 s=await service.ask("learner-a",s.id,0,"fictional-companion-question","Why do shares need equal sizes?");expect(calls).toBe(1);expect(s.companion).toHaveLength(1);
 s=await h.lessonService.save("learner-a",s.id,s.revision,{position:s.lesson!.blocks.length+2,activity:[0],application:"Divide the same whole into four equally sized shares.",teachBack:"Each fraction describes equal shares of the same complete whole."});
 const assessment=tutorAssessmentService(h.lessonStore,{configuration:"fictional-assessment",async assess(){throw Error("not called");}},{async allow(){return true;}},{emit(){}},value=>createHash("sha256").update(tutorCanonical(value)).digest("hex"));
 s=await assessment.freeze("learner-a",s.id,s.revision,"fictional-companion-freeze");expect(s.submission?.companion?.[0].answer).toBe(s.companion?.[0].answer);
 await expect(service.ask("learner-a",s.id,s.revision,"fictional-frozen-question","Explain another example please.")).rejects.toThrow("SUBMISSION_FROZEN");expect(calls).toBe(1);
},15000);
it("preserves a failed question and retries with the same key",async()=>{
 const h=await lessonHarness();let calls=0;
 const service=tutorCompanionService(h.store,h.lessonStore,{configuration:"fictional-companion-v1",async answer(){if(++calls===1)throw Error("MODEL_LIMITED");return {answer:"Compare the amounts in each share before naming the fraction.",followUp:"",referenceIds:[]};}},{async allow(){return true;}},{emit(){}});
 let s=await h.lessonService.generate("learner-a",h.path.id,"module-0","fictional-retry-lesson");
 s=await service.ask("learner-a",s.id,s.revision,"fictional-retry-question","Why must these shares be equal?");expect(s.companion?.[0].code).toBe("MODEL_LIMITED");
 s=await service.ask("learner-a",s.id,s.revision,"fictional-retry-question","Why must these shares be equal?");expect(s.companion).toHaveLength(1);expect(s.companion?.[0].state).toBe("ready");expect(calls).toBe(2);
},15000);
