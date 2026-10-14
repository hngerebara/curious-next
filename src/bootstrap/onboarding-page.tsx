import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runtime } from "./runtime";
import { OnboardingView } from "../ui/onboarding-view";
import { TutorOnboarding } from "../ui/tutor-onboarding";

export async function OnboardingPage({searchParams}:{searchParams:Promise<{enrollment?:string}>}) {
  const requestHeaders = await headers();
  let learner;
  try { learner = await runtime().learner(requestHeaders); } catch { redirect("/access?state=unavailable"); }
  if (!learner) redirect("/access");
  return (await searchParams).enrollment ? <OnboardingView /> : <TutorOnboarding />;
}
