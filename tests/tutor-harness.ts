import { courseHarness } from "./course-harness";
import { readFile } from "node:fs/promises";
import { tutorStore } from "../src/adapters/tutor-store";
import { tutorService } from "../src/application/tutor-service";
import { tutorHttp } from "../src/application/tutor-http";
import type { TutorGoal, TutorProposal } from "../src/contracts/tutor";
export const tutorInput:TutorGoal={text:"Understand fractions in everyday situations",clarification:"",preferences:{explanation:"simple",visuals:"visual",minutes:20,language:"en"}};
export function generatedPath():TutorProposal {return {state:"ready",title:"Understand everyday fractions",outcome:"Explain fractions and compare equal shares in everyday situations.",reason:"Your goal connects numbers to everyday sharing and practical decisions.",question:"",modules:Array.from({length:4},(_,i)=>({id:"module-"+i,title:"Fraction step "+i,outcome:"Explain a useful idea with a practical everyday example.",reason:"This step supports your next useful activity through guided practice.",prerequisites:i?["module-"+(i-1)]:[]})),diagnostic:Array.from({length:4},(_,i)=>({id:"question-"+i,moduleId:"module-"+i,prompt:"Choose the explanation that describes the same equal shares.",options:["Two equal shares","Three equal shares","Four equal shares"],correct:0}))};}
const closers:(()=>Promise<void>)[]=[];
export async function closeTutorHarnesses(){for(const close of closers.splice(0))await close();}
export async function tutorHarness(generate=async()=>generatedPath()) {
  const h=await courseHarness();closers.push(h.close);await h.sql.exec(await readFile(new URL("../migrations/0006-generated-tutor.sql",import.meta.url),"utf8"));
  const store=tutorStore(h.db);let calls=0;
  const service=tutorService(store,{configuration:"fictional-tutor-v1",async path(){calls++;return generate();}},{async allow(){return true;}},{emit(){}});
  const handler=tutorHttp({async session(headers){const id=headers.get("x-test-owner");return id?{id,email:"fictional@example.test"}:null;}},store,service,"https://curiousnext.test");
  return {...h,store,service,handler,count:()=>calls};
}
