import { runtime } from "./runtime";
import { postgres } from "../adapters/postgres";
import { courseStore } from "../adapters/course-store";
import { openaiCourseGenerator } from "../adapters/openai-course-generator";
import { openaiDefaults } from "../adapters/openai-response";
import { repositories } from "../adapters/access-repositories";
import { events } from "../adapters/events";
import { courseService } from "../application/course-service";
import { courseHttp } from "../application/course-http";

let current: ReturnType<typeof courseHttp> | undefined;
export function courseRuntime() {
  if (current) return current;
  const access = runtime(); // Reuse the verified authentication/configuration boundary.
  const { db } = postgres(process.env.DATABASE_URL!);
  const store = courseStore(db);
  const { abuse } = repositories(db, process.env.BETTER_AUTH_SECRET!);
  const generator = openaiCourseGenerator(process.env.AI_PROVIDER === "openai" ? process.env.OPENAI_API_KEY : undefined, process.env.OPENAI_MODEL ?? openaiDefaults.model);
  current = courseHttp({ session: access.learner }, store, courseService(store, generator, abuse, events), process.env.BETTER_AUTH_URL!);
  return current;
}
