export const accessPolicy = {
  version: "access-v1-spike",
  linkSeconds: 600,
  sessionSeconds: 86400,
  emailCooldownSeconds: 60,
  ipWindowSeconds: 600,
  ipRequestLimit: 10,
  ipConfirmLimit: 30,
  bodyBytes: 4096,
} as const;

export function emailAddress(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 254) return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function isToken(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{32,256}$/.test(value);
}
