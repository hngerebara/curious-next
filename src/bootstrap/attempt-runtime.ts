import { runtime } from "./runtime";
import { postgres } from "../adapters/postgres";
import { courseStore } from "../adapters/course-store";
import { attemptStore } from "../adapters/attempt-store";
import { groqAttemptModels } from "../adapters/groq-attempt-models";
import { repositories } from "../adapters/access-repositories";
import { events } from "../adapters/events";
import { attemptService } from "../application/attempt-service";
import { attemptHttp } from "../application/attempt-http";

let current: ReturnType<typeof attemptHttp> | undefined;
export function attemptRuntime() {
  if(current)return current;
  const access=runtime();const {db}=postgres(process.env.DATABASE_URL!);
  const store=attemptStore(db);const courses=courseStore(db);const {abuse}=repositories(db,process.env.BETTER_AUTH_SECRET!);
  const models=groqAttemptModels(process.env.AI_PROVIDER === "groq" ? process.env.GROQ_API_KEY : undefined,process.env.GROQ_MODEL);
  current=attemptHttp({session:access.learner},store,attemptService(store,courses,models.practice,models.assessor,abuse,events),process.env.BETTER_AUTH_URL!);
  return current;
}
