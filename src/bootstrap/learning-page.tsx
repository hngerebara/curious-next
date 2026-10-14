import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runtime } from "./runtime";
import { LearningView } from "../ui/learning-view";

export async function LearningPage({searchParams}:{searchParams:Promise<{path?:string}>}) {
  const requestHeaders = await headers();
  let learner;
  try{learner=await runtime().learner(requestHeaders);}catch{redirect("/access?state=unavailable");}
  if(!learner)redirect("/access");
  if ((await searchParams).path) return <main id="main" className="onboarding-shell"><h1>Your learning path is saved and ready for teaching</h1><p>The visual teaching engine is the next delivery slice, and this foundation does not yet provide generated lessons.</p><a href="/onboarding">Reopen my saved learning setup</a></main>;
  return <LearningView />;
}
