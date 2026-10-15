import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccessView, ConfirmView, VerifiedView } from "../ui/access-view";
import { localEmailMode } from "./email-delivery";
import { runtime } from "./runtime";

export async function AccessPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  return <AccessView state={state} demo={process.env.DEMO_LOGIN_ENABLED === "true"} demoPassword={process.env.DEMO_LOGIN_ENABLED === "true" ? process.env.DEMO_LOGIN_PASSWORD : undefined} local={process.env.DEMO_LOGIN_ENABLED !== "true" && localEmailMode()} />;
}
export async function HomePage() {
  const incoming=await headers();
  let signedIn=false;
  try{signedIn=!!await runtime().learner(incoming);}catch { /* Public entry remains available if authentication is unavailable. */ }
  if(signedIn)redirect("/learning");
  return <AccessView demo={process.env.DEMO_LOGIN_ENABLED === "true"} demoPassword={process.env.DEMO_LOGIN_ENABLED === "true" ? process.env.DEMO_LOGIN_PASSWORD : undefined} local={process.env.DEMO_LOGIN_ENABLED !== "true" && localEmailMode()}/>;
}
export async function ConfirmPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  const incoming = await headers();
  let csrf: string | undefined;
  try {
    csrf = runtime().context(new Request("http://localhost/access/confirm/ready", { headers: incoming }))?.csrf;
  } catch {
    redirect("/access?state=invalid");
  }
  if (!csrf) redirect("/access?state=invalid");
  return <ConfirmView csrf={csrf} state={state} />;
}
export async function VerifiedPage() {
  const incoming = await headers();
  let learner;
  try {
    learner = await runtime().learner(incoming);
  } catch {
    redirect("/access?state=unavailable");
  }
  if (!learner) redirect("/access");
  return <VerifiedView local={localEmailMode()} />;
}
