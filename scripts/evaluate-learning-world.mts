import { loadEnvFile } from "node:process";
import { readFile, writeFile } from "node:fs/promises";
import { tutorLessonModel } from "../src/adapters/tutor-lesson-model";
import { tutorReferencePack } from "../src/adapters/tutor-references";
import { tutorLesson } from "../src/domain/tutor-lesson-policy";
import { visualSceneRequired } from "../src/domain/learning-scene-policy";
import type { TutorGoal, TutorModule } from "../src/contracts/tutor";

if(!process.argv.includes("--live"))throw Error("Explicit --live is required.");
const output=process.argv.find(a=>a.startsWith("--output="))?.slice(9);
if(!output || !/^docs\/design-artifacts\/learning-world\/[a-z0-9-]+\.json$/.test(output))throw Error("Use a new allowlisted output filename.");
loadEnvFile(".env.local");
if(process.env.AI_PROVIDER!=="openai" || !process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL)throw Error("Keep the existing private OpenAI configuration.");
const cases=[
 {id:"fractions",goal:"Understand fractions and compare equal shares of the same whole",title:"Explore a whole and its equal shares",outcome:"Explain how selected equal shares relate to a fixed whole."},
 {id:"speaking",goal:"Prepare a clear one-minute public speaking introduction for a fictional community meeting",title:"Connect an audience, a purpose and an opening",outcome:"Choose a focused purpose and explain an opening for a fictional audience."},
 {id:"python",goal:"Understand Python variable names, values and types using inert examples",title:"Trace names and values through simple assignments",outcome:"Predict the values of names in a short text-only example."},
 {id:"phishing",goal:"Recognise scam messages and check a delivery text safely",title:"Investigate a fictional delivery message",outcome:"Explain warning signs and a safe independent verification route."}
];
const selected=process.argv.find(a=>a.startsWith("--topic="))?.slice(8);
const model=tutorLessonModel(process.env.OPENAI_API_KEY,process.env.OPENAI_MODEL);
const report:{configuration:string;fictional:true;rows:unknown[];stopReason:string|null}={configuration:model.configuration,fictional:true,rows:[],stopReason:null};
try{await readFile(output);throw Error("Refusing to overwrite evidence.");}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
for(const item of cases.filter(c=>!selected || c.id===selected)){
 const goal:TutorGoal={text:item.goal,clarification:"",preferences:{explanation:"beginner",visuals:"visual",minutes:10,language:"en"}};
 const module:TutorModule={id:item.id+"-intro",title:item.title,outcome:item.outcome,reason:"This short introduction supports the learner's first practical experiment.",prerequisites:[]};
 const start=Date.now();let raw:unknown=null;
 try{raw=await model.lesson(goal,module,tutorReferencePack(item.goal));const lesson=tutorLesson(raw,tutorReferencePack(item.goal));visualSceneRequired(lesson.blocks);report.rows.push({topic:item.id,state:"validated",milliseconds:Date.now()-start,lesson});}
 catch(error){const message=error instanceof Error?error.message:"MODEL_UNAVAILABLE";const code=["MODEL_LIMITED","MODEL_INVALID","MODEL_VISUAL_REQUIRED","MODEL_NOT_CONFIGURED","MODEL_REFUSED"].includes(message)?message:"MODEL_UNAVAILABLE";report.rows.push({topic:item.id,state:"failed",code,milliseconds:Date.now()-start,raw});if(code==="MODEL_LIMITED")report.stopReason=code;}
 await writeFile(output,JSON.stringify(report,null,2),{flag:report.rows.length===1?"wx":"w"});
 process.stdout.write(JSON.stringify({topic:item.id,...(report.rows.at(-1) as {state:string;code?:string}),lesson:undefined,raw:undefined})+"\n");
 if(report.stopReason)break;
 await new Promise(resolve=>setTimeout(resolve,1000));
}
