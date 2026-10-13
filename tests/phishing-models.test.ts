import { describe, it, expect } from "vitest";
import { groqAttemptModels } from "../src/adapters/groq-attempt-models";
import { phishingPacket } from "../src/adapters/phishing-packet";
import { validateAssessment } from "../src/domain/assessment-policy";
import { phishingTask, phishingLesson } from "../src/domain/phishing-module";
import { simulationDraft } from "./simulation-fixtures";
import type { Frozen } from "../src/contracts/attempt";

function frozen():Frozen {return {task:phishingTask("independent",0),mode:"independent",assisted:false,draft:simulationDraft,practice:[],help:[],response:"No Practice AI.",variant:{id:"fixture",version:"CY-2-lesson-v2",content:phishingLesson("beginner"),hash:"fixture",objectiveId:"CY-2",rubricVersion:"CY-2-v2",explanationLevel:"beginner",locale:"en"}};}
function packetResult(f:Frozen) {
  const packet=phishingPacket(f);
  return {rubricVersion:"CY-2-v2",policyVersion:"pilot-v1",criteria:Object.fromEntries(f.task.criteria.filter(c=>c.id !== "C2").map(c=>[c.id,{result:"met",reason:"complete",evidenceIds:[packet.evidence.find(e=>e.field === (c.id === "C6" ? "explanation" : "checklist"))!.id]}]))};
}
describe("CY configured adapter protocol",()=>{
  it("derives overall status, resolves literal quotes and keeps model/account role configuration separate",async()=>{
    const f=frozen();let sent:Record<string,any>|null=null;
    const models=groqAttemptModels("fixture-key","configured-model",async(_url,init)=>{sent=JSON.parse(String(init?.body));return Response.json({choices:[{finish_reason:"stop",message:{content:JSON.stringify(packetResult(f))}}]});});
    const raw=await models.assessor.assess(f);const decision=validateAssessment(raw,f);
    expect(decision.status).toBe("succeeded");expect(decision.criteria).toHaveLength(6);
    const request=sent as Record<string,any>|null;
    expect(request?.model).toBe("configured-model");expect(request?.max_completion_tokens).toBe(3200);
    expect(request?.response_format.json_schema.schema.required).toEqual(["rubricVersion","policyVersion","criteria"]);
    expect(models.assessor.configurationFor!(f)).not.toBe(models.assessor.configuration);
    expect(models.assessor.configurationFor!({...f,task:{...f.task,objectiveId:"AI-2"}})).toBe(models.assessor.configuration);
  });
  it("safety is server-owned while genuine reasoning uncertainty remains pending",()=>{
    const f=frozen();const result=packetResult(f);
    const resolved=phishingPacket(f).resolve(result);expect(validateAssessment(resolved,f).status).toBe("succeeded");
    result.criteria.C3={...result.criteria.C3,result:"uncertain",reason:"ambiguous"};
    expect(validateAssessment(phishingPacket(f).resolve(result),f).status).toBe("uncertain");
  });
  it("rejects arbitrary criteria, invented IDs, unsupported reason codes and extra root commands",()=>{
    const f=frozen();const result=packetResult(f);
    for(const raw of [{...result,status:"succeeded"},{...result,awardMastery:true},{...result,criteria:{...result.criteria,C6:{...result.criteria.C6,evidenceIds:["invented"]}}},{...result,criteria:{...result.criteria,C1:{...result.criteria.C1,reason:"branding_authenticates"}}}])expect(validateAssessment(phishingPacket(f).resolve(raw),f).status).toBe("failed");
  });
  it("never accepts provider rejected generation even if it appears complete",async()=>{
    const f=frozen();const models=groqAttemptModels("fixture-key","configured-model",async()=>Response.json({error:{code:"json_validate_failed",failed_generation:JSON.stringify(packetResult(f))}},{status:400}));
    await expect(models.assessor.assess(f)).rejects.toThrow("MODEL_INVALID");
  });
});
