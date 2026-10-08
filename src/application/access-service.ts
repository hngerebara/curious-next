import type { AccessOutcome, AuthPort, AbusePort, EventPort } from "../contracts/access";
import { accessPolicy } from "../domain/access-policy";

export function accessService(auth: AuthPort, abuse: AbusePort, events: EventPort) {
  return {
    async request(email: string, client: string): Promise<AccessOutcome> {
      if (!await abuse.allow(`request:${client}`, accessPolicy.ipRequestLimit, accessPolicy.ipWindowSeconds)) return "limited";
      if (!await abuse.allow(`email:${email}`, 1, accessPolicy.emailCooldownSeconds)) return "limited";
      try {
        await auth.request(email);
        events.emit("access_request", "accepted");
        return "sent";
      } catch {
        events.emit("access_request", "delivery_unavailable");
        return "unavailable";
      }
    },
    async confirm(token: string, client: string) {
      if (!await abuse.allow(`confirm:${client}`, accessPolicy.ipConfirmLimit, accessPolicy.ipWindowSeconds)) return { status: "limited" as const };
      try {
        const result = await auth.redeem(token);
        events.emit("access_confirm", result ? "verified" : "invalid_link");
        return result ? { status: "verified" as const, result } : { status: "invalid" as const };
      } catch {
        events.emit("access_confirm", "unavailable");
        return { status: "unavailable" as const };
      }
    },
  };
}
