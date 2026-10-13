import { readFile } from "node:fs/promises";
import type { Assessor, Draft, Frozen, PracticeModel } from "../src/contracts/attempt";
import { courseHarness } from "./course-harness";
import { attemptStore } from "../src/adapters/attempt-store";
import { attemptService } from "../src/application/attempt-service";
import { attemptHttp } from "../src/application/attempt-http";
import { courseOrigin } from "./course-harness";
export const response = "Q: When and where?\nA: Tuesdays at 18:00 online.\nQ: Duration and fee?\nA: 45 minutes, no fee.\nQ: Are sessions recorded?\nA: The source does not provide the recording policy.";
export const draft: Draft = {prompt:"Using the supplied source pack, create exactly three FAQ entries for prospective members, covering meeting time/location, duration/fee and whether sessions are recorded. Use question-and-answer pairs, fewer than 30 words per answer, only source facts and state that the recording policy is not supplied.",checklist:"There are three FAQ pairs. Each answer is fewer than 30 words, counting whitespace tokens. Time, location, duration and fee match the source. The recording answer correctly states that the policy is not supplied.",explanation:"My prompt specifies task, audience, source facts, length limits, missing-policy uncertainty and FAQ format. I still verify every claim because an AI can ignore instructions or invent facts."};
export function decision(frozen:Frozen,result="met") {
  return {rubricVersion:"AI-2-v2",policyVersion:"pilot-v1",status:"succeeded",criteria:frozen.task.criteria.map(c=>({id:c.id,result,feedback:`Evidence supports ${c.title.toLowerCase()} for this fixed brief.`,citations:[{field:c.id === "A5" ? "checklist" : c.id === "A6" ? "explanation" : "prompt",quote:c.id === "A5" ? frozen.draft.checklist : c.id === "A6" ? frozen.draft.explanation : frozen.draft.prompt},...(c.id === "A5" ? [{field:"response",quote:frozen.response.slice(0,200)}] : [])]}))};
}
export async function attemptHarness(assess:Assessor["assess"] = async frozen=>decision(frozen),respond:PracticeModel["respond"] = async()=>response) {
  const h=await courseHarness();await h.sql.exec(await readFile(new URL("../migrations/0004-attempt-loop.sql",import.meta.url),"utf8"));
  await h.sql.exec(await readFile(new URL("../migrations/0005-retention-modes.sql",import.meta.url),"utf8"));
  const goal=await h.goal();const plan=await h.service.generate("learner-a",goal.id,h.key());const enrollment=await h.service.accept("learner-a",plan.id,h.key());await h.service.place("learner-a",enrollment.id,"skip");
  const store=attemptStore(h.db);let modelCalls=0,assessorCalls=0;
  const service=attemptService(store,h.store,{configuration:"practice-test-v1",async respond(...args){modelCalls++;return respond(...args);}},{configuration:"assessor-test-v1",async assess(frozen){assessorCalls++;return assess(frozen);}},{allow:async()=>true},{emit:()=>{}});
  const http=attemptHttp({session:async headers=>{const id=headers.get("x-test-owner");return id && ["learner-a","learner-b"].includes(id) ? {id,email:"fixture@example.test"} : null;}},store,service,courseOrigin);
  async function prepared(mode:"practice"|"independent"="independent") {
    const a=await service.create("learner-a",enrollment.id,mode,h.key());
    const saved=await store.save("learner-a",a.id,0,draft);
    return service.practice("learner-a",a.id,h.key(),saved.revision);
  }
  async function submitted(){const a=await prepared();return store.submit("learner-a",a.id,a.revision,h.key());}
  return {...h,attempts:store,loop:service,http,enrollment,prepared,submitted,calls:()=>({modelCalls,assessorCalls})};
}
