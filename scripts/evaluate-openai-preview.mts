import { loadEnvFile } from "node:process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { openaiAttemptModels } from "../src/adapters/openai-attempt-models";
import { openaiDefaults } from "../src/adapters/openai-response";
import { promptTask } from "../src/domain/prompt-module";
import { phishingTask, phishingLesson } from "../src/domain/phishing-module";
import { validateAssessment, demonstrates } from "../src/domain/assessment-policy";
import type { Frozen, Decision } from "../src/contracts/attempt";

if (!process.argv.includes("--live")) throw Error("Explicit --live required.");
loadEnvFile(".env.local");
if (process.env.AI_PROVIDER !== "openai" || !process.env.OPENAI_API_KEY) throw Error("Configure OpenAI locally.");
const output=process.argv.find(a=>a.startsWith("--output="))?.slice(9);
if (!output || !/^docs\/design-artifacts\/clear-learning\/[a-z0-9-]+\.json$/.test(output)) throw Error("Choose a new named clear-learning artifact.");
const pack=JSON.parse(await readFile("docs/curriculum/calibration-fixtures.json","utf8"));
const rubric=pack.rubrics["CY-2-v2"];
const fingerprint=createHash("sha256").update(await readFile(rubric.path)).digest("hex");
if(fingerprint !== rubric.sha256) throw Error("Review rubric fingerprint before running.");
const cases=pack.cases.filter((c:any)=>c.rubric_version === "CY-2-v2");
// The reference policy samples reused initial text for routing. Actual activities use fresh contexts.
function frozen(c:any):Frozen {
  const mode=c.evidence_kind === "recall" ? "recall" : c.evidence_kind === "transfer" ? "transfer" : "independent";
  const task=phishingTask(mode,0);
  let rationale=c.submission.rationale;
  if(mode === "transfer") rationale=rationale.replace("The sign-in demand is unexpected and threatens immediate closure.","The unexpected job offer demands identity documents immediately to keep the offer.").replaceAll("reminder matches my planned session","saved-search reminder matches my planned search");
  const sentences=rationale.split(/(?<=[.!?])\s+/);
  const boundary=sentences.findIndex((s:string)=>/reminder/i.test(s));
  const routine=sentences.slice(boundary).join(" ");
  const request=sentences.slice(0,boundary).join(" ");
  const content=phishingLesson("standard");
  return {task,mode,assisted:c.assistance === "substantive",draft:{prompt:JSON.stringify({request:c.submission.actions.closure,routine:c.submission.actions.reminder}),checklist:request,explanation:routine},practice:[],help:[],response:"No Practice AI output. Fictional decisions.",variant:{id:"fictional-variant",version:"CY-2-lesson-v2",objectiveId:"CY-2",rubricVersion:"CY-2-v2",explanationLevel:"standard",content,hash:createHash("sha256").update(content).digest("hex"),locale:"en"}};
}
const allMet=Object.fromEntries(["C1","C2","C3","C4","C5","C6"].map(id=>[id,"met"]));
const safe=cases.find((c:any)=>c.id === "CY-safe-branch");
cases.push(
  {...safe,id:"CY-preview-branding",submission:{actions:safe.submission.actions,rationale:"The sign-in demand is unexpected and threatens immediate closure. I open my existing official app independently. If suspicion persists I use Help then Report suspicious message in that app. I think its familiar logo proves that the sender is authentic, so I trust it as genuine. The reminder matches my planned session and asks for no sensitive action. I continue without claiming its sender is proven genuine."},expected:{criteria:{...allMet,C5:"unmet"},outcome:"developing",misconception:"branding"}},
  {...safe,id:"CY-preview-alternate-safe",submission:{actions:{closure:["report-known"],reminder:["delete"]},rationale:"The urgent unexpected sign-in demand threatens account closure. I independently open my existing official app to verify, and report through Help then Report suspicious message if suspicion persists. Branding does not authenticate the sender and suspicion is not conclusive proof. The reminder requests no sensitive action, and deletion is a safe choice without claiming the sender is genuine."},expected:{criteria:allMet,outcome:"demonstrated",misconception:"none"}},
  {...safe,id:"CY-preview-rejected-branding",submission:{actions:safe.submission.actions,rationale:"The unexpected sign-in demand threatens closure in 30 minutes. I independently open my established official app. If suspicion persists I use Help then Report suspicious message there. I reject the false belief that a familiar logo proves the sender is authentic. A logo does not authenticate a sender, and these cues support suspicion rather than conclusive proof. The reminder matches my planned session and requests no sensitive action. I continue without claiming certainty."},expected:{criteria:allMet,outcome:"demonstrated",misconception:"none"}},
);
const adversarial=JSON.parse(await readFile("docs/design-artifacts/attempt-loop/assessor-evaluation.json","utf8"));
const aiFingerprint=createHash("sha256").update(await readFile(pack.rubrics["AI-2-v2"].path)).digest("hex");
if(aiFingerprint !== pack.rubrics["AI-2-v2"].sha256)throw Error("Review AI rubric fingerprint before running.");
const aiCases=pack.cases.filter((c:any)=>c.rubric_version === "AI-2-v2").map((c:any)=>({...c,runtimeFrozen:{...adversarial.fictionalSubmission,task:promptTask("independent",0),mode:"independent",assisted:c.assistance === "substantive",draft:{prompt:c.submission.prompt,checklist:c.submission.checklist,explanation:c.submission.explanation},response:c.submission.response.map((r:any)=>"Q: "+r.question+"\nA: "+r.answer).join("\n")}}));
for(const mode of ["recall","transfer"] as const){
 const task=promptTask(mode,mode === "recall" ? 1 : 2);
 const timing=/meets (.*?), welcomes/.exec(task.source)![1];const duration=/runs (.*?)\. Recording/.exec(task.source)![1];
 aiCases.push({id:"AI-preview-"+mode,assessment_status:"succeeded",expected:{criteria:Object.fromEntries(["A1","A2","A3","A4","A5","A6"].map(id=>[id,"met"])),outcome:mode+"-recorded"},runtimeFrozen:{...adversarial.fictionalSubmission,task,mode,assisted:false,draft:{prompt:"Write exactly three FAQ question-and-answer pairs for prospective "+(mode === "transfer" ? "workshop attendees" : "members")+" covering meeting time/location, duration/fee and whether sessions are recorded. Use only the supplied task source pack. Each answer must be fewer than 30 words. State that the source does not provide the recording policy.",checklist:"There are exactly three Q:/A: pairs. All answers have fewer than 30 words. Meeting details and duration/fee match the supplied source. The final answer says the recording policy is not provided.",explanation:"My prompt names the audience and all three topics, uses the task source, sets a short answer limit and specifies question-and-answer pairs. I must still inspect the actual AI response for invented facts and missing-policy claims, because clear instructions do not guarantee correct answers."},response:"Q: When and where?\nA: "+timing+".\nQ: Duration and fee?\nA: "+duration+".\nQ: Are sessions recorded?\nA: The source does not provide a recording policy."}});
}
cases.push(...aiCases);
const selected=process.argv.find(a=>a.startsWith("--case="))?.slice(7);
if(selected && !cases.some((c:any)=>c.id === selected)) throw Error("Unknown fixture.");
const supplemental=process.argv.includes("--supplemental");
const fixtures=cases.filter((c:any)=>selected ? c.id === selected : supplemental ? c.id.startsWith("CY-preview-") : !c.id.startsWith("CY-preview-")).map((c:any)=>({...c,frozen:c.runtimeFrozen ?? frozen(c)}));
let httpStatus:number|null=null;
let diagnostic:unknown=null;
const models=openaiAttemptModels(process.env.OPENAI_API_KEY,process.env.OPENAI_MODEL ?? openaiDefaults.model,async(url,init)=>{const r=await fetch(url,init);httpStatus=r.status;diagnostic={remainingRequests:Number(r.headers.get("x-ratelimit-remaining-requests")) || null,remainingTokens:Number(r.headers.get("x-ratelimit-remaining-tokens")) || null};return r;});
const configuration=models.assessor.configurationFor!(fixtures[0].frozen);
const results:any[]=[];
await mkdir("docs/design-artifacts/clear-learning",{recursive:true});
async function persist(exclusive=false) {
  await writeFile(output!,JSON.stringify({date:new Date().toISOString(),configuration,configurations:Object.fromEntries(fixtures.map((c:any)=>[c.id,models.assessor.configurationFor!(c.frozen)])),rubricFingerprints:{cy:fingerprint,ai:aiFingerprint},scope:"Fictional agent-labelled reference agreement only. No independent calibration or learner evidence. Misconception comparison applies only to implemented CY explicit-branding records; AI candidate labels remain review requirements. Reference-evidence-v1 initial/recall/transfer routing maps explicitly to pilot-v1. Combined reference rationale is partitioned into message-specific fields at the first reminder sentence. Transfer fixture wording adapts exactly to recruitment. AI source/reference fixtures use their fixed runtime source; additional AI recall/transfer cases use their actual fresh source. Provider is OpenAI, earlier Groq results are not acceptance. Simulated failure is labelled.",planned:fixtures.length*(selected ? 1 : 2),fixtures:fixtures.map((c:any)=>({id:c.id,frozen:c.frozen,expected:c.expected})),results,summary:{completed:results.length,matching:results.filter(r=>r.pass).length,providerFailures:results.filter(r=>r.httpStatus !== 200 && !r.simulatedFailure).length,unexpectedDemonstrations:results.filter(r=>r.unexpectedDemonstration).length}},null,2)+"\n",{flag:exclusive ? "wx" : "w"});
}
await persist(true);
for(let sample=1;sample<=(selected ? 1 : 2);sample++) for(const fixture of fixtures) {
  httpStatus=null;diagnostic=null;
  const simulatedFailure=fixture.assessment_status === "failed";
  let decision:Decision; let structuredInput:unknown=null;
  try {if(simulatedFailure) throw Error("MODEL_UNAVAILABLE");structuredInput=await models.assessor.assess(fixture.frozen);decision=validateAssessment(structuredInput,fixture.frozen);}
  catch(e) {decision={status:"failed",rubricVersion:fixture.frozen.task.rubricVersion,policyVersion:"pilot-v1",criteria:[],code:e instanceof Error && ["MODEL_LIMITED","MODEL_INVALID","MODEL_UNAVAILABLE"].includes(e.message) ? e.message : "MODEL_UNAVAILABLE"};}
  const outcome=decision.status === "failed" ? "unavailable" : decision.status === "uncertain" ? "pending" : fixture.frozen.assisted ? "developing" : fixture.frozen.mode === "recall" ? "recall-recorded" : fixture.frozen.mode === "transfer" ? "transfer-recorded" : demonstrates(fixture.frozen,decision) ? "demonstrated" : "developing";
  const differences=simulatedFailure ? [] : Object.entries(fixture.expected.criteria).filter(([id,result])=>decision.criteria.find(c=>c.id === id)?.result !== (result === "unmet" ? "not_met" : result)).map(([id,result])=>({id,expected:result,actual:decision.criteria.find(c=>c.id === id)?.result ?? "unavailable"}));
  const actualMisconception=decision.criteria.some(c=>c.id === "C5" && c.reason === "branding_authenticates") ? "branding" : "none";
  const unexpectedDemonstration=demonstrates(fixture.frozen,decision) && fixture.expected.outcome !== "demonstrated";
  const record={id:fixture.id,sample,httpStatus,diagnostic,simulatedFailure,outcome,expectedOutcome:fixture.expected.outcome,actualMisconception,expectedMisconception:fixture.expected.misconception,differences,unexpectedDemonstration,pass:outcome === fixture.expected.outcome && differences.length === 0 && (fixture.frozen.task.objectiveId !== "CY-2" || !fixture.expected.misconception || actualMisconception === fixture.expected.misconception),decision,structuredInput};
  results.push(record);await persist();console.log(JSON.stringify({id:record.id,sample,httpStatus,status:decision.status,pass:record.pass,differences,unexpectedDemonstration}));
  if(httpStatus === 429){process.exitCode=1;console.log("Stopped after bounded rate-limit rejection.");process.exit();}
  if(!selected && !(sample === 2 && fixture === fixtures.at(-1))) await new Promise(resolve=>setTimeout(resolve,20000));
}
if(results.some(r=>!r.pass)) process.exitCode=1;
