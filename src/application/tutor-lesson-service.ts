import type { AbusePort, EventPort } from "../contracts/access";
import type { TutorPreferences, TutorStore } from "../contracts/tutor";
import type { TutorLessonModel, TutorLessonStore, TutorReference, TutorSession } from "../contracts/tutor-lesson";
import { tutorBlocks, tutorDraft, tutorLesson } from "../domain/tutor-lesson-policy";
import { tutorCanonical, tutorRecord } from "../domain/tutor-policy";
export function tutorLessonService(paths:TutorStore,store:TutorLessonStore,model:TutorLessonModel,abuse:AbusePort,events:EventPort,pack:(goal:string)=>TutorReference[],hash:(value:unknown)=>string) {
  const errorCode=(error:unknown)=>error instanceof Error && ["MODEL_LIMITED","MODEL_INVALID","MODEL_REFUSED","MODEL_NOT_CONFIGURED"].includes(error.message)?error.message:"MODEL_UNAVAILABLE";
  async function generate(owner:string,pathId:string,moduleId:string,key:string,id?:string,previousId?:string) {
    const path=await paths.read(owner,pathId);if(!path)throw Error("NOT_FOUND");
    if(path.state!=="accepted" || !path.placement || path.proposal?.state!=="ready")throw Error("PATH_NOT_READY");
    const module=path.proposal.modules.find(m=>m.id===moduleId);if(!module)throw Error("NOT_FOUND");
    const restored=id?await store.read(owner,id):null;
    if(id && !restored)throw Error("NOT_FOUND");
    const lineageId=previousId ?? restored?.previousSessionId;
    const previous=lineageId?await store.read(owner,lineageId):null;
    if(lineageId && (!previous || previous.pathId!==pathId || previous.module.id!==moduleId || !previous.submission))throw Error("NOT_FOUND");
    const feedback=previous?.assessments?.at(-1)?.result;
    const initial:TutorSession={schemaVersion:1,...(lineageId?{previousSessionId:lineageId}:{}),id:crypto.randomUUID(),pathId,module,requestKey:key,revision:0,state:"generating",preferences:path.preferences ?? path.goal.preferences,configuration:model.configuration,lesson:null,contentHash:null,references:pack(path.goal.text+" "+path.goal.clarification+" "+module.title),draft:{position:0,activity:[],application:"",teachBack:""},help:[],generation:{count:0,lease:null,until:0,code:null},createdAt:new Date().toISOString()};
    const saved=id?restored:await store.create(owner,initial);if(!saved || saved.pathId!==pathId)throw Error("NOT_FOUND");if(saved.state==="ready")return saved;
    if(saved.configuration!==model.configuration)throw Error("CONFIGURATION_CHANGED");
    const lease=crypto.randomUUID();const claimed=await store.change(owner,saved.id,s=>{if(s.state==="ready" || s.generation.until>Date.now())return s;if(s.generation.count>=2)throw Error("ATTEMPTS_EXHAUSTED");return {...s,state:"generating",generation:{count:s.generation.count+1,lease,until:Date.now()+75000,code:null}};});
    if(claimed.generation.lease!==lease)return claimed;
    let lesson=null,code=null;
    try{if(!await abuse.allow("tutor-lesson:"+owner,8,600))throw Error("MODEL_LIMITED");lesson=tutorLesson(await model.lesson({...path.goal,preferences:claimed.preferences},claimed.module,claimed.references,feedback?JSON.stringify(feedback):undefined),claimed.references);}catch(error){code=errorCode(error);}
    events.emit("practice_generation",code ?? "tutor_lesson_ready");
    return store.change(owner,saved.id,s=>s.generation.lease!==lease?s:{...s,state:lesson?"ready":"failed",lesson,contentHash:lesson?hash({lesson,references:s.references,configuration:s.configuration}):null,generation:{...s.generation,lease:null,until:0,code}});
  }
  return {configuration:model.configuration,generate,
    save(owner:string,id:string,revision:number,value:unknown){return store.change(owner,id,s=>{if(s.state!=="ready")throw Error("PATH_NOT_READY");const draft=tutorDraft(value,s);if(tutorCanonical(s.draft)===tutorCanonical(draft))return s;if(s.submission)throw Error("SUBMISSION_FROZEN");if(s.revision!==revision)throw Error("REVISION_CONFLICT");return {...s,draft};});},
    async explain(owner:string,id:string,revision:number,style:TutorPreferences["explanation"],key:string){
      const lease=crypto.randomUUID();const claimed=await store.change(owner,id,s=>{
        if(s.submission)throw Error("SUBMISSION_FROZEN");
        if(s.state!=="ready" || !s.lesson)throw Error("PATH_NOT_READY");
        const previous=s.help.find(h=>h.key===key);if(previous && previous.style!==style)throw Error("REQUEST_CONFLICT");if(previous && previous.configuration!==model.configuration)throw Error("CONFIGURATION_CHANGED");if(previous?.state==="ready" || (previous && previous.until>Date.now()))return s;
        if(s.revision!==revision && !previous)throw Error("REVISION_CONFLICT");if((previous?.count ?? 0)>=2 || (!previous && s.help.length>=10))throw Error("ATTEMPTS_EXHAUSTED");
        const help={key,style,state:"generating" as const,lease,until:Date.now()+75000,count:(previous?.count ?? 0)+1,blocks:[],code:null,configuration:model.configuration,createdAt:new Date().toISOString()};return {...s,help:[...s.help.filter(h=>h.key!==key),help]};
      });
      if(!claimed.help.some(h=>h.key===key && h.lease===lease))return claimed;
      let blocks:ReturnType<typeof tutorBlocks>=[],code:string|null=null;
      try{if(!await abuse.allow("tutor-help:"+owner,5,600))throw Error("MODEL_LIMITED");const result=await model.explain(claimed.lesson!,style,claimed.references);if(!tutorRecord(result))throw Error("MODEL_INVALID");blocks=tutorBlocks(result.blocks);}catch(error){code=errorCode(error);}
      events.emit("practice_generation",code ?? "tutor_help_ready");
      return store.change(owner,id,s=>s.submission?s:({...s,help:s.help.map(h=>h.key!==key || h.lease!==lease?h:{...h,state:code?"failed":"ready",blocks,code,lease:null,until:0})}));
    }
  };
}
