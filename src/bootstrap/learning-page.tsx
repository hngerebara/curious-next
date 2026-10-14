import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runtime } from "./runtime";
import { TutorLearning } from "../ui/tutor-learning";
import { LearningView } from "../ui/learning-view";

export async function LearningPage({searchParams}:{searchParams:Promise<{path?:string}>}) {
  const requestHeaders = await headers();
  let learner;
  try{learner=await runtime().learner(requestHeaders);}catch{redirect("/access?state=unavailable");}
  if(!learner)redirect("/access");
  const pathId=(await searchParams).path;
  if(pathId)return <TutorLearning pathId={pathId}/>;
  return <LearningView />;
}
