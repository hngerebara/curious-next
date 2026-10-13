import { loadEnvFile } from "node:process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { groqAttemptModels } from "../src/adapters/groq-attempt-models";
import { phishingTask, phishingLesson } from "../src/domain/phishing-module";
import { validateAssessment, demonstrates } from "../src/domain/assessment-policy";
import type { Frozen, Decision } from "../src/contracts/attempt";

if (!process.argv.includes("--live")) throw Error("Explicit --live required.");
loadEnvFile(".env.local");
if (process.env.AI_PROVIDER !== "groq" || !process.env.GROQ_MODEL || !process.env.GROQ_API_KEY) throw Error("Configure existing Groq profile locally.");
const output=process.argv.find(a=>a.startsWith("--output="))?.slice(9);
if (!output || !/^docs\/design-artifacts\/adaptive-loop\/[a-z0-9-]+\.json$/.test(output)) throw Error("Choose a new named adaptive-loop artifact.");
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
  if(mode === "transfer") rationale=rationale.replaceAll("sign-in demand","identity-document demand").replaceAll("closure","offer withdrawal").replaceAll("reminder matches my planned session","saved-search reminder matches my planned search");
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
const selected=process.argv.find(a=>a.startsWith("--case="))?.slice(7);
if(selected && !cases.some((c:any)=>c.id === selected)) throw Error("Unknown fixture.");
const supplemental=process.argv.includes("--supplemental");
const fixtures=cases.filter((c:any)=>selected ? c.id === selected : supplemental ? c.id.startsWith("CY-preview-") : !c.id.startsWith("CY-preview-")).map((c:any)=>({...c,frozen:frozen(c)}));
let httpStatus:number|null=null;
let diagnostic:unknown=null;
const models=groqAttemptModels(process.env.GROQ_API_KEY,process.env.GROQ_MODEL,async(url,init)=>{const r=await fetch(url,init);httpStatus=r.status;
  if(!r.ok){
    const reader=r.clone().body?.getReader();let size=0;const chunks:Uint8Array[]=[];
    if(reader)while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>65536){void reader.cancel().catch(()=>{});break;}chunks.push(value);}
    let body:any={};
    if(size<=65536){const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{body={};}}
    const generated=typeof body?.error?.failed_generation === "string" ? body.error.failed_generation : "";
    let parsed:Record<string,unknown>|null=null;
    try { parsed=JSON.parse(generated); } catch { parsed=null; }
    const rows=parsed?.criteria && typeof parsed.criteria === "object" && !Array.isArray(parsed.criteria) ? parsed.criteria as Record<string,unknown> : null;
    const schema=JSON.parse(String(init?.body)).response_format.json_schema.schema;
    const violations=rows ? Object.keys(schema.properties.criteria.properties).map(id=>{
      const row=rows[id] as Record<string,unknown>|undefined;
      const spec=schema.properties.criteria.properties[id].properties;
      return {id,requiredFieldsPresent:!!row && ["result","reason","evidenceIds"].every(k=>Object.hasOwn(row,k)),resultAllowed:!!row && spec.result.enum.includes(row.result),reasonAllowed:!!row && spec.reason.enum.includes(row.reason),evidenceIdsAllowed:!!row && Array.isArray(row.evidenceIds) && row.evidenceIds.every((e:unknown)=>spec.evidenceIds.items.enum.includes(e)),extraFields:row ? Object.keys(row).filter(k=>!["result","reason","evidenceIds"].includes(k)).length : 0};
    }) : [];
    diagnostic={violations,generationLength:generated.length,endsWithBrace:generated.trimEnd().endsWith("}"),parseable:!!parsed,criteriaObject:!!rows,knownCriteria:rows ? ["C1","C2","C3","C4","C5","C6"].filter(id=>Object.hasOwn(rows,id)).length : 0,code:["json_validate_failed","rate_limit_exceeded"].includes(body?.error?.code) ? body.error.code : "unavailable"};
  }
  return r;});
const configuration=models.assessor.configurationFor!(fixtures[0].frozen);
const results:any[]=[];
await mkdir("docs/design-artifacts/adaptive-loop",{recursive:true});
async function persist(exclusive=false) {
  await writeFile(output!,JSON.stringify({date:new Date().toISOString(),configuration,rubricFingerprint:fingerprint,scope:"Fictional agent-labelled reference agreement only. No independent calibration or learner evidence. Reference-evidence-v1 initial/recall/transfer routing maps explicitly to pilot-v1. Combined reference rationale is partitioned into message-specific fields at the first reminder sentence. Transfer fixture wording adapts to recruitment. Simulated failure is labelled.",planned:fixtures.length*(selected ? 1 : 2),fixtures:fixtures.map((c:any)=>({id:c.id,frozen:c.frozen,expected:c.expected})),results,summary:{completed:results.length,matching:results.filter(r=>r.pass).length,providerFailures:results.filter(r=>r.httpStatus !== 200 && !r.simulatedFailure).length,unexpectedDemonstrations:results.filter(r=>r.unexpectedDemonstration).length}},null,2)+"\n",{flag:exclusive ? "wx" : "w"});
}
await persist(true);
for(let sample=1;sample<=(selected ? 1 : 2);sample++) for(const fixture of fixtures) {
  httpStatus=null;diagnostic=null;
  const simulatedFailure=fixture.assessment_status === "failed";
  let decision:Decision; let structuredInput:unknown=null;
  try {if(simulatedFailure) throw Error("MODEL_UNAVAILABLE");structuredInput=await models.assessor.assess(fixture.frozen);decision=validateAssessment(structuredInput,fixture.frozen);}
  catch(e) {decision={status:"failed",rubricVersion:"CY-2-v2",policyVersion:"pilot-v1",criteria:[],code:e instanceof Error && ["MODEL_LIMITED","MODEL_INVALID","MODEL_UNAVAILABLE"].includes(e.message) ? e.message : "MODEL_UNAVAILABLE"};}
  const outcome=decision.status === "failed" ? "unavailable" : decision.status === "uncertain" ? "pending" : fixture.frozen.assisted ? "developing" : fixture.frozen.mode === "recall" ? "recall-recorded" : fixture.frozen.mode === "transfer" ? "transfer-recorded" : demonstrates(fixture.frozen,decision) ? "demonstrated" : "developing";
  const differences=simulatedFailure ? [] : Object.entries(fixture.expected.criteria).filter(([id,result])=>decision.criteria.find(c=>c.id === id)?.result !== (result === "unmet" ? "not_met" : result)).map(([id,result])=>({id,expected:result,actual:decision.criteria.find(c=>c.id === id)?.result ?? "unavailable"}));
  const actualMisconception=decision.criteria.some(c=>c.id === "C5" && c.reason === "branding_authenticates") ? "branding" : "none";
  const unexpectedDemonstration=demonstrates(fixture.frozen,decision) && fixture.expected.outcome !== "demonstrated";
  const record={id:fixture.id,sample,httpStatus,diagnostic,simulatedFailure,outcome,expectedOutcome:fixture.expected.outcome,actualMisconception,expectedMisconception:fixture.expected.misconception,differences,unexpectedDemonstration,pass:outcome === fixture.expected.outcome && differences.length === 0 && actualMisconception === fixture.expected.misconception,decision,structuredInput};
  results.push(record);await persist();console.log(JSON.stringify({id:record.id,sample,httpStatus,status:decision.status,pass:record.pass,differences,unexpectedDemonstration}));
  if(httpStatus === 429){process.exitCode=1;console.log("Stopped after bounded rate-limit rejection.");process.exit();}
  if(!selected && !(sample === 2 && fixture === fixtures.at(-1))) await new Promise(resolve=>setTimeout(resolve,60000));
}
if(results.some(r=>!r.pass)) process.exitCode=1;
