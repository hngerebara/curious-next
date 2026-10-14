import { createHash } from "node:crypto";
import { phishingPacket } from "./phishing-packet";
import { phishingInstruction } from "./phishing-instruction";
import { assessmentPacket, assessmentSchemaVersion } from "./assessment-packet";
import { feedbackConfiguration } from "../domain/assessment-feedback";
import { responseInspection } from "../domain/response-inspection";
import type { Assessor, PracticeModel, Frozen } from "../contracts/attempt";

import { practiceInstruction, assessmentInstruction } from "./attempt-instructions";
async function boundedBody(response:Response) {
  const reader = response.body?.getReader(); if (!reader) throw new Error("MODEL_INVALID");
  const chunks: Uint8Array[] = []; let length=0;
  while (true) { const {value,done}=await reader.read(); if (done) break; length+=value.length; if (length>65536) {await reader.cancel();throw new Error("MODEL_INVALID");} chunks.push(value); }
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return new TextDecoder().decode(bytes);
}
async function completion(key: string | undefined, model: string | undefined, messages: {role:string;content:string}[], schema: unknown | null, transport: typeof fetch) {
  if (!key || !model) throw new Error("MODEL_NOT_CONFIGURED");
  const response = await transport("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",signal:AbortSignal.timeout(25000),headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify({model,max_completion_tokens:schema ? 3200 : 1500,messages,...(schema ? {response_format:{type:"json_schema",json_schema:{name:"attempt_assessment",strict:true,schema}}} : {})}),
  });
  if (!response.ok) {
    if (response.status === 400) {
      try { const raw=JSON.parse(await boundedBody(response)); if(raw?.error?.code === "json_validate_failed")throw new Error("MODEL_INVALID"); }
      catch(error){if(error instanceof Error && error.message === "MODEL_INVALID")throw error;}
    }
    throw new Error(response.status === 429 ? "MODEL_LIMITED" : "MODEL_UNAVAILABLE");
  }
  const raw=JSON.parse(await boundedBody(response));const choice=raw?.choices?.[0];
  if (raw?.choices?.length !== 1 || choice?.message?.refusal || choice?.finish_reason !== "stop" || typeof choice?.message?.content !== "string" || !choice.message.content.trim() || choice.message.content.length>24000) throw new Error("MODEL_INVALID");
  return choice.message.content as string;
}
export function groqAttemptModels(key: string | undefined, model: string | undefined, transport: typeof fetch = fetch): {practice: PracticeModel; assessor: Assessor} {
  const configuration = (role:string, instruction:string)=>`groq:${model ?? "unconfigured"}:${role}:${createHash("sha256").update(instruction+(role === "assessor" ? assessmentSchemaVersion+feedbackConfiguration+":max_completion_tokens=3200" : "")).digest("hex")}`;
  return {
    practice:{configuration:configuration("practice",practiceInstruction),async respond(task,history,prompt){
      const messages=[{role:"system",content:practiceInstruction+"\nSource pack: "+task.source}];
      for (const prior of history.filter(p=>p.state === "succeeded")) {messages.push({role:"user",content:prior.prompt},{role:"assistant",content:prior.response!});}
      messages.push({role:"user",content:prompt});
      const response=await completion(key,model,messages,null,transport);
      if(response.length>8000)throw new Error("MODEL_INVALID");return response;
    }},
    assessor:{configuration:configuration("assessor",assessmentInstruction),configurationFor(frozen){return frozen.task.objectiveId === "CY-2" ? configuration("assessor",phishingInstruction+":cy-packet-v9:phishing-reasons-v2:cy-domain-v6:literal-branding-v1:literal-blanket-v1:retention-v1") : configuration("assessor",assessmentInstruction);},async assess(frozen: Frozen){
      const cyber = frozen.task.objectiveId === "CY-2";
      const packet=cyber ? phishingPacket(frozen) : assessmentPacket(frozen);
      const data={evidenceCatalogue:packet.evidence,task:frozen.task,draft:frozen.draft,response:frozen.response,deterministicAid:responseInspection(frozen.response),practiceHistory:frozen.practice.filter(p=>p.state === "succeeded").map(p=>({prompt:p.prompt,response:p.response}))};
      return packet.resolve(JSON.parse(await completion(key,model,[{role:"system",content:cyber ? phishingInstruction : assessmentInstruction},{role:"user",content:JSON.stringify(data)}],packet.schema,transport)));
    }},
  };
}
