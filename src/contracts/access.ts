export type Learner = { id: string; email: string };
export type Confirmation = { token: string; csrf: string; expiresAt: number };
export type AccessOutcome = "sent" | "limited" | "unavailable";

export interface AuthPort {
  request(email: string): Promise<void>;
  redeem(token: string): Promise<{ learner: Learner; cookies: string[] } | null>;
  session(headers: Headers): Promise<Learner | null>;
  logout(headers: Headers): Promise<string[]>;
}
export interface AbusePort {
  allow(key: string, limit: number, windowSeconds: number): Promise<boolean>;
}
export interface ConfirmationPort {
  create(token: string): { value: string; csrf: string };
  read(value: string | undefined): Confirmation | null;
}
export interface OwnedRecordPort {
  read(id: string, learnerId: string): Promise<{ id: string; label: string } | null>;
}
export interface EventPort {
  emit(event: "access_request" | "access_confirm" | "session_read" | "course_generation", outcome: string): void;
}
