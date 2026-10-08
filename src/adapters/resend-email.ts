import { Resend } from "resend";
import type { EmailSender } from "./better-auth";

export function resendEmail(key: string, from: string): EmailSender {
  const resend = new Resend(key);
  return async (email, link) => {
    const result = await resend.emails.send({
      from, to: email, subject: "Your CuriousNext sign-in link",
      text: `Open this link to confirm your sign-in to CuriousNext:\n\n${link}\n\nThis link expires in 10 minutes and works once. If you did not request it, ignore this email.`,
    }, { signal: AbortSignal.timeout(10000) });
    if (result.error) throw new Error("EMAIL_DELIVERY_FAILED");
  };
}
