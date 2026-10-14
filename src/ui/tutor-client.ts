import type { TutorGoal } from "../contracts/tutor";
export const tutorDefaults:TutorGoal={text:"",clarification:"",preferences:{explanation:"beginner",visuals:"balanced",minutes:20,language:"en"}};
const messages:Record<string,string>={
 INCOMPLETE_SUBMISSION:"Complete every practice choice and both explanations, then return to review your work.",
 HELP_PENDING:"Your extra explanation is still being prepared, so wait for it before submitting.",
 SUBMISSION_FROZEN:"These answers are already frozen, so reopen their feedback or choose a fresh practice task.",
 REVISION_CONFLICT:"A newer saved version exists, so reload this work before making another change.",
 REQUEST_CONFLICT:"This request belongs to different saved work, so reload before trying again.",
 CONFIGURATION_CHANGED:"This saved request uses an earlier generation profile, so start a fresh task while retaining this work.",
 ATTEMPTS_EXHAUSTED:"This request has reached its retry limit, so keep the saved work and start a fresh task.",
 INVALID_DRAFT:"One of your saved answers is incomplete or too long, so review it before continuing."
};
export async function tutorRequest<T>(url:string,body?:unknown,key?:string):Promise<T> {
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
 try{
  const response=await fetch(url,{method:body===undefined?"GET":"POST",signal:controller.signal,headers:{"Content-Type":"application/json",...(key?{"Idempotency-Key":key}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const value=await response.json();
  if(!response.ok)throw Error(response.status===401?"Your session ended, so sign in again to reopen your saved work.":messages[value?.error?.code] ?? "We could not complete this request, but your saved work remains available for another attempt.");
  return value.data as T;
 }catch(error){
  if(controller.signal.aborted)throw Error("The request took too long, so reopen your saved work before retrying the same submission.");
  if(error instanceof TypeError || error instanceof SyntaxError)throw Error("The connection was interrupted, so reopen your saved work or retry the same request.");
  throw error;
 }finally{clearTimeout(timer);}
}
