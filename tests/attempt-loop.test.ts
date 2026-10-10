import { afterEach, describe, expect, it } from "vitest";
import { attemptHarness, decision, draft } from "./attempt-harness";
import { request } from "./course-harness";
import { validateAssessment } from "../src/domain/assessment-policy";
const harnesses:Awaited<ReturnType<typeof attemptHarness>>[]=[];
afterEach(async()=>{for(const h of harnesses.splice(0))await h.close();});
async function harness(...args:Parameters<typeof attemptHarness>){const h=await attemptHarness(...args);harnesses.push(h);return h;}
describe("durable AI-2 loop",{timeout:20000},()=>{
  it("V3 separates practice/help from fresh independent proof and preserves initial evidence",async()=>{
    const h=await harness();const practice=await h.prepared("practice");
    const helped=await h.loop.help("learner-a",practice.id,h.key(),"hint");expect(helped.assisted).toBe(true);expect(helped.help).toHaveLength(1);
    await h.attempts.submit("learner-a",practice.id,practice.revision,h.key());await h.loop.assess("learner-a",practice.id);
    const developing=await h.loop.learning("learner-a",h.enrollment.id);expect(developing.capability.state).toBe("developing");expect(developing.recallDueAt).toBeNull();expect(developing.evidence[0].type).toBe("assisted_application");
    const proof=await h.submitted();expect(proof.submission!.frozen.help).toHaveLength(0);await h.loop.assess("learner-a",proof.id);
    const demonstrated=await h.loop.learning("learner-a",h.enrollment.id);expect(demonstrated.capability.state).toBe("demonstrated");expect(demonstrated.recommendation.objectiveId).toBe("AI-3");expect(demonstrated.evidence).toHaveLength(2);expect(demonstrated.recallDueAt).not.toBeNull();expect(demonstrated.capability.retention).toBe("not_checked");
    const freshPractice=await h.prepared("practice");await h.attempts.submit("learner-a",freshPractice.id,freshPractice.revision,h.key());await h.loop.assess("learner-a",freshPractice.id);
    const later=await h.loop.learning("learner-a",h.enrollment.id);expect(later.capability.firstIndependentEvidenceId).toBe(demonstrated.capability.firstIndependentEvidenceId);expect(later.recallDueAt).toBe(demonstrated.recallDueAt);
  });
  it("V6 identical retries preserve submission/result and reject conflicting identities",async()=>{
    const h=await harness();const a=await h.prepared();const key=h.key();
    const first=await h.attempts.submit("learner-a",a.id,a.revision,key);
    const repeated=await h.attempts.submit("learner-a",a.id,a.revision,key);expect(repeated.submission).toEqual(first.submission);
    const [one,two]=await Promise.all([h.loop.assess("learner-a",a.id),h.loop.assess("learner-a",a.id)]);
    expect(one.id).toBe(two.id);expect(h.calls().assessorCalls).toBe(1);
    await h.loop.assess("learner-a",a.id);expect(h.calls().assessorCalls).toBe(1);expect((await h.loop.learning("learner-a",h.enrollment.id)).evidence).toHaveLength(1);
    await expect(h.attempts.submit("learner-a",a.id,a.revision,h.key())).rejects.toThrow("REQUEST_CONFLICT");
    await expect(h.attempts.save("learner-a",a.id,a.revision,{...draft,prompt:"changed"})).rejects.toThrow("ATTEMPT_FROZEN");
    const other=await h.prepared();await expect(h.attempts.submit("learner-a",other.id,other.revision,key)).rejects.toThrow("REQUEST_CONFLICT");
  });
  it("V7 failures and uncertainty award nothing, recovery uses the same frozen snapshot",async()=>{
    let calls=0;const h=await harness(async frozen=>{calls++;if(calls===1)throw new Error("timeout");if(calls===2)return {...decision(frozen),status:"uncertain"};return decision(frozen);});
    const a=await h.submitted();const frozen=a.submission!.hash;
    for(const status of ["failed","uncertain"]){const failed=await h.loop.assess("learner-a",a.id);expect(failed.submission!.job.state).toBe(status);const learning=await h.loop.learning("learner-a",h.enrollment.id);expect(learning.evidence).toHaveLength(0);expect(learning.capability.state).toBe("not_assessed");}
    await h.attempts.review("learner-a",a.id);const recovered=await h.loop.assess("learner-a",a.id);expect(recovered.submission!.hash).toBe(frozen);expect(recovered.submission!.reviewRequested).toBe(true);expect(recovered.submission!.assessments).toHaveLength(3);expect((await h.loop.learning("learner-a",h.enrollment.id)).capability.state).toBe("demonstrated");
  });
  it("rejects malformed, missing, invalid-version, contradictory and fabricated evidence",async()=>{
    const h=await harness();const a=await h.submitted();const frozen=a.submission!.frozen;const good=decision(frozen);
    const invalid=[{}, {...good,rubricVersion:"other"},{...good,criteria:good.criteria.slice(1)},{...good,criteria:good.criteria.map(c=>({...c,citations:[{field:"prompt",quote:"fabricated"}]}))},{...good,criteria:good.criteria.map(c=>({...c,result:"uncertain"}))},{...good,criteria:good.criteria.map(c=>({...c,id:"A1"}))},{...good,mastery:true}];
    for(const raw of invalid)expect(validateAssessment(raw,frozen).status).toBe("failed");
  });
  it("reclaims interrupted leases, rejects stale results and stops after the final claim",async()=>{
    const h=await harness();const a=await h.submitted();const claim=await h.attempts.claim("learner-a",a.id,"assessor-test-v1");
    expect((await h.attempts.claim("learner-a",a.id,"assessor-test-v1")).lease).toBeNull();
    await h.sql.query("update assessment_job set lease_until=now()-interval '1 second' where submission_id=$1",[a.submission!.id]);
    const recovered=await h.attempts.claim("learner-a",a.id,"assessor-test-v1");expect(recovered.lease).not.toBe(claim.lease);
    const valid=validateAssessment(decision(a.submission!.frozen),a.submission!.frozen);
    await h.attempts.finish("learner-a",a.id,claim.lease!,valid,"assessor-test-v1");expect((await h.loop.learning("learner-a",h.enrollment.id)).evidence).toHaveLength(0);
    for(let i=0;i<2;i++){await h.sql.query("update assessment_job set lease_until=now()-interval '1 second' where submission_id=$1",[a.submission!.id]);await h.attempts.claim("learner-a",a.id,"assessor-test-v1");}
    const final=await h.attempts.read("learner-a",a.id);expect(final.submission!.job.state).toBe("failed");expect(final.submission!.job.claims).toBe(3);expect(final.submission!.assessments.at(-1)!.decision.code).toBe("ASSESSMENT_INTERRUPTED");
  });
  it("rolls back assessment, evidence and capability together when recommendation storage fails",async()=>{
    const h=await harness();const a=await h.submitted();
    await h.sql.exec("CREATE FUNCTION reject_next() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic storage failure'; END $$; CREATE TRIGGER fail_next BEFORE INSERT ON learning_next FOR EACH ROW EXECUTE FUNCTION reject_next();");
    await expect(h.loop.assess("learner-a",a.id)).rejects.toThrow();
    const after=await h.attempts.read("learner-a",a.id);expect(after.submission!.job.state).toBe("pending");expect(after.submission!.assessments).toHaveLength(0);expect((await h.loop.learning("learner-a",h.enrollment.id)).evidence).toHaveLength(0);
  });
  it("pins pending practice and assessment configuration without rewriting frozen work",async()=>{
    const h=await harness();const a=await h.submitted();const snapshot=a.submission!.hash;
    await h.attempts.claim("learner-a",a.id,"assessor-test-v1");
    await h.sql.query("update assessment_job set lease_until=now()-interval '1 second' where submission_id=$1",[a.submission!.id]);
    await expect(h.attempts.claim("learner-a",a.id,"assessor-test-v2")).rejects.toThrow("CONFIGURATION_CHANGED");
    const saved=await h.attempts.read("learner-a",a.id);
    expect(saved.submission!.hash).toBe(snapshot);expect(saved.submission!.job.claims).toBe(1);expect(saved.submission!.assessments).toHaveLength(0);
    const practice=await h.prepared("practice");const key=h.key();
    const claim=await h.attempts.reservePractice("learner-a",practice.id,key,practice.revision,"practice-test-v1");
    await h.sql.query("update practice_request set lease_until=now()-interval '1 second' where id=$1",[claim.request.id]);
    await expect(h.attempts.reservePractice("learner-a",practice.id,key,practice.revision,"practice-test-v2")).rejects.toThrow("CONFIGURATION_CHANGED");
    expect((await h.loop.learning("learner-a",h.enrollment.id)).evidence).toHaveLength(0);
  });
  it("V8 denies nested work, conversations, help, submission and assessment across learners",async()=>{
    const h=await harness();const a=await h.prepared();
    expect((await h.http(request(`/api/attempts/${a.id}`,"GET",undefined,h.key(),"learner-b"),a.id)).status).toBe(404);
    const actions=[ ["practice",{revision:a.revision}], ["help",{kind:"hint",confirm:true}], ["submit",{revision:a.revision}], ["variant",{explanationLevel:"technical"}], ["assess",{}], ["review",{}] ] as const;
    for(const [action,body] of actions)expect((await h.http(request(`/api/attempts/${a.id}/${action}`,"POST",body,h.key(),"learner-b"),a.id,action)).status).toBe(404);
    expect((await h.http(request(`/api/attempts/${a.id}`,"PATCH",{revision:0,draft},h.key(),"learner-b"),a.id)).status).toBe(404);
    expect((await h.http(request(`/api/learning?enrollmentId=${h.enrollment.id}`,"GET",undefined,h.key(),"learner-b"))).status).toBe(404);
    expect((await h.http(request("/api/learning","POST",{enrollmentId:h.enrollment.id,mode:"practice"},h.key(),"learner-b"))).status).toBe(404);
  });
  it("serialises assistance and submission, never freezes unassisted after help delivery",async()=>{
    const h=await harness();const a=await h.prepared();
    const results=await Promise.allSettled([h.loop.help("learner-a",a.id,h.key(),"hint"),h.attempts.submit("learner-a",a.id,a.revision,h.key())]);
    const saved=await h.attempts.read("learner-a",a.id);
    if(results[0].status === "fulfilled"){expect(saved.submission!.frozen.assisted).toBe(true);expect(saved.submission!.frozen.help).toHaveLength(1);}else{expect(saved.submission!.frozen.assisted).toBe(false);expect(saved.help).toHaveLength(0);}
    await expect(h.loop.help("learner-a",a.id,h.key(),"hint")).rejects.toThrow("ATTEMPT_FROZEN");
  });
  it("V9 variants survive restoration without changing task, rubric, draft or default",async()=>{
    const h=await harness();const a=await h.prepared();const changed=await h.loop.variant("learner-a",a.id,"technical");
    expect(changed.variant.content).not.toBe(a.variant.content);expect(changed.task).toEqual(a.task);expect(changed.draft).toEqual(a.draft);
    const restored=await h.attempts.read("learner-a",a.id);expect(restored.variant).toEqual(changed.variant);expect((await h.store.enrollment("learner-a",h.enrollment.id))!.preferences.explanationLevel).toBe("beginner");
    expect((await h.loop.variant("learner-a",a.id,"technical")).variant.id).toBe(changed.variant.id);
    await h.store.preferences("learner-a",h.enrollment.id,{explanationLevel:"beginner",teachingLanguage:"en",sessionMinutes:10},0);expect((await h.loop.learning("learner-a",h.enrollment.id)).recommendation.minutes).toBe(10);
  });
  it("preserves concurrent draft conflicts and idempotent practice calls",async()=>{
    const h=await harness();const a=await h.loop.create("learner-a",h.enrollment.id,"independent",h.key());
    const values=await Promise.allSettled([h.attempts.save("learner-a",a.id,0,draft),h.attempts.save("learner-a",a.id,0,{...draft,prompt:"Conflicting local draft"})]);expect(values.filter(r=>r.status === "fulfilled")).toHaveLength(1);
    const saved=await h.attempts.read("learner-a",a.id);const key=h.key();await h.loop.practice("learner-a",a.id,key,saved.revision);await h.loop.practice("learner-a",a.id,key,saved.revision);expect(h.calls().modelCalls).toBe(1);
    await expect(h.loop.practice("learner-a",a.id,key,saved.revision+1)).rejects.toThrow("REQUEST_CONFLICT");
    expect((await h.sql.query("select * from attempt_draft_revision where attempt_id=$1",[a.id])).rows).toHaveLength(2);
  });
  it("V12 credits accurate learner inspection despite model noncompliance",async()=>{
    const badResponse="Four FAQs. Recording is always available, a fact absent from the source.";
    const h=await harness(async frozen=>decision(frozen),async()=>badResponse);let a=await h.prepared();
    a=await h.attempts.save("learner-a",a.id,a.revision,{...draft,checklist:"The response fails count, provides no measurable answers and invents recording availability. That claim is unsupported. Source time/duration are omitted. I must correct these errors."});
    await h.attempts.submit("learner-a",a.id,a.revision,h.key());await h.loop.assess("learner-a",a.id);expect((await h.loop.learning("learner-a",h.enrollment.id)).capability.state).toBe("demonstrated");
  });
});
describe("request and practice recovery boundaries",{timeout:20000},()=>{
  it("blocks forged origins, missing sessions and oversized/extra fields",async()=>{
    const h=await harness();const a=await h.prepared();
    expect((await h.http(request("/api/attempts/x","PATCH",{revision:a.revision,draft},h.key(),"learner-a","https://evil.test"),a.id)).status).toBe(403);
    expect((await h.http(request("/api/attempts/x","GET",undefined,h.key(),""),a.id)).status).toBe(401);
    expect((await h.http(request("/api/attempts/x","PATCH",{revision:a.revision,draft,learnerId:"learner-b"}),a.id)).status).toBe(400);
    expect((await h.http(request("/api/attempts/x","PATCH",{revision:a.revision,draft:{...draft,prompt:"x".repeat(40000)}}),a.id)).status).toBe(413);
  });
  it("blocks submit while a practice call is live and recovers its saved identity",async()=>{
    const h=await harness();const a=await h.prepared();const key=h.key();
    const live=await h.attempts.reservePractice("learner-a",a.id,key,a.revision,"practice-test-v1");
    await expect(h.attempts.submit("learner-a",a.id,a.revision,h.key())).rejects.toThrow("GENERATION_PENDING");
    await h.sql.query("update practice_request set lease_until=now()-interval '1 second' where id=$1",[live.request.id]);
    const recovered=await h.attempts.reservePractice("learner-a",a.id,key,a.revision,"practice-test-v1");expect(recovered.request.id).toBe(live.request.id);expect(recovered.lease).not.toBe(live.lease);
    await h.attempts.finishPractice("learner-a",a.id,live.request.id,live.lease!,"late response",null);expect((await h.attempts.read("learner-a",a.id)).practice.at(-1)!.response).toBeNull();
    await h.attempts.finishPractice("learner-a",a.id,recovered.request.id,recovered.lease!,"New completed response",null);expect((await h.attempts.read("learner-a",a.id)).practice.at(-1)!.response).toBe("New completed response");
  });
  it("does not erase historical demonstration after a later failed assessment",async()=>{
    let successful=true;const h=await harness(async frozen=>successful ? decision(frozen) : {});const first=await h.submitted();await h.loop.assess("learner-a",first.id);const before=await h.loop.learning("learner-a",h.enrollment.id);
    successful=false;const later=await h.submitted();await h.loop.assess("learner-a",later.id);const after=await h.loop.learning("learner-a",h.enrollment.id);expect(after.capability).toEqual(before.capability);expect(after.evidence).toHaveLength(1);expect(after.recallDueAt).toBe(before.recallDueAt);
  });
});
it("reuses compatible evidence across goals and gives concurrent fresh tasks distinct sources",{timeout:20000},async()=>{
 const h=await harness();const first=await h.submitted();await h.loop.assess("learner-a",first.id);
 const goal=await h.goal({...h.enrollment.plan.goal.input,goalText:"Use AI for clearer customer emails"},"learner-a",1);
 const plan=await h.service.generate("learner-a",goal.id,h.key());const next=await h.service.accept("learner-a",plan.id,h.key());await h.service.place("learner-a",next.id,"skip");
 expect((await h.loop.learning("learner-a",next.id)).capability.state).toBe("demonstrated");
 const [one,two]=await Promise.all([h.loop.create("learner-a",next.id,"independent",h.key()),h.loop.create("learner-a",h.enrollment.id,"independent",h.key())]);
 expect(one.task.version).not.toBe(two.task.version);expect(one.task.source).not.toBe(first.task.source);expect(two.task.source).not.toBe(first.task.source);
 expect(one.task.rubricVersion).toBe(first.task.rubricVersion);expect(two.task.criteria).toEqual(first.task.criteria);
});

it("ignores incompatible objectives and policies when deriving capability and recall",{timeout:20000},async()=>{
 const h=await harness();const a=await h.submitted();await h.loop.assess("learner-a",a.id);
 await h.sql.query("update learning_evidence set payload=jsonb_set(payload,'{objectiveId}','\"AI-1\"'::jsonb)");
 const foreign=await h.loop.learning("learner-a",h.enrollment.id);
 expect(foreign.capability.state).toBe("not_assessed");expect(foreign.recallDueAt).toBeNull();expect(foreign.transferAvailable).toBe(false);
 await h.sql.query("update learning_evidence set payload=jsonb_set(jsonb_set(payload,'{objectiveId}','\"AI-2\"'::jsonb),'{policyVersion}','\"other\"'::jsonb)");
 expect((await h.loop.learning("learner-a",h.enrollment.id)).capability.state).toBe("not_assessed");
});
