import type { AbusePort, EventPort } from "../contracts/access";
import type { TutorStore } from "../contracts/tutor";
import type { TutorLessonStore } from "../contracts/tutor-lesson";
import type { TutorCompanionModel, TutorCompanionTurn } from "../contracts/tutor-companion";
import { tutorKeys, tutorRecord, tutorText } from "../domain/tutor-policy";

export function tutorCompanionService(paths:TutorStore,store:TutorLessonStore,model:TutorCompanionModel,abuse:AbusePort,events:EventPort){
 return {async ask(owner:string,id:string,revision:number,key:string,question:string){
  if(!tutorText(question,4,1500))throw Error("INVALID_BODY");
  const lease=crypto.randomUUID();
  const claimed=await store.change(owner,id,s=>{
   if(s.submission)throw Error("SUBMISSION_FROZEN");
   if(!s.lesson || s.state!=="ready")throw Error("PATH_NOT_READY");
   const turns=s.companion ?? [],previous=turns.find(t=>t.key===key);
   if(previous && previous.question!==question)throw Error("REQUEST_CONFLICT");
   if(previous && previous.configuration!==model.configuration)throw Error("CONFIGURATION_CHANGED");
   if(previous?.state==="ready" || (previous && previous.until>Date.now()))return s;
   if(turns.some(t=>t.key!==key && t.state==="generating" && t.until>Date.now()))throw Error("HELP_PENDING");
   if(s.revision!==revision && !previous)throw Error("REVISION_CONFLICT");
   if((previous?.count ?? 0)>=2 || (!previous && turns.length>=20))throw Error("ATTEMPTS_EXHAUSTED");
   const turn:TutorCompanionTurn={key,question,answer:"",followUp:"",referenceIds:[],state:"generating",configuration:model.configuration,count:(previous?.count ?? 0)+1,lease,until:Date.now()+75000,code:null,createdAt:previous?.createdAt ?? new Date().toISOString()};
   return {...s,companion:[...turns.filter(t=>t.key!==key),turn]};
  });
  if(!claimed.companion?.some(t=>t.key===key && t.lease===lease))return claimed;
  let answer="",followUp="",referenceIds:string[]=[],code:string|null=null;
  try{
   const path=await paths.read(owner,claimed.pathId);if(!path)throw Error("NOT_FOUND");
   if(!await abuse.allow("tutor-companion:"+owner,6,600))throw Error("MODEL_LIMITED");
   const lesson=claimed.lesson!;
   const value=await model.answer({goal:path.goal.text+" "+path.goal.clarification,objective:claimed.module.outcome,purpose:lesson.purpose,teaching:lesson.blocks,preferences:claimed.preferences,references:claimed.references,recentConversation:(claimed.companion ?? []).filter(t=>t.state==="ready").slice(-6).map(t=>({question:t.question,answer:t.answer})),learnerWork:{application:claimed.draft.application,teachBack:claimed.draft.teachBack,notes:claimed.draft.notes ?? ""}},question);
   if(!tutorRecord(value) || !tutorKeys(value,["answer","followUp","referenceIds"]) || !tutorText(value.answer,20,8000) || !tutorText(value.followUp,0,500) || !Array.isArray(value.referenceIds) || value.referenceIds.length>claimed.references.length || value.referenceIds.some(id=>typeof id!=="string" || !claimed.references.some(r=>r.id===id)) || new Set(value.referenceIds).size!==value.referenceIds.length)throw Error("MODEL_INVALID");
   answer=value.answer;followUp=value.followUp;referenceIds=value.referenceIds as string[];
  }catch(error){const message=error instanceof Error?error.message:"MODEL_UNAVAILABLE";code=["MODEL_INVALID","MODEL_LIMITED","MODEL_REFUSED","MODEL_NOT_CONFIGURED"].includes(message)?message:"MODEL_UNAVAILABLE";}
  events.emit("practice_generation",code ?? "tutor_companion_ready");
  return store.change(owner,id,s=>s.submission?s:{...s,companion:s.companion?.map(t=>t.key!==key || t.lease!==lease?t:{...t,answer,followUp,referenceIds,state:code?"failed":"ready",code,lease:null,until:0})});
 }};
}
