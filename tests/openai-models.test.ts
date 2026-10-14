import {describe,it,expect} from "vitest";
import {openaiResponse,openaiConfiguration} from "../src/adapters/openai-response";
import {openaiCourseGenerator} from "../src/adapters/openai-course-generator";
import {openaiAttemptModels} from "../src/adapters/openai-attempt-models";
import {phishingPacket} from "../src/adapters/phishing-packet";
import {phishingTask,phishingLesson} from "../src/domain/phishing-module";
import {validateAssessment} from "../src/domain/assessment-policy";
import {simulationDraft} from "./simulation-fixtures";
import type {Frozen} from "../src/contracts/attempt";

function frozen():Frozen{return {task:phishingTask("independent",0),mode:"independent",assisted:false,draft:simulationDraft,practice:[],help:[],response:"No Practice AI",variant:{id:"fixture",version:"CY-2-lesson-v2",content:phishingLesson("beginner"),hash:"fixture",explanationLevel:"beginner",objectiveId:"CY-2",rubricVersion:"CY-2-v2",locale:"en"}};}
const response=(text:string)=>Response.json({status:"completed",error:null,incomplete_details:null,output:[{type:"reasoning"},{type:"message",role:"assistant",content:[{type:"output_text",text}]}]});
describe("OpenAI server adapter",()=>{
  it("uses Responses, strict schemas and private stateless settings",async()=>{
    let body:any=null;let url="";const f=frozen();const packet=phishingPacket(f);
    const raw={rubricVersion:"CY-2-v2",policyVersion:"pilot-v1",criteria:Object.fromEntries(f.task.criteria.filter(c=>c.id !== "C2").map(c=>[c.id,{result:"met",reason:"complete",evidenceIds:[packet.evidence.find(e=>e.field === (c.id === "C6" ? "explanation" : "checklist"))!.id]}]))};
    const models=openaiAttemptModels("fixture-secret","configured-model",async(u,i)=>{url=String(u);body=JSON.parse(String(i?.body));return response(JSON.stringify(raw));});
    expect(validateAssessment(await models.assessor.assess(f),f).status).toBe("succeeded");
    expect(url).toBe("https://api.openai.com/v1/responses");expect(body).toMatchObject({model:"configured-model",store:false,reasoning:{effort:"low"},max_output_tokens:3200,text:{format:{type:"json_schema",strict:true}}});
    expect(body).not.toHaveProperty("tools");expect(body).not.toHaveProperty("temperature");
    expect(body.text.format.schema.properties.criteria.required).toEqual(["C1","C3","C4","C5","C6"]);
    expect(models.assessor.configurationFor!(f)).not.toContain("fixture-secret");
  });
  it("rejects refusal, incomplete, malformed and oversized output",async()=>{
    const bad=[{status:"incomplete",output:[]},{status:"completed",output:[{type:"message",role:"assistant",content:[{type:"refusal",refusal:"No"}]}]},{status:"completed",output:[{type:"message",role:"assistant",content:[null]}]},{status:"completed",output:[{type:"function_call"}]}];
    for(const raw of bad)await expect(openaiResponse("key","model","rules",{},null,1500,async()=>Response.json(raw))).rejects.toThrow(/MODEL_(INVALID|REFUSED)/);
    await expect(openaiResponse("key","model","rules",{},null,1500,async()=>new Response("x".repeat(65537)))).rejects.toThrow("MODEL_INVALID");
    await expect(openaiResponse("key","model","rules",{},null,1500,async()=>response("x".repeat(24001)))).rejects.toThrow("MODEL_INVALID");
  });
  it("keeps provider failure explicit and never parses failed generation",async()=>{
    for(const [status,code] of [[429,"MODEL_LIMITED"],[400,"MODEL_INVALID"],[503,"MODEL_UNAVAILABLE"]] as const)await expect(openaiResponse("key","model","rules",{},null,3200,async()=>Response.json({output:"looks valid"},{status}))).rejects.toThrow(code);
    await expect(openaiResponse(undefined,"model","rules",{},null,1500,async()=>{throw Error("Must not call provider");})).rejects.toThrow("MODEL_NOT_CONFIGURED");
  });
  it("pins model, policy, schema version and role budgets in configuration",()=>{
    const values=[openaiConfiguration("a","assessor","rules","schema",3200,"v1"),openaiConfiguration("b","assessor","rules","schema",3200,"v1"),openaiConfiguration("a","assessor","rules","schema",4000,"v1"),openaiConfiguration("a","assessor","rules","schema",3200,"v2"),openaiConfiguration("a","practice","rules","schema",3200,"v1"),openaiConfiguration("a","assessor","new rules","schema",3200,"v1"),openaiConfiguration("a","assessor","rules","new schema",3200,"v1")];expect(new Set(values).size).toBe(7);
  });
  it("maps course rate limits and unavailability without substitution",async()=>{
    const goal={goalText:"Recognise phishing messages",explanationLevel:"beginner" as const,teachingLanguage:"en" as const,sessionMinutes:20 as const};const catalogue={version:"test",status:"draft" as const,objectives:[]};
    await expect(openaiCourseGenerator("key","model",async()=>Response.json({error:{}},{status:429})).generate(goal,catalogue)).rejects.toThrow("GENERATOR_RATE_LIMITED");
    await expect(openaiCourseGenerator("key","model",async()=>Response.json({error:{}},{status:503})).generate(goal,catalogue)).rejects.toThrow("GENERATOR_UNAVAILABLE");
  });
});
