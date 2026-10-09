import type { EventPort } from "../contracts/access";
import { randomUUID } from "node:crypto";

export const events: EventPort = {
  emit(event, outcome) {
    process.stdout.write(`${JSON.stringify({ eventId: randomUUID(), event, outcome })}\n`);
  },
};
