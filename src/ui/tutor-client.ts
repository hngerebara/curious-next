import type { TutorGoal } from "../contracts/tutor";
export const tutorDefaults:TutorGoal={text:"",clarification:"",preferences:{explanation:"beginner",visuals:"balanced",minutes:20,language:"en"}};
export async function tutorRequest<T>(url:string,body?:unknown,key?:string):Promise<T> {
  const response=await fetch(url,{method:body === undefined ? "GET":"POST",headers:{"Content-Type":"application/json",...(key?{"Idempotency-Key":key}:{})},...(body !== undefined?{body:JSON.stringify(body)}:{})});
  const value=await response.json();
  if(!response.ok)throw Error(response.status === 401?"Your session ended, so sign in again to reopen your saved work.":response.status === 409?"Your saved work changed or this retry reached its limit, so reload before continuing.":"We could not complete this request, but your saved work remains available for another attempt.");
  return value.data as T;
}
