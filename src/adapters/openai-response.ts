import { createHash } from "node:crypto";

export const openaiDefaults = {model:"gpt-6.1-sol",reasoning:"low",endpoint:"https://api.openai.com/v1/responses"} as const;
export function openaiConfiguration(model:string|undefined,role:string,instruction:string,schema:unknown,maxTokens:number,policy="") {
  const hash=createHash("sha256").update(JSON.stringify({endpoint:openaiDefaults.endpoint,role,instruction,schema,maxTokens,reasoning:openaiDefaults.reasoning,store:false,policy})).digest("hex");
  return "openai:"+(model ?? "unconfigured")+":"+role+":"+hash;
}
async function boundedJson(response:Response):Promise<unknown> {
  const reader=response.body?.getReader();if(!reader)throw Error("MODEL_INVALID");
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>65536){await reader.cancel();throw Error("MODEL_INVALID");}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw Error("MODEL_INVALID");}
}
export async function openaiResponse(key:string|undefined,model:string|undefined,instruction:string,input:unknown,schema:unknown,maxTokens:number,transport:typeof fetch=fetch,timeoutMs=25000) {
  if(!key || !model)throw Error("MODEL_NOT_CONFIGURED");
  if(!Number.isInteger(timeoutMs) || timeoutMs<1000 || timeoutMs>60000)throw Error("MODEL_INVALID");
  const response=await transport(openaiDefaults.endpoint,{method:"POST",signal:AbortSignal.timeout(timeoutMs),headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model,instructions:instruction,input:[{role:"user",content:typeof input === "string" ? input : JSON.stringify(input)}],reasoning:{effort:openaiDefaults.reasoning},max_output_tokens:maxTokens,store:false,...(schema ? {text:{format:{type:"json_schema",name:"curiousnext_output",strict:true,schema}}} : {})})});
  if(!response.ok)throw Error(response.status === 429 ? "MODEL_LIMITED" : response.status === 400 ? "MODEL_INVALID" : "MODEL_UNAVAILABLE");
  const raw=await boundedJson(response);
  if(!raw || typeof raw !== "object" || Array.isArray(raw))throw Error("MODEL_INVALID");
  const data=raw as Record<string,unknown>;
  if(data.status !== "completed" || data.error || data.incomplete_details || !Array.isArray(data.output))throw Error("MODEL_INVALID");
  const text:string[]=[];
  for(const item of data.output) {
    if(!item || typeof item !== "object")throw Error("MODEL_INVALID");
    if(item.type === "reasoning")continue;
    if(item.type !== "message" || item.role !== "assistant" || !Array.isArray(item.content))throw Error("MODEL_INVALID");
    for(const content of item.content) {
      if(!content || typeof content !== "object")throw Error("MODEL_INVALID");
      if(content.type === "refusal")throw Error("MODEL_REFUSED");
      if(content.type !== "output_text" || typeof content.text !== "string")throw Error("MODEL_INVALID");
      text.push(content.text);
    }
  }
  const result=text.join("\n");if(!result.trim() || result.length>24000)throw Error("MODEL_INVALID");
  return result;
}
