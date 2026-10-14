import type { AbusePort, EventPort } from "../contracts/access";
import type { TutorGenerator, TutorGoal, TutorPath, TutorStore } from "../contracts/tutor";
import { tutorPlace, tutorProposal, tutorCanonical } from "../domain/tutor-policy";
export function tutorService(store: TutorStore, generator: TutorGenerator, abuse: AbusePort, events: EventPort) {
  async function generate(owner: string, goal: TutorGoal, key: string, id?: string) {
    const initial: TutorPath = {id:crypto.randomUUID(),version:1,revision:0,requestKey:key,goal,configuration:generator.configuration,state:"generating",proposal:null,acceptedAt:null,placement:null,generation:{count:0,lease:null,until:0,code:null},createdAt:new Date().toISOString()};
    const saved = id ? await store.read(owner,id) : await store.create(owner,initial);
    if (!saved) throw Error("NOT_FOUND");
    if (saved.state === "proposed" || saved.state === "accepted") return saved;
    if (saved.configuration !== generator.configuration) throw Error("CONFIGURATION_CHANGED");
    const lease = crypto.randomUUID();
    const claimed = await store.change(owner,saved.id,path => {
      if (path.generation.until > Date.now() || ["proposed","accepted"].includes(path.state)) return path;
      if (path.generation.count >= 2) throw Error("ATTEMPTS_EXHAUSTED");
      return {...path,state:"generating",generation:{count:path.generation.count+1,lease,until:Date.now()+45000,code:null}};
    });
    if (claimed.generation.lease !== lease) return claimed;
    let proposal = null, code = null;
    try {
      if (!await abuse.allow("tutor-path:"+owner,5,600)) throw Error("MODEL_LIMITED");
      proposal = tutorProposal(await generator.path(claimed.goal));
    } catch (error) { const message=error instanceof Error ? error.message : "MODEL_UNAVAILABLE"; code=["MODEL_LIMITED","MODEL_INVALID","MODEL_REFUSED","MODEL_NOT_CONFIGURED"].includes(message) ? message : "MODEL_UNAVAILABLE"; }
    events.emit("course_generation",code ?? "tutor_ready");
    return store.change(owner,saved.id,path => path.generation.lease !== lease ? path : {...path,state:proposal ? "proposed" : "failed",proposal,generation:{...path.generation,lease:null,until:0,code}});
  }
  return {generate,
    accept(owner:string,id:string,revision:number) { return store.change(owner,id,path => {
      if (path.state === "accepted") return path;
      if (path.revision !== revision) throw Error("REVISION_CONFLICT");
      if (path.state !== "proposed" || path.proposal?.state !== "ready") throw Error("PATH_NOT_READY");
      return {...path,state:"accepted",acceptedAt:new Date().toISOString()};
    }); },
    place(owner:string,id:string,revision:number,answers:unknown,selected?:unknown) { return store.change(owner,id,path => {
      const placement = tutorPlace(path,answers,selected);
      if (tutorCanonical(path.placement) === tutorCanonical(placement)) return path;
      if (path.revision !== revision) throw Error("REVISION_CONFLICT");
      return {...path,placement};
    }); }
  };
}
