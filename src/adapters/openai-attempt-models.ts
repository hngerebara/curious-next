import type { Assessor, PracticeModel } from "../contracts/attempt";
import { assessmentPacket, assessmentSchemaVersion } from "./assessment-packet";
import { phishingPacket } from "./phishing-packet";
import { phishingInstruction } from "./phishing-instruction";
import { practiceInstruction, assessmentInstruction } from "./attempt-instructions";
import { feedbackConfiguration } from "../domain/assessment-feedback";
import { responseInspection } from "../domain/response-inspection";
import { openaiResponse, openaiConfiguration } from "./openai-response";

export function openaiAttemptModels(key:string|undefined,model:string|undefined,transport:typeof fetch=fetch):{practice:PracticeModel;assessor:Assessor} {
  const policy=assessmentSchemaVersion+feedbackConfiguration;
  return {
    practice:{configuration:openaiConfiguration(model,"practice",practiceInstruction,null,1500),async respond(task,history,prompt) {
      const input={sourcePack:task.source,history:history.filter(p=>p.state === "succeeded").map(p=>({prompt:p.prompt,response:p.response})),prompt};
      const result=await openaiResponse(key,model,practiceInstruction,input,null,1500,transport);
      if(result.length>8000)throw Error("MODEL_INVALID");return result;
    }},
    assessor:{configuration:openaiConfiguration(model,"assessor",assessmentInstruction,"AI-2-packet",3200,policy),
      configurationFor(frozen){const cyber=frozen.task.objectiveId === "CY-2";return openaiConfiguration(model,"assessor",cyber ? phishingInstruction : assessmentInstruction,cyber ? "CY-2-packet-v9" : "AI-2-packet",3200,policy+(cyber ? ":cy-domain-v6:literal-branding-v1:literal-blanket-v1:retention-v1" : ""));},
      async assess(frozen) {
        const cyber=frozen.task.objectiveId === "CY-2";const packet=cyber ? phishingPacket(frozen) : assessmentPacket(frozen);
        const input={evidenceCatalogue:packet.evidence,task:frozen.task,draft:frozen.draft,response:frozen.response,deterministicAid:responseInspection(frozen.response),practiceHistory:frozen.practice.filter(p=>p.state === "succeeded").map(p=>({prompt:p.prompt,response:p.response}))};
        return packet.resolve(JSON.parse(await openaiResponse(key,model,cyber ? phishingInstruction : assessmentInstruction,input,packet.schema,3200,transport)));
      }
    }
  };
}
