import type { AuthPort } from "../contracts/access";
import type { AttemptStore, ExplanationLevel } from "../contracts/attempt";
import type { attemptService } from "./attempt-service";
import { validDraft } from "../domain/prompt-module";
import { record } from "../domain/course-policy";

export function attemptHttp(auth:Pick<AuthPort,"session">,store:AttemptStore,service:ReturnType<typeof attemptService>,origin:string) {
  const reply=(status:number,data:unknown,error=false)=>Response.json(error?{error:{code:data},requestId:crypto.randomUUID()}:{data,requestId:crypto.randomUUID()},{status,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
  const key=(r:Request)=>{const k=r.headers.get("idempotency-key");if(!k || !/^[a-zA-Z0-9_-]{16,80}$/.test(k))throw new Error("INVALID_BODY");return k;};
  async function body(r:Request) {
    if(r.headers.get("content-type")?.split(";")[0] !== "application/json")throw new Error("INVALID_BODY");
    const reader=r.body?.getReader();if(!reader)throw new Error("INVALID_BODY");const chunks=[];let n=0;
    while(true){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>32768){await reader.cancel();throw new Error("BODY_TOO_LARGE");}chunks.push(value);}
    const bytes=new Uint8Array(n);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
    const data:unknown=JSON.parse(new TextDecoder().decode(bytes));if(!record(data))throw new Error("INVALID_BODY");return data;
  }
  return async (request:Request,id?:string,action?:string)=>{
    try {
      const learner=await auth.session(request.headers);if(!learner)return reply(401,"SESSION_REQUIRED",true);
      if(request.method !== "GET" && request.headers.get("origin") !== origin)return reply(403,"ORIGIN_REJECTED",true);
      if(request.method === "GET") {
        if(action)return reply(405,"METHOD_NOT_ALLOWED",true);
        if(id)return reply(200,await service.read(learner.id,id));
        const enrollmentId=new URL(request.url).searchParams.get("enrollmentId");if(!enrollmentId)throw new Error("INVALID_BODY");
        return reply(200,await service.learning(learner.id,enrollmentId));
      }
      if(!["POST","PATCH"].includes(request.method))return reply(405,"METHOD_NOT_ALLOWED",true);
      if((request.method === "PATCH" && (!id || action)) || (request.method === "POST" && id && !action))return reply(405,"METHOD_NOT_ALLOWED",true);
      const data=await body(request);const fields=Object.keys(data).sort().join();
      const revision=()=>{if(fields !== "revision" || !Number.isSafeInteger(data.revision) || Number(data.revision)<0)throw new Error("INVALID_BODY");return Number(data.revision);};
      if(!id && request.method === "POST") {
        if(fields !== "enrollmentId,mode" || typeof data.enrollmentId !== "string" || data.enrollmentId.length>80 || !["practice","independent"].includes(String(data.mode)))throw new Error("INVALID_BODY");
        return reply(200,await service.create(learner.id,data.enrollmentId,data.mode as "practice"|"independent",key(request)));
      }
      if(!id)throw new Error("INVALID_BODY");
      if(request.method === "PATCH") {
        if(fields !== "draft,revision" || !validDraft(data.draft) || !Number.isSafeInteger(data.revision) || Number(data.revision)<0)throw new Error("INVALID_BODY");
        return reply(200,await store.save(learner.id,id,Number(data.revision),{prompt:data.draft.prompt,checklist:data.draft.checklist,explanation:data.draft.explanation}));
      }
      if(action === "variant") {
        if(fields !== "explanationLevel" || !["very-simple","beginner","standard","technical"].includes(String(data.explanationLevel)))throw new Error("INVALID_BODY");
        return reply(200,await service.variant(learner.id,id,data.explanationLevel as ExplanationLevel));
      }
      if(action === "practice")return reply(200,await service.practice(learner.id,id,key(request),revision()));
      if(action === "submit")return reply(200,await store.submit(learner.id,id,revision(),key(request)));
      if(action === "help") {
        if(fields !== "confirm,kind" || data.confirm !== true || !["hint","worked_solution"].includes(String(data.kind)))throw new Error("INVALID_BODY");
        return reply(200,await service.help(learner.id,id,key(request),data.kind as "hint"|"worked_solution"));
      }
      if(fields !== "")throw new Error("INVALID_BODY");
      if(action === "assess")return reply(200,await service.assess(learner.id,id));
      if(action === "review")return reply(200,await store.review(learner.id,id));
      return reply(404,"NOT_FOUND",true);
    }catch(error){
      const code=error instanceof Error?error.message:"UNAVAILABLE";
      if(code === "NOT_FOUND")return reply(404,code,true);
      if(["REQUEST_CONFLICT","DRAFT_CONFLICT","ATTEMPT_FROZEN","GENERATION_PENDING","CONFIGURATION_CHANGED","PLACEMENT_REQUIRED","SUBMISSION_REQUIRED","ASSESSMENT_REQUIRED"].includes(code))return reply(409,code,true);
      if(["PRACTICE_LIMIT","FRESH_TASKS_EXHAUSTED"].includes(code))return reply(429,code,true);
      if(code === "BODY_TOO_LARGE")return reply(413,code,true);
      if(["INVALID_BODY","INCOMPLETE_SUBMISSION"].includes(code) || error instanceof SyntaxError)return reply(400,code === "INCOMPLETE_SUBMISSION"?code:"INVALID_BODY",true);
      return reply(503,"UNAVAILABLE",true);
    }
  };
}
