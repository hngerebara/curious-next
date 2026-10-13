import type { Frozen, EvidenceField, AiCriterionId } from "../contracts/attempt";
import { record } from "../domain/course-policy";
import { assessmentReasons, assessmentFeedback, feedbackVersion } from "../domain/assessment-feedback";
export const assessmentSchemaVersion = "six-required-criteria-reasons-v7:" + feedbackVersion;
export function assessmentPacket(frozen:Frozen) {
  const evidence:{id:string;field:EvidenceField;quote:string}[]=[];
  for(const [name,text] of Object.entries({...frozen.draft,response:frozen.response})){
    const field=name as EvidenceField;let index=0;
    for(const sentence of (field === "response" ? [text] : text.split(/(?<=[.!?])\s+|\n+/)).filter(s=>s.trim())){
      // Exact chunks are bounded even for a learner's long unpunctuated sentence.
      for(let start=0;start<sentence.length;start+=500){const quote=sentence.slice(start,start+500).trim();if(quote)evidence.push({id:`${field}-${index++}`,field,quote});}
    }
  }
  const fieldsFor=(id:string):EvidenceField[]=>id === "A5" ? ["checklist"] : id === "A6" ? ["explanation"] : ["prompt"];
  const criteria:Record<string,unknown>={};
  for(const id of ["A1","A2","A3","A4","A5","A6"] as AiCriterionId[]){
    const properties={result:{type:"string",enum:["met","not_met","uncertain"]},reason:{type:"string",enum:assessmentReasons(id)},evidenceIds:{type:"array",minItems:1,maxItems:8,items:{type:"string",enum:evidence.filter(e=>fieldsFor(id).includes(e.field)).map(e=>e.id)}},responseEvidenceId:{type:"string",enum:id === "A5" ? evidence.filter(e=>e.field === "response").map(e=>e.id) : ["not_applicable"]}};
    criteria[id]={type:"object",additionalProperties:false,properties,required:Object.keys(properties)};
  }
  const schema={type:"object",additionalProperties:false,properties:{rubricVersion:{type:"string",enum:["AI-2-v2"]},policyVersion:{type:"string",enum:["pilot-v1"]},status:{type:"string",enum:["succeeded","uncertain"]},criteria:{type:"object",additionalProperties:false,properties:criteria,required:Object.keys(criteria)}},required:["rubricVersion","policyVersion","status","criteria"]};
  function resolve(raw:unknown) {
    if(!record(raw) || !record(raw.criteria))return raw;
    const results=[];
    for(const id of Object.keys(raw.criteria)){
      const row=raw.criteria[id];if(!record(row) || !Object.keys(criteria).includes(id) || Object.keys(row).sort().join() !== "evidenceIds,reason,responseEvidenceId,result")return raw;
      const feedback=assessmentFeedback(id as AiCriterionId,row.result,row.reason,frozen);if(!feedback)return raw;
      if(!Array.isArray(row.evidenceIds) || row.evidenceIds.length < 1 || row.evidenceIds.length > 8 || id !== "A5" && row.responseEvidenceId !== "not_applicable")return raw;
      const citations=row.evidenceIds.map(key=>{const found=evidence.find(e=>e.id === key && fieldsFor(id).includes(e.field));return found ? {field:found.field,quote:found.quote} : {field:"invalid",quote:""};});
      if(id === "A5") { const found=evidence.find(e=>e.id === row.responseEvidenceId && e.field === "response"); citations.push(found ? {field:found.field,quote:found.quote} : {field:"invalid",quote:""}); }
      results.push({id,result:row.result,feedback,citations});
    }
    return {...raw,criteria:results};
  }
  return {schema,evidence,resolve};
}
