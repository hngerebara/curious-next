import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runtime } from "./runtime";
import { LearningView } from "../ui/learning-view";

export async function LearningPage() {
  const requestHeaders = await headers();
  let learner;
  try{learner=await runtime().learner(requestHeaders);}catch{redirect("/access?state=unavailable");}
  if(!learner)redirect("/access");
  return <LearningView />;
}
