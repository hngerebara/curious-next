import type { tutorCompanionService } from "./tutor-companion-service";
import type { AuthPort } from "../contracts/access";
import type { TutorStore, TutorPreferences } from "../contracts/tutor";
import type { TutorApproach, TutorLessonStore } from "../contracts/tutor-lesson";
import type { tutorAssessmentService } from "./tutor-assessment-service";
import { tutorRecommendation } from "../domain/tutor-assessment-policy";
import type { tutorLessonService } from "./tutor-lesson-service";
import { publicTutorSession } from "../domain/tutor-lesson-policy";
import { tutorRecord, tutorText } from "../domain/tutor-policy";
export async function tutorBody(request:Request){
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")throw Error("INVALID_BODY");const reader=request.body?.getReader();if(!reader)throw Error("INVALID_BODY");
  const decoder=new TextDecoder();let size=0,text="";while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw Error("BODY_TOO_LARGE");}text+=decoder.decode(value,{stream:true});}
  const data:unknown=JSON.parse(text+decoder.decode());if(!tutorRecord(data))throw Error("INVALID_BODY");return data;
}
export function tutorLessonHttp(auth:Pick<AuthPort,"session">,paths:TutorStore,store:TutorLessonStore,service:ReturnType<typeof tutorLessonService>,origin:string,assessment?:ReturnType<typeof tutorAssessmentService>,companion?:ReturnType<typeof tutorCompanionService>){
  const reply=(status:number,data:unknown,error=false)=>Response.json(error?{error:{code:data},requestId:crypto.randomUUID()}:{data,requestId:crypto.randomUUID()},{status,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
  const key=(request:Request)=>{const value=request.headers.get("idempotency-key");if(!value || !/^[a-zA-Z0-9_-]{16,80}$/.test(value))throw Error("INVALID_BODY");return value;};
  return async(request:Request,id?:string,action?:string)=>{
    try{
      const learner=await auth.session(request.headers);if(!learner)return reply(401,"SESSION_REQUIRED",true);const owner=learner.id;
      if(request.method!=="GET" && request.headers.get("origin")!==origin)return reply(403,"ORIGIN_REJECTED",true);
      if(request.method==="GET" && action==="recommendation" && id){const path=await paths.read(owner,id);if(!path)throw Error("NOT_FOUND");return reply(200,tutorRecommendation(path,await store.list(owner,id),service.configuration));}
      if(request.method==="GET" && !action){if(id){const s=await store.read(owner,id);return s?reply(200,publicTutorSession(s)):reply(404,"NOT_FOUND",true);}const pathId=new URL(request.url).searchParams.get("pathId");if(!pathId || !await paths.read(owner,pathId))throw Error("NOT_FOUND");return reply(200,(await store.list(owner,pathId)).map(publicTutorSession));}
      if(request.method!=="POST")return reply(405,"METHOD_NOT_ALLOWED",true);
      const data=await tutorBody(request);
      if(!id && ["moduleId,pathId","moduleId,pathId,previousId"].includes(Object.keys(data).sort().join()) && (!("previousId" in data) || tutorText(data.previousId,1,80)) && tutorText(data.pathId,1,80) && tutorText(data.moduleId,1,40))return reply(200,publicTutorSession(await service.generate(owner,data.pathId,data.moduleId,key(request),undefined,typeof data.previousId==="string"?data.previousId:undefined)));
      if(!id)throw Error("INVALID_BODY");
      if(action==="retry" && !Object.keys(data).length){const s=await store.read(owner,id);if(!s)throw Error("NOT_FOUND");return reply(200,publicTutorSession(await service.generate(owner,s.pathId,s.module.id,s.requestKey,id)));}
      if(!Number.isSafeInteger(data.revision) || Number(data.revision)<0)throw Error("INVALID_BODY");
      if(action==="ask" && companion && Object.keys(data).sort().join() === "question,revision" && tutorText(data.question,4,1500))return reply(200,publicTutorSession(await companion.ask(owner,id,Number(data.revision),key(request),data.question)));
      if(action==="freeze" && assessment && Object.keys(data).join()==="revision")return reply(200,publicTutorSession(await assessment.freeze(owner,id,Number(data.revision),key(request))));
      if(action==="submit" && assessment && Object.keys(data).join()==="revision")return reply(200,publicTutorSession(await assessment.submit(owner,id,Number(data.revision),key(request))));
      if(action==="assess" && assessment && Object.keys(data).join()==="revision")return reply(200,publicTutorSession(await assessment.assess(owner,id)));
      if(action==="save" && Object.keys(data).sort().join()==="draft,revision")return reply(200,publicTutorSession(await service.save(owner,id,Number(data.revision),data.draft)));
      if(action==="explain" && ["revision,style","approach,revision,style"].includes(Object.keys(data).sort().join()) && (!("approach" in data) || ["balanced","story","flowchart","infographic","brain-sketch","everyday"].includes(String(data.approach))) && ["simple","beginner","standard","technical"].includes(String(data.style)))return reply(200,publicTutorSession(await service.explain(owner,id,Number(data.revision),data.style as TutorPreferences["explanation"],key(request),data.approach as TutorApproach|undefined)));
      if(action==="check" && Object.keys(data).join()==="revision"){
        const s=await store.read(owner,id);if(!s)throw Error("NOT_FOUND");if(s.revision!==data.revision)throw Error("REVISION_CONFLICT");if(!s.lesson)throw Error("PATH_NOT_READY");const correct=s.draft.activity.length===s.lesson.activity.correctIndices.length && s.draft.activity.every((a,i)=>a===s.lesson!.activity.correctIndices[i]);return reply(200,{correct,explanation:s.lesson.activity.explanation});
      }
      throw Error("INVALID_BODY");
    }catch(error){const code=error instanceof Error?error.message:"UNAVAILABLE";const status=code==="NOT_FOUND"?404:code==="BODY_TOO_LARGE"?413:["REVISION_CONFLICT","REQUEST_CONFLICT","CONFIGURATION_CHANGED","PATH_NOT_READY","ATTEMPTS_EXHAUSTED","SUBMISSION_FROZEN","INCOMPLETE_SUBMISSION","HELP_PENDING","SUBMISSION_REQUIRED"].includes(code)?409:code.startsWith("INVALID_") || error instanceof SyntaxError?400:503;return reply(status,status===503?"UNAVAILABLE":code,true);}
  };
}
