import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runtime } from "./runtime";
import { OnboardingView } from "../ui/onboarding-view";

export async function OnboardingPage() {
  const requestHeaders = await headers();
  let learner;
  try { learner = await runtime().learner(requestHeaders); } catch { redirect("/access?state=unavailable"); }
  if (!learner) redirect("/access");
  return <OnboardingView />;
}
