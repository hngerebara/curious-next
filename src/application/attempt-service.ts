import type { AttemptStore, Assessor, PracticeModel, Attempt, ExplanationLevel, Help, Decision } from "../contracts/attempt";
import type { CourseStore } from "../contracts/course-plan";
import type { AbusePort, EventPort } from "../contracts/access";
import { helpText } from "../domain/prompt-module";
import { validateAssessment } from "../domain/assessment-policy";

export function attemptService(store: AttemptStore, courses: CourseStore, practice: PracticeModel, assessor: Assessor, abuse: AbusePort, events: EventPort) {
  async function enrollment(owner:string,id:string) {
    const saved=await courses.enrollment(owner,id);
    if(!saved || saved.plan.result?.state !== "ready-preview" || saved.plan.result.proposal.subject !== "practical-ai" || !saved.plan.result.proposal.modules.some(m=>m.objective.id === "AI-2")) throw new Error("NOT_FOUND");
    if(!saved.placement) throw new Error("PLACEMENT_REQUIRED");
    return saved;
  }
  const modelCode=(error:unknown)=>error instanceof Error && ["MODEL_NOT_CONFIGURED","MODEL_LIMITED","MODEL_INVALID"].includes(error.message) ? error.message : "MODEL_UNAVAILABLE";
  return {
    async create(owner:string,id:string,mode:Attempt["mode"],key:string){const saved=await enrollment(owner,id);return store.create(owner,id,mode,key,saved.preferences.explanationLevel);},
    async learning(owner:string,id:string){const saved=await enrollment(owner,id);return store.learning(owner,id,saved.preferences.sessionMinutes);},
    read:(owner:string,id:string)=>store.read(owner,id),
    variant:(owner:string,id:string,level:ExplanationLevel)=>store.variant(owner,id,level),
    async help(owner:string,id:string,key:string,kind:Help["kind"]){const saved=await store.read(owner,id);return store.help(owner,id,key,kind,helpText(kind,saved.task));},
    async practice(owner:string,id:string,key:string,revision:number){
      const claim=await store.reservePractice(owner,id,key,revision,practice.configuration);
      if(!claim.lease)return claim.attempt;
      let response:string|null=null;let code:string|null=null;
      try {
        if(!await abuse.allow(`practice:${owner}`,10,600))code="MODEL_LIMITED";
        else response=await practice.respond(claim.attempt.task,claim.attempt.practice.filter(p=>p.id !== claim.request.id),claim.request.prompt);
        if(response !== null && (!response.trim() || response.length>8000)){response=null;code="MODEL_INVALID";}
      }catch(error){code=modelCode(error);}
      events.emit("practice_generation",code ?? "succeeded");
      return store.finishPractice(owner,id,claim.request.id,claim.lease,response,code);
    },
    async assess(owner:string,id:string){
      const claim=await store.claim(owner,id,assessor.configuration);if(!claim.lease)return claim.attempt;
      const frozen=claim.attempt.submission!.frozen;
      let decision:Decision;
      try {
        decision=await abuse.allow(`assessment:${owner}`,6,600) ? validateAssessment(await assessor.assess(frozen),frozen) : {status:"failed",criteria:[],rubricVersion:frozen.task.rubricVersion,policyVersion:frozen.task.policyVersion,code:"MODEL_LIMITED"};
      }catch(error){decision={status:"failed",criteria:[],rubricVersion:frozen.task.rubricVersion,policyVersion:frozen.task.policyVersion,code:modelCode(error)};}
      events.emit("attempt_assessment",decision.status);
      return store.finish(owner,id,claim.lease,decision,assessor.configuration);
    },
  };
}
