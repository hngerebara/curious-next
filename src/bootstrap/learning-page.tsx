import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runtime } from "./runtime";
import { tutorStore } from "../adapters/tutor-store";
import { postgres } from "../adapters/postgres";
import { TutorLearning } from "../ui/tutor-learning";
import { LearningView } from "../ui/learning-view";

export async function LearningPage({searchParams}:{searchParams:Promise<{path?:string;enrollment?:string;legacy?:string}>}) {
  const requestHeaders = await headers();
  let learner;
  try{learner=await runtime().learner(requestHeaders);}catch{redirect("/access?state=unavailable");}
  if(!learner)redirect("/access");
  const params=await searchParams;
  const pathId=params.path;
  if(pathId)return <TutorLearning pathId={pathId}/>;
  if(!params.enrollment && !params.legacy){const connection=postgres(process.env.DATABASE_URL!);let latest;try{latest=(await tutorStore(connection.db).list(learner.id)).find(p=>p.state==="accepted");}finally{await connection.close();}if(latest)redirect("/learning?path="+encodeURIComponent(latest.id));redirect("/onboarding");}
  return <LearningView />;
}
