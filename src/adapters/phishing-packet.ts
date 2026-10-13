import type { Frozen } from "../contracts/attempt";
import { phishingReasons } from "../domain/phishing-assessment";
import { record } from "../domain/course-policy";

export function phishingPacket(frozen: Frozen) {
  const evidence: {id:string;field:"checklist" | "explanation";quote:string}[] = [];
  for (const field of ["checklist","explanation"] as const) {
    let index = 0;
    for (const sentence of frozen.draft[field].split(/(?<=[.!?])\s+|\n+/).filter(s=>s.trim())) {
      for(let start=0;start<sentence.length;start+=500) evidence.push({id:`${field}-${index++}`,field,quote:sentence.slice(start,start+500)});
    }
  }
  const criteria = Object.fromEntries(frozen.task.criteria.filter(c=>c.id !== "C2").map(c=>[c.id,{type:"object",additionalProperties:false,properties:{result:{type:"string",enum:["met","not_met","uncertain"]},reason:{type:"string",enum:c.id === "C5" ? phishingReasons : phishingReasons.filter(r=>r !== "branding_authenticates")},evidenceIds:{type:"array",minItems:1,maxItems:8,items:{type:"string",enum:evidence.map(e=>e.id)}}},required:["result","reason","evidenceIds"]}]));
  const schema = {type:"object",additionalProperties:false,properties:{rubricVersion:{type:"string",enum:["CY-2-v2"]},policyVersion:{type:"string",enum:["pilot-v1"]},criteria:{type:"object",additionalProperties:false,properties:criteria,required:Object.keys(criteria)}},required:["rubricVersion","policyVersion","criteria"]};
  function resolve(raw: unknown) {
    if (!record(raw) || Object.keys(raw).sort().join() !== "criteria,policyVersion,rubricVersion" || !record(raw.criteria) || Object.keys(raw.criteria).sort().join() !== Object.keys(criteria).sort().join()) return null;
    const rows = [];
    for (const [id,row] of Object.entries(raw.criteria)) {
      if (!record(row) || Object.keys(row).sort().join() !== "evidenceIds,reason,result" || !Array.isArray(row.evidenceIds)) return null;
      const citations = row.evidenceIds.map(key=>{const e=evidence.find(e=>e.id === key);return e ? {field:e.field,quote:e.quote} : {field:"invalid",quote:""};});
      rows.push({id,result:row.result,reason:row.reason,citations});
    }
    rows.push({id:"C2",result:"met",reason:"complete",citations:[{field:"prompt",quote:frozen.draft.prompt}]});
    return {...raw,status:rows.some(row=>row.result === "uncertain") ? "uncertain" : "succeeded",criteria:rows};
  }
  return {schema,evidence,resolve};
}
