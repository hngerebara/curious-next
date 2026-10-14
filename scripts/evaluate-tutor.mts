import { loadEnvFile } from "node:process";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { postgres } from "../src/adapters/postgres";
import { user } from "../src/adapters/auth-schema";
import { tutorStore } from "../src/adapters/tutor-store";
import { tutorLessonStore } from "../src/adapters/tutor-lesson-store";
import { tutorPathModel } from "../src/adapters/tutor-path-model";
import { tutorLessonModel } from "../src/adapters/tutor-lesson-model";
import { tutorAssessor } from "../src/adapters/tutor-assessor";
import { tutorReferencePack } from "../src/adapters/tutor-references";
import { repositories } from "../src/adapters/access-repositories";
import { tutorService } from "../src/application/tutor-service";
import { tutorLessonService } from "../src/application/tutor-lesson-service";
import { tutorAssessmentService } from "../src/application/tutor-assessment-service";
import { tutorCanonical } from "../src/domain/tutor-policy";
import { tutorRecommendation } from "../src/domain/tutor-assessment-policy";
import type { TutorGoal } from "../src/contracts/tutor";

async function main(){
// Explicit fictional service-level study, never invoked by CI or app startup.
if (!process.argv.includes("--live")) throw Error("Explicit --live is required for bounded fictional provider checks.");
loadEnvFile(".env.local");
const output=process.argv.find(a=>a.startsWith("--output="))?.slice(9);
const phase=process.argv.find(a=>a.startsWith("--phase="))?.slice(8) ?? "paths";
if(!output || !/^docs\/design-artifacts\/goal-first-tutor\/[a-z0-9-]+\.json$/.test(output) || !["paths","retry-paths","lessons","assess"].includes(phase))throw Error("Use a new allowlisted output and phase.");
if(process.env.AI_PROVIDER!=="openai" || !process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL || !process.env.BETTER_AUTH_SECRET)throw Error("Configure the existing OpenAI preview privately.");
const stateFile="/private/tmp/cn-tutor-study-state.json";
const connection=postgres(process.env.DATABASE_URL!);
const hash=(v:unknown)=>createHash("sha256").update(tutorCanonical(v)).digest("hex");
const paths=tutorStore(connection.db),lessons=tutorLessonStore(connection.db),{abuse}=repositories(connection.db,process.env.BETTER_AUTH_SECRET);
const events={emit(){}};
const pathModel=tutorPathModel(process.env.OPENAI_API_KEY,process.env.OPENAI_MODEL),lessonModel=tutorLessonModel(process.env.OPENAI_API_KEY,process.env.OPENAI_MODEL),assessor=tutorAssessor(process.env.OPENAI_API_KEY,process.env.OPENAI_MODEL);
const entry=tutorService(paths,pathModel,abuse,events),teaching=tutorLessonService(paths,lessons,lessonModel,abuse,events,tutorReferencePack,hash),feedback=tutorAssessmentService(lessons,assessor,abuse,events,hash);
const goals=[{id:"fractions",text:"Understand fractions so I can compare equal shares in everyday situations"},{id:"speaking",text:"Prepare a clear three-minute public talk that explains one idea to a beginner audience"},{id:"programming",text:"Learn Python variables, arithmetic and conditions through small text examples"},{id:"phishing",text:"Recognise phishing messages and explain safer actions using fictional examples"}];
type PrivateState={limited?:boolean;owner:string;cases:{id:string;pathId:string;sessionId?:string;application?:string;teachBack?:string;activity?:number[]}[]};
const report:{version:number;fictional:boolean;phase:string;model:string;configurations:string[];scope:string;cases:unknown[];stopReason:string|null}={version:1,fictional:true,phase,model:process.env.OPENAI_MODEL,configurations:[pathModel.configuration,lessonModel.configuration,assessor.configuration],scope:"Bounded fictional service-level checks, not independent calibration or browser acceptance",cases:[],stopReason:null};
await writeFile(output,JSON.stringify(report,null,2)+"\n",{flag:"wx"});
async function persist(){await writeFile(output,JSON.stringify(report,null,2)+"\n");}
try{
 let state:PrivateState;
 if(phase==="paths"){
  state={owner:randomUUID(),cases:[]};
  await connection.db.insert(user).values({id:state.owner,name:"Fictional tutor study",email:"tutor-study-"+randomUUID()+"@example.test",emailVerified:true,createdAt:new Date(),updatedAt:new Date()});
  if(report.stopReason==="MODEL_LIMITED")state.limited=true;
  await writeFile(stateFile,JSON.stringify(state),{flag:"wx",mode:0o600});
 }else state=JSON.parse(await readFile(stateFile,"utf8"));
 if(state.limited)throw Error("MODEL_LIMITED");
 for(const [index,goal] of goals.entries()){
  if(report.stopReason)break;
  if(phase==="paths" || phase==="retry-paths"){
   const input:TutorGoal={text:goal.text,clarification:"",preferences:{explanation:index%2?"standard":"simple",visuals:index%2?"balanced":"visual",minutes:20,language:"en"}};
   const prior=phase==="retry-paths"?state.cases.find(c=>c.id===goal.id):undefined;
   const saved=prior?await paths.read(state.owner,prior.pathId):null;
   if(phase==="retry-paths" && (!saved || saved.state!=="failed"))continue;
   let path=await entry.generate(state.owner,saved?.goal ?? input,saved?.requestKey ?? randomUUID(),saved?.id);
   if(path.generation.code==="MODEL_LIMITED")report.stopReason="MODEL_LIMITED";
   if(path.proposal?.state==="ready"){path=await entry.accept(state.owner,path.id,path.revision);path=await entry.place(state.owner,path.id,path.revision,[]);}
   if(!prior)state.cases.push({id:goal.id,pathId:path.id});
   report.cases.push({id:goal.id,state:path.state,code:path.generation.code,proposal:path.proposal,placementIsNotEvidence:true});
  }else{
   const item=state.cases.find(c=>c.id===goal.id);if(!item)continue;
   const path=await paths.read(state.owner,item.pathId);if(!path?.proposal || path.state!=="accepted")continue;
   if(phase==="lessons"){
    const session=await teaching.generate(state.owner,path.id,path.placement!.selected,randomUUID());item.sessionId=session.id;
    if(session.generation.code==="MODEL_LIMITED")report.stopReason="MODEL_LIMITED";
    report.cases.push({id:goal.id,state:session.state,code:session.generation.code,contentHash:session.contentHash,lesson:session.lesson,references:session.references});
   }else{
    if(!item.sessionId)continue;let session=await lessons.read(state.owner,item.sessionId);if(!session?.lesson || !item.application || !item.teachBack || !item.activity)throw Error("FICTIONAL_ANSWERS_REQUIRED");
    session=await teaching.save(state.owner,session.id,session.revision,{position:session.lesson.blocks.length+2,activity:item.activity,application:item.application,teachBack:item.teachBack});
    session=await feedback.submit(state.owner,session.id,session.revision,session.submission?.key ?? randomUUID());if(session.assessmentJob?.code==="MODEL_LIMITED")report.stopReason="MODEL_LIMITED";
    const replay=session.assessmentJob?.state==="succeeded" || session.assessmentJob?.state==="uncertain"?await feedback.assess(state.owner,session.id):session;
    const {sessionId,...recommendation}=tutorRecommendation(path,await lessons.list(state.owner,path.id));
    report.cases.push({id:goal.id,answers:{application:item.application,teachBack:item.teachBack,activity:item.activity},job:session.assessmentJob?.state,code:session.assessmentJob?.code,feedback:session.assessments?.at(-1)?.result,evidenceType:session.evidence?.type ?? null,independentDemonstration:false,replayPerformed:session.assessmentJob?.state==="succeeded" || session.assessmentJob?.state==="uncertain",replayPreservesHash:session.submission?.hash===replay.submission?.hash,replayPreservesEvidence:session.evidence?.id===replay.evidence?.id,recommendation});
   }
  }
  if(report.stopReason==="MODEL_LIMITED")state.limited=true;
  await writeFile(stateFile,JSON.stringify(state),{mode:0o600});await persist();console.log(JSON.stringify({phase,case:goal.id,completed:report.cases.length,stopReason:report.stopReason}));
 }
}catch(error){report.stopReason=error instanceof Error && ["FICTIONAL_ANSWERS_REQUIRED","MODEL_LIMITED"].includes(error.message)?error.message:"STUDY_FAILED";await persist();process.exitCode=1;}finally{await connection.close();}
if(report.stopReason)process.exitCode=1;

}
main().catch(()=>{console.error(JSON.stringify({status:"STUDY_FAILED"}));process.exitCode=1;});
