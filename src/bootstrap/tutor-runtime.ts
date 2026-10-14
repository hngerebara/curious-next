import { runtime } from "./runtime";
import { postgres } from "../adapters/postgres";
import { tutorStore } from "../adapters/tutor-store";
import { tutorPathModel } from "../adapters/tutor-path-model";
import { openaiDefaults } from "../adapters/openai-response";
import { repositories } from "../adapters/access-repositories";
import { events } from "../adapters/events";
import { tutorService } from "../application/tutor-service";
import { tutorHttp } from "../application/tutor-http";
let current:ReturnType<typeof tutorHttp>|undefined;
export function tutorRuntime() {
  if(current)return current;
  const auth=runtime(),{db}=postgres(process.env.DATABASE_URL!);
  const store=tutorStore(db),{abuse}=repositories(db,process.env.BETTER_AUTH_SECRET!);
  const model=tutorPathModel(process.env.AI_PROVIDER === "openai" ? process.env.OPENAI_API_KEY : undefined,process.env.OPENAI_MODEL ?? openaiDefaults.model);
  current=tutorHttp({session:auth.learner},store,tutorService(store,model,abuse,events),process.env.BETTER_AUTH_URL!);
  return current;
}
