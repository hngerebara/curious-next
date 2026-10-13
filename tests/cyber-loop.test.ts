import { afterEach, describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { courseHarness, output, request, courseOrigin } from "./course-harness";
import { attemptStore } from "../src/adapters/attempt-store";
import { attemptService } from "../src/application/attempt-service";
import { attemptHttp } from "../src/application/attempt-http";
import { simulationDraft, simulationDecision } from "./simulation-fixtures";
import type { Assessor, AttemptMode, Draft } from "../src/contracts/attempt";

const cleanups: (()=>Promise<void>)[]=[];
afterEach(async()=>{for(const close of cleanups.splice(0)) await close();});
async function harness(assess:Assessor["assess"] = async frozen=>simulationDecision(frozen)) {
  const h=await courseHarness(async()=>output("phishing","phishing"));cleanups.push(h.close);
  for(const name of ["0004-attempt-loop.sql","0005-retention-modes.sql"]) await h.sql.exec(await readFile(new URL(`../migrations/${name}`,import.meta.url),"utf8"));
  const goal=await h.goal({goalText:"Recognise phishing messages",explanationLevel:"beginner",teachingLanguage:"en",sessionMinutes:20});
  const plan=await h.service.generate("learner-a",goal.id,h.key());
  const enrollment=await h.service.accept("learner-a",plan.id,h.key());await h.service.place("learner-a",enrollment.id,"skip");
  let clock=new Date();const store=attemptStore(h.db,()=>clock);let calls=0;
  const loop=attemptService(store,h.store,{configuration:"unused",respond:async()=>{throw Error("CY_PRACTICE_MUST_NOT_RUN");}},{configuration:"cy-test-v1",assess:async f=>{calls++;return assess(f);}},{allow:async()=>true},{emit:()=>{}});
  const http=attemptHttp({session:async headers=>{const id=headers.get("x-test-owner");return id ? {id,email:"fixture@example.test"} : null;}},store,loop,courseOrigin);
  async function submit(mode:AttemptMode="independent",draft:Draft=simulationDraft) {
    const a=await loop.create("learner-a",enrollment.id,mode,h.key());const saved=await store.save("learner-a",a.id,0,draft);
    return store.submit("learner-a",a.id,saved.revision,h.key());
  }
  return {...h,store,loop,http,enrollment,submit,modelCalls:()=>calls,advance:(days:number)=>{clock=new Date(clock.getTime()+days*86400000);}};
}
describe("shared durable CY-2 loop",{timeout:20000},()=>{
  it("safe decisions freeze without Practice AI, assessment/replay creates one evidence and transfer is distinct",async()=>{
    const h=await harness();expect((await h.loop.learning("learner-a",h.enrollment.id)).objectiveId).toBe("CY-2");
    const a=await h.submit();expect(a.practice).toHaveLength(0);
    const before=a.submission!.hash;
    await Promise.all([h.loop.assess("learner-a",a.id),h.loop.assess("learner-a",a.id)]);
    await h.loop.assess("learner-a",a.id);
    const initial=await h.loop.learning("learner-a",h.enrollment.id);
    expect(initial.capability.state).toBe("demonstrated");expect(initial.evidence).toHaveLength(1);expect(h.modelCalls()).toBe(1);
    expect((await h.store.read("learner-a",a.id)).submission!.hash).toBe(before);
    await expect(h.loop.create("learner-a",h.enrollment.id,"recall",h.key())).rejects.toThrow("ACTIVITY_NOT_AVAILABLE");
    const t=await h.submit("transfer");expect(t.task.family).toBe("recruitment");expect(t.task.family).not.toBe(a.task.family);
    await h.loop.assess("learner-a",t.id);const after=await h.loop.learning("learner-a",h.enrollment.id);
    expect(after.capability).toMatchObject({firstIndependentEvidenceId:initial.capability.firstIndependentEvidenceId,transfer:"demonstrated",retention:"not_checked"});
    expect(after.evidence.map(e=>e.type)).toEqual(["independent_application","transfer"]);
    expect(after.recallDueAt).toBe(initial.recallDueAt);
  });
  it("V4 explicit cited misconception resolves only after fresh unassisted assessed correction",async()=>{
    let count=0;const h=await harness(async f=>{const d=simulationDecision(f);if(count++ === 0)d.criteria[4]={...d.criteria[4],result:"not_met",reason:"branding_authenticates"};return d;});
    const bad=await h.submit("independent",{...simulationDraft,checklist:"The familiar logo proves this is authentic. I trust it because it looks official."});await h.loop.assess("learner-a",bad.id);
    const first=await h.loop.learning("learner-a",h.enrollment.id);expect(first.misconceptions[0]).toMatchObject({state:"confirmed",quote:"The familiar logo proves this is authentic."});expect(first.recommendation.kind).toBe("fix");
    const supported=await h.loop.create("learner-a",h.enrollment.id,"independent",h.key());await h.loop.help("learner-a",supported.id,h.key(),"hint");await h.store.save("learner-a",supported.id,0,simulationDraft);await h.store.submit("learner-a",supported.id,1,h.key());await h.loop.assess("learner-a",supported.id);
    expect((await h.loop.learning("learner-a",h.enrollment.id)).misconceptions[0].state).toBe("confirmed");
    const correction=await h.submit();expect(correction.task.version).not.toBe(bad.task.version);await h.loop.assess("learner-a",correction.id);
    const resolved=await h.loop.learning("learner-a",h.enrollment.id);expect(resolved.misconceptions[0].state).toBe("resolved");expect(resolved.capability.state).toBe("demonstrated");expect(resolved.evidence).toHaveLength(3);
  });
  it("V5 due recall failure preserves proof and schedules next-day recheck without duplicate schedules",async()=>{
    let count=0;const h=await harness(async f=>{const d=simulationDecision(f);if(count++ === 1)d.criteria[0]={...d.criteria[0],result:"not_met",reason:"missing"};return d;});
    const proof=await h.submit();await h.loop.assess("learner-a",proof.id);
    // Synthetic elapsed time, never represented as an actual delayed learner study.
    h.advance(2);
    const created=await Promise.allSettled([h.loop.create("learner-a",h.enrollment.id,"recall",h.key()),h.loop.create("learner-a",h.enrollment.id,"recall",h.key())]);
    expect(created.filter(r=>r.status === "fulfilled")).toHaveLength(1);
    const first=created.find(r=>r.status === "fulfilled")!;if(first.status !== "fulfilled")throw Error("No recall reserved");
    const saved=await h.store.save("learner-a",first.value.id,0,simulationDraft);const r=await h.store.submit("learner-a",saved.id,saved.revision,h.key());
    await expect(h.loop.create("learner-a",h.enrollment.id,"recall",h.key())).rejects.toThrow("ACTIVITY_ALREADY_STARTED");
    await h.loop.assess("learner-a",r.id);const after=await h.loop.learning("learner-a",h.enrollment.id);
    expect(after.capability).toMatchObject({state:"needs_review",retention:"needs_review",transfer:"not_checked"});
    expect(after.capability.firstIndependentEvidenceId).toBe(after.evidence[0].id);expect(after.evidence[1].type).toBe("retention");
    const due=after.recallDueAt;await h.loop.assess("learner-a",r.id);expect((await h.loop.learning("learner-a",h.enrollment.id)).recallDueAt).toBe(due);
  });
  it("failure recovery reuses frozen snapshot and uncertainty grants no evidence",async()=>{
    let count=0;const h=await harness(async f=>{count++;if(count === 1)throw Error("MODEL_INVALID");if(count === 2){const d=simulationDecision(f);d.status="uncertain";d.criteria[0]={...d.criteria[0],result:"uncertain",reason:"ambiguous"};return d;}return simulationDecision(f);});
    const a=await h.submit();for(const state of ["failed","uncertain"]){const result=await h.loop.assess("learner-a",a.id);expect(result.submission!.job.state).toBe(state);expect((await h.loop.learning("learner-a",h.enrollment.id)).evidence).toHaveLength(0);}
    const success=await h.loop.assess("learner-a",a.id);expect(success.submission!.hash).toBe(a.submission!.hash);expect(success.submission!.assessments).toHaveLength(3);expect((await h.loop.learning("learner-a",h.enrollment.id)).evidence).toHaveLength(1);
  });
  it("rejects cross-owner reads/mutations, origin forgery, invalid choices and Practice AI on CY",async()=>{
    const h=await harness();const a=await h.loop.create("learner-a",h.enrollment.id,"independent",h.key());
    for(const path of [`/api/attempts/${a.id}`,`/api/learning?enrollmentId=${h.enrollment.id}`])expect((await h.http(request(path,"GET",undefined,h.key(),"learner-b"),path.includes("attempts") ? a.id : undefined)).status).toBe(404);
    expect((await h.http(request(`/api/attempts/${a.id}`,"PATCH",{revision:0,draft:simulationDraft},h.key(),"learner-b"),a.id)).status).toBe(404);
    expect((await h.http(request(`/api/attempts/${a.id}/submit`,"POST",{revision:0},h.key(),"learner-a","https://evil.test"),a.id,"submit")).status).toBe(403);
    await expect(h.loop.practice("learner-a",a.id,h.key(),0)).rejects.toThrow("ACTIVITY_NOT_AVAILABLE");
    await h.store.save("learner-a",a.id,0,{...simulationDraft,prompt:'{"request":["open-site"],"routine":["delete"]}'});
    await expect(h.store.submit("learner-a",a.id,1,h.key())).rejects.toThrow("INCOMPLETE_SUBMISSION");
  });
});
