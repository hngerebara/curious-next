import { createHash } from "node:crypto";
import { runtime } from "./runtime";
import { postgres } from "../adapters/postgres";
import { tutorStore } from "../adapters/tutor-store";
import { tutorLessonStore } from "../adapters/tutor-lesson-store";
import { tutorLessonModel } from "../adapters/tutor-lesson-model";
import { tutorReferencePack } from "../adapters/tutor-references";
import { openaiDefaults } from "../adapters/openai-response";
import { repositories } from "../adapters/access-repositories";
import { events } from "../adapters/events";
import { tutorLessonService } from "../application/tutor-lesson-service";
import { tutorAssessor } from "../adapters/tutor-assessor";
import { tutorAssessmentService } from "../application/tutor-assessment-service";
import { tutorLessonHttp } from "../application/tutor-lesson-http";
import { tutorCanonical } from "../domain/tutor-policy";
let current:ReturnType<typeof tutorLessonHttp>|undefined;
export function tutorLessonRuntime(){
  if(current)return current;const auth=runtime(),{db}=postgres(process.env.DATABASE_URL!),paths=tutorStore(db),store=tutorLessonStore(db),{abuse}=repositories(db,process.env.BETTER_AUTH_SECRET!);
  const model=tutorLessonModel(process.env.AI_PROVIDER==="openai"?process.env.OPENAI_API_KEY:undefined,process.env.OPENAI_MODEL ?? openaiDefaults.model);
  const hash=(value:unknown)=>createHash("sha256").update(tutorCanonical(value)).digest("hex");
  const assessor=tutorAssessor(process.env.AI_PROVIDER==="openai"?process.env.OPENAI_API_KEY:undefined,process.env.OPENAI_MODEL ?? openaiDefaults.model);
  current=tutorLessonHttp({session:auth.learner},paths,store,tutorLessonService(paths,store,model,abuse,events,tutorReferencePack,hash),process.env.BETTER_AUTH_URL!,tutorAssessmentService(store,assessor,abuse,events,hash));return current;
}
