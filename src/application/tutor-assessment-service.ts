import type { AbusePort, EventPort } from "../contracts/access";
import type { TutorAssessor, TutorAssessmentResult, TutorSubmission } from "../contracts/tutor-assessment";
import type { TutorLessonStore } from "../contracts/tutor-lesson";
import { tutorAssessment, tutorComplete, tutorPracticePassed } from "../domain/tutor-assessment-policy";
export function tutorAssessmentService(store:TutorLessonStore,assessor:TutorAssessor,abuse:AbusePort,events:EventPort,hash:(value:unknown)=>string){
  async function freeze(owner:string,id:string,revision:number,key:string){return store.change(owner,id,s=>{
    if(s.submission){if(s.submission.key!==key)throw Error("REQUEST_CONFLICT");return s;}
    if(s.revision!==revision)throw Error("REVISION_CONFLICT");tutorComplete(s);
    const help=s.help.map(h=>h.state==="generating"?{...h,state:"failed" as const,lease:null,until:0,code:"MODEL_UNAVAILABLE"}:h);
    const companion=s.companion?.map(t=>t.state==="generating"?{...t,state:"failed" as const,lease:null,until:0,code:"MODEL_UNAVAILABLE"}:t);
    const snapshot={...(companion?{companion}:{}),contentHash:s.contentHash!,lesson:s.lesson!,references:s.references,draft:s.draft,help,configuration:assessor.configuration,policy:"generated-practice-v1" as const};
    const submission:TutorSubmission={...snapshot,id:crypto.randomUUID(),key,hash:hash(snapshot),submittedAt:new Date().toISOString()};
    return {...s,...(companion?{companion}:{}),help,submission,assessments:[],assessmentJob:{state:"queued",lease:null,until:0,count:0,code:null}};
  });}
  async function assess(owner:string,id:string){
    const lease=crypto.randomUUID();const claimed=await store.change(owner,id,s=>{
      if(!s.submission || !s.assessmentJob)throw Error("SUBMISSION_REQUIRED");
      const job=s.assessmentJob;if(["succeeded","uncertain"].includes(job.state) || job.until>Date.now())return s;
      if(s.submission.configuration!==assessor.configuration)throw Error("CONFIGURATION_CHANGED");if(job.count>=3)throw Error("ATTEMPTS_EXHAUSTED");
      return {...s,assessmentJob:{...job,state:"assessing",lease,until:Date.now()+75000,count:job.count+1,code:null}};
    });
    if(claimed.assessmentJob?.lease!==lease)return claimed;
    let result:TutorAssessmentResult|null=null,code:string|null=null;
    try{if(!await abuse.allow("tutor-assess:"+owner,10,600))throw Error("MODEL_LIMITED");result=tutorAssessment(await assessor.assess(claimed.submission!),claimed.submission!);}catch(error){const message=error instanceof Error?error.message:"MODEL_UNAVAILABLE";code=["MODEL_INVALID","MODEL_LIMITED","MODEL_REFUSED","MODEL_NOT_CONFIGURED"].includes(message)?message:"MODEL_UNAVAILABLE";}
    events.emit("attempt_assessment",code ?? "tutor_assessed");
    return store.change(owner,id,s=>{
      if(s.assessmentJob?.lease!==lease)return s;
      const uncertain=!!result?.criteria.some(c=>c.result==="uncertain");
      const run={id:crypto.randomUUID(),status:code?"failed" as const:uncertain?"uncertain" as const:"valid" as const,result,code,configuration:assessor.configuration,createdAt:new Date().toISOString()};
      const evidence=result && !uncertain && tutorPracticePassed(s.submission!,result)?{id:crypto.randomUUID(),type:"supported-practice" as const,submissionId:s.submission!.id,submissionHash:s.submission!.hash,contentHash:s.contentHash!,criterionIds:result.criteria.map(c=>c.criterionId),configuration:assessor.configuration,policy:"generated-practice-v1" as const,createdAt:run.createdAt}:undefined;
      return {...s,assessments:[...(s.assessments ?? []),run],...(evidence?{evidence}:{}),assessmentJob:{...s.assessmentJob,state:code?"failed":uncertain?"uncertain":"succeeded",lease:null,until:0,code}};
    });
  }
  return {freeze,assess,async submit(owner:string,id:string,revision:number,key:string){await freeze(owner,id,revision,key);return assess(owner,id);}};
}
