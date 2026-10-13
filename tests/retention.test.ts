import { brandingEndorsement } from "../src/domain/branding-inspection";
import { simulationDraft, simulationDecision } from "./simulation-fixtures";
import { describe, it, expect } from "vitest";
import { retentionProjection, retentionRecommendation } from "../src/domain/retention-policy";
import { validateAssessment } from "../src/domain/assessment-policy";
import { phishingTask } from "../src/domain/phishing-module";
import type { Evidence, Frozen } from "../src/contracts/attempt";

const criteria = phishingTask("independent",0).criteria.map(c=>({id:c.id,result:"met" as const,citations:[],feedback:"Meets the criterion."}));
function evidence(id:string,type:Evidence["type"],date:string,success=true): Evidence {
  return {id,objectiveId:"CY-2",attemptId:id,submissionId:id,assessmentId:id,type,taskVersion:`task-${id}`,family:type === "transfer" ? "recruitment" : "account-security",assisted:false,demonstrated:type === "independent_application" && success,criteria:criteria.map(c=>({...c,result:success ? "met" : "not_met"})),rubricVersion:"CY-2-v2",policyVersion:"pilot-v1",assessedAt:date};
}
describe("M4 evidence projection",()=>{
  it("V5 preserves initial proof and keeps failed recall separate from transfer",()=>{
    const proof=evidence("initial","independent_application","2026-10-01T12:00:00Z");
    const failed=evidence("recall","retention","2026-10-02T12:00:00Z",false);
    const transfer=evidence("transfer","transfer","2026-10-02T13:00:00Z");
    const p=retentionProjection([transfer,failed,proof],"CY-2",new Date("2026-10-03T13:00:00Z"));
    expect(p.capability).toMatchObject({state:"needs_review",firstIndependentEvidenceId:"initial",retention:"needs_review",transfer:"demonstrated",reviewReasons:["retention"]});
    expect(p.recallDueAt).toBe("2026-10-03T12:00:00.000Z");
    expect(retentionRecommendation(p,"CY-2",10).kind).toBe("recall");
  });
  it("failed recall recommends its own targeted practice before the next-day recheck",()=>{
    const proof=evidence("proof","independent_application","2026-10-01T00:00:00Z");
    const recall=evidence("failed-recall","retention","2026-10-02T00:00:00Z",false);
    const transfer=evidence("later-transfer","transfer","2026-10-02T01:00:00Z");
    const p=retentionProjection([proof,recall,transfer],"CY-2",new Date("2026-10-02T02:00:00Z"));
    expect(retentionRecommendation(p,"CY-2",10)).toMatchObject({kind:"practise",evidenceId:"failed-recall",minutes:10});
  });
  it("fresh message content changes, and practice remains available after proof scenarios exhaust",()=>{
    expect(phishingTask("independent",0).messages![0].text).not.toBe(phishingTask("independent",1).messages![0].text);
    expect(()=>phishingTask("independent",12)).toThrow("FRESH_TASKS_EXHAUSTED");
    expect(phishingTask("practice",12).family).toBe("delivery");
  });
  it("successful recall advances 1/3/7/14/30 intervals and leaves failed transfer unresolved",()=>{
    const rows=[evidence("proof","independent_application","2026-10-01T00:00:00Z"),evidence("bad-transfer","transfer","2026-10-01T01:00:00Z",false)];
    for(const [i,date,days] of [[0,"2026-10-02",3],[1,"2026-10-05",7],[2,"2026-10-12",14],[3,"2026-10-26",30],[4,"2026-11-25",30]] as const) {
      rows.push(evidence(`recall-${i}`,"retention",date+"T00:00:00Z"));
      const p=retentionProjection(rows,"CY-2");
      expect(Date.parse(p.recallDueAt!)-Date.parse(date+"T00:00:00Z")).toBe(days*86400000);
      expect(p.capability).toMatchObject({state:"needs_review",retention:"demonstrated",transfer:"needs_review"});
    }
  });
  it("V4 requires different independent correction, preserves confirmation and reopening history",()=>{
    const bad=evidence("bad","independent_application","2026-10-01T00:00:00Z",false);
    bad.misconception={quote:"The familiar logo proves it is genuine.",field:"checklist"};
    const assisted={...evidence("supported","assisted_application","2026-10-02T00:00:00Z"),assisted:true};
    const same={...evidence("same","independent_application","2026-10-03T00:00:00Z"),taskVersion:bad.taskVersion};
    expect(retentionProjection([bad,assisted,same],"CY-2").misconceptions[0].state).toBe("confirmed");
    const correction=evidence("fresh","transfer","2026-10-04T00:00:00Z");
    const reopen={...evidence("reopen","independent_application","2026-10-05T00:00:00Z",false),misconception:bad.misconception};
    const p=retentionProjection([bad,assisted,same,correction,reopen],"CY-2");
    expect(p.misconceptions).toMatchObject([{state:"resolved",sourceEvidenceId:"bad",resolutionEvidenceId:"fresh"},{state:"confirmed",sourceEvidenceId:"reopen"}]);
    expect(retentionRecommendation(p,"CY-2",20).kind).toBe("fix");
  });
  it("assisted checks do not prove retention, resolve errors or replace initial evidence",()=>{
    const proof=evidence("proof","independent_application","2026-10-01T00:00:00Z");
    const assisted={...evidence("help","retention","2026-10-02T00:00:00Z"),assisted:true};
    const p=retentionProjection([proof,assisted],"CY-2");
    expect(p.capability.retention).toBe("not_checked");
    expect(p.recallDueAt).toBe("2026-10-02T00:00:00.000Z");
  });
  it("cannot manufacture initial demonstration from recall/transfer and filters other objectives",()=>{
    const p=retentionProjection([evidence("recall","retention","2026-10-01T00:00:00Z"),evidence("transfer","transfer","2026-10-02T00:00:00Z")],"CY-2");
    expect(p.capability.firstIndependentEvidenceId).toBeNull();
    expect(p.recallDueAt).toBeNull();
    expect(retentionProjection([evidence("cy","independent_application","2026-10-01T00:00:00Z")],"AI-2").capability.state).toBe("not_assessed");
  });
});

function frozen():Frozen {return {task:phishingTask("independent",0),mode:"independent",assisted:false,draft:simulationDraft,practice:[],response:"",help:[],variant:{id:"variant",version:"CY-2-lesson-v2",content:"Fictional lesson",hash:"hash",explanationLevel:"beginner",objectiveId:"CY-2",rubricVersion:"CY-2-v2",locale:"en"}};}
describe("CY-2 validated action and reasoning boundary",()=>{
  it("unsafe selected action overrides fluent model met judgment",()=>{
    const f=frozen();f.draft={...f.draft,prompt:JSON.stringify({request:["verify","use-link"],routine:["continue-routine"]})};
    const d=validateAssessment(simulationDecision(f),f);
    expect(d.status).toBe("uncertain");expect(d.criteria.find(c=>c.id === "C2")!.result).toBe("not_met");
  });
  it("accepts alternate safe deletion/additional verification without a single exact action key",()=>{
    for(const routine of [["delete"],["verify"],["verify","delete"]]) {
      const f=frozen();f.draft={...f.draft,prompt:JSON.stringify({request:["verify"],routine})};
      expect(validateAssessment(simulationDecision(f),f).criteria.every(c=>c.result === "met")).toBe(true);
    }
  });
  it("invalid actions, invented citations, omissions and wrong versions fail closed",()=>{
    const f=frozen();const good=simulationDecision(f);
    for (const raw of [{...good,rubricVersion:"CY-2-v1"},{...good,criteria:good.criteria.slice(1)},{...good,criteria:good.criteria.map(c=>({...c,citations:[{field:"checklist",quote:"invented evidence"}]}))},{...good,criteria:good.criteria.map(c=>({...c,reason:"branding_authenticates"}))}]) expect(validateAssessment(raw,f).status).toBe("failed");
    f.draft={...f.draft,prompt:'{"request":["visit-real-site"],"routine":["delete"]}'};
    expect(validateAssessment(good,f).status).toBe("failed");
  });
  it("CY reasoning citations follow content across rationale fields, without inventing evidence",()=>{
    const f=frozen();f.draft={...f.draft,checklist:f.draft.checklist+" "+f.draft.explanation};
    const raw=simulationDecision(f);raw.criteria[5]={...raw.criteria[5],citations:[{field:"checklist",quote:f.draft.explanation}]};
    expect(validateAssessment(raw,f).criteria.find(c=>c.id === "C6")!.result).toBe("met");
  });
  it("literal branding endorsement overrides a generic model reason without confirming rejected quotations",()=>{
    const f=frozen();f.draft={...f.draft,checklist:"I think its familiar logo proves that the sender is authentic, so I trust the message."};
    const raw=simulationDecision(f);raw.criteria[4]={...raw.criteria[4],result:"not_met",reason:"missing"};
    const result=validateAssessment(raw,f).criteria.find(c=>c.id === "C5")!;
    expect(result.reason).toBe("branding_authenticates");expect(result.citations[0].quote).toBe(f.draft.checklist);
    expect(brandingEndorsement({...f.draft,explanation:"I reject the belief stated above."})).toBeNull();
    for(const text of ['"I think its familiar logo proves that the sender is authentic" is wrong.',"I used to believe the familiar logo proves the sender is authentic. I reject that belief.","The familiar logo does not prove the sender is authentic.","I think its familiar logo proves that the sender is authentic, but that belief is wrong."])expect(brandingEndorsement({...simulationDraft,checklist:text})).toBeNull();
  });
  it("conflicting reasoning stays uncertain, no demonstrated outcome",()=>{
    const f=frozen();const raw=simulationDecision(f);raw.status="uncertain";raw.criteria[2]={...raw.criteria[2],result:"uncertain",reason:"ambiguous"};
    expect(validateAssessment(raw,f).status).toBe("uncertain");
  });
});
