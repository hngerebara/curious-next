import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { localEmail } from "../adapters/local-email";
import { localInboxRequest } from "../domain/local-email-policy";
import { localEmailEnvironment, localEmailMode } from "./email-delivery";
import { LocalInboxView } from "../ui/local-inbox-view";

export async function LocalInboxPage() {
  const incoming = await headers();
  try {
    if (!localEmailMode()) return notFound();
    const environment = localEmailEnvironment();
    localInboxRequest(new Request(`${environment.origin}/dev/mail`, { headers: incoming }), environment);
    return <LocalInboxView messages={await localEmail(environment).inbox()} />;
  } catch { return notFound(); }
}
