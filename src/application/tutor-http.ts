import type { AuthPort } from "../contracts/access";
import type { TutorStore } from "../contracts/tutor";
import type { tutorService } from "./tutor-service";
import { publicTutorPath, tutorGoal, tutorRecord } from "../domain/tutor-policy";
async function body(request:Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw Error("INVALID_BODY");
  const reader=request.body?.getReader(); if(!reader) throw Error("INVALID_BODY");
  let size=0, text=""; const decoder=new TextDecoder();
  while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>12000){await reader.cancel();throw Error("BODY_TOO_LARGE");} text+=decoder.decode(value,{stream:true}); }
  const data:unknown=JSON.parse(text+decoder.decode()); if(!tutorRecord(data))throw Error("INVALID_BODY"); return data;
}
export function tutorHttp(auth:Pick<AuthPort,"session">,store:TutorStore,service:ReturnType<typeof tutorService>,origin:string) {
  const reply=(status:number,data:unknown,error=false)=>Response.json(error?{error:{code:data}}:{data},{status,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
  return async(request:Request,id?:string,action?:string)=>{
    try {
      const learner=await auth.session(request.headers);if(!learner)return reply(401,"SESSION_REQUIRED",true);
      if(request.method !== "GET" && request.headers.get("origin") !== origin)return reply(403,"ORIGIN_REJECTED",true);
      if(request.method === "GET") {
        if(action)return reply(405,"METHOD_NOT_ALLOWED",true);
        if(!id)return reply(200,(await store.list(learner.id)).map(publicTutorPath));
        const path=await store.read(learner.id,id);return path?reply(200,publicTutorPath(path)):reply(404,"NOT_FOUND",true);
      }
      if(request.method !== "POST")return reply(405,"METHOD_NOT_ALLOWED",true);
      const data=await body(request);
      if(!id) {
        const key=request.headers.get("idempotency-key");if(!key || !/^[a-zA-Z0-9_-]{16,80}$/.test(key))throw Error("INVALID_BODY");
        return reply(200,publicTutorPath(await service.generate(learner.id,tutorGoal(data),key)));
      }
      if(action === "retry" && Object.keys(data).length === 0) {
        const path=await store.read(learner.id,id);if(!path)throw Error("NOT_FOUND");
        return reply(200,publicTutorPath(await service.generate(learner.id,path.goal,path.requestKey,id)));
      }
      if(!Number.isSafeInteger(data.revision) || Number(data.revision)<0)throw Error("INVALID_BODY");
      if(action === "accept" && Object.keys(data).join() === "revision")return reply(200,publicTutorPath(await service.accept(learner.id,id,Number(data.revision))));
      if(action === "placement" && Object.keys(data).every(key=>["revision","answers","selected"].includes(key)))return reply(200,publicTutorPath(await service.place(learner.id,id,Number(data.revision),data.answers,data.selected)));
      return reply(400,"INVALID_BODY",true);
    } catch(error) {
      const code=error instanceof Error?error.message:"UNAVAILABLE";
      const status=code === "NOT_FOUND"?404:code === "BODY_TOO_LARGE"?413:["REVISION_CONFLICT","REQUEST_CONFLICT","CONFIGURATION_CHANGED","PATH_NOT_READY","ATTEMPTS_EXHAUSTED"].includes(code)?409:code.startsWith("INVALID_") || error instanceof SyntaxError?400:503;
      return reply(status,status === 503 ? "UNAVAILABLE" : code,true);
    }
  };
}
