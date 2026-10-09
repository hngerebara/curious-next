import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccessView, ConfirmView, VerifiedView } from "../ui/access-view";
import { HomeView } from "../ui/home-view";
import { runtime } from "./runtime";

export async function AccessPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  return <AccessView state={state} />;
}
export function HomePage() {
  return <HomeView />;
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
  return <VerifiedView />;
}
