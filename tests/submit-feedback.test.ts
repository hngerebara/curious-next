import {describe,it,expect} from "vitest";
import {submitForFeedback} from "../src/application/submit-feedback";
import type {Attempt} from "../src/contracts/attempt";
import {phishingTask} from "../src/domain/phishing-module";
import {simulationDraft} from "./simulation-fixtures";

const task=phishingTask("independent",0);
const draft:Attempt={id:"attempt",enrollmentId:"course",mode:"independent",task,draft:simulationDraft,revision:1,assisted:false,variant:{id:"variant",version:"lesson",content:"Lesson",hash:"hash",objectiveId:"CY-2",rubricVersion:"CY-2-v2",explanationLevel:"beginner",locale:"en"},practice:[],help:[],submission:null,createdAt:"2026-10-14T00:00:00Z"};
const submitted:Attempt={...draft,submission:{id:"submission",key:"key",hash:"frozen-hash",frozen:{task,draft:simulationDraft,mode:"independent",assisted:false,variant:draft.variant,practice:[],help:[],response:""},submittedAt:draft.createdAt,job:{state:"pending",claims:0,leaseUntil:null},assessments:[],reviewRequested:false}};
describe("single learner submission action",()=>{
  it("saves then freezes, exposes saved submission before calling assessor",async()=>{
    const calls:string[]=[];
    const result=await submitForFeedback({save:async()=>{calls.push("save");return draft;},freeze:async saved=>{expect(saved.revision).toBe(1);calls.push("freeze");return submitted;},onSaved:saved=>{expect(saved.submission?.hash).toBe("frozen-hash");calls.push("visible");},assess:async saved=>{calls.push("assess");return saved;}});
    expect(calls).toEqual(["save","freeze","visible","assess"]);expect(result.submission?.hash).toBe("frozen-hash");
  });
  it("keeps submitted answers recoverable if assessment transport fails",async()=>{
    let visible:Attempt|null=null;
    await expect(submitForFeedback({save:async()=>draft,freeze:async()=>submitted,onSaved:saved=>{visible=saved;},assess:async()=>{throw Error("interrupted");}})).rejects.toThrow("interrupted");
    expect((visible as Attempt|null)?.submission?.job.state).toBe("pending");
  });
  it("resumed saved submission never freezes or creates another submission",async()=>{
    await submitForFeedback({save:async()=>submitted,freeze:async()=>{throw Error("Duplicate freeze");},onSaved:()=>{},assess:async saved=>saved});
  });
});
