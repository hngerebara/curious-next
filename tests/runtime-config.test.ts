import { afterEach, describe, expect, it, vi } from "vitest";
import { runtime } from "../src/bootstrap/runtime";

describe("server configuration fails before contacting providers", () => {
  afterEach(() => vi.unstubAllEnvs());
  it.each([
    { origin: "https://curiousnext.test", database: "postgresql://synthetic@db.test/db?sslmode=require", secret: "", error: "ACCESS_NOT_CONFIGURED" },
    { origin: "http://curiousnext.test", database: "postgresql://synthetic@db.test/db?sslmode=require", secret: "synthetic-test-secret-at-least-32-characters", error: "INVALID_ACCESS_ORIGIN" },
    { origin: "ftp://localhost", database: "postgresql://synthetic@db.test/db?sslmode=require", secret: "synthetic-test-secret-at-least-32-characters", error: "INVALID_ACCESS_ORIGIN" },
    { origin: "https://curiousnext.test", database: "postgresql://synthetic@db.test/db", secret: "synthetic-test-secret-at-least-32-characters", error: "DATABASE_TLS_REQUIRED" },
  ])("rejects $error", ({ origin, database, secret, error }) => {
    vi.stubEnv("BETTER_AUTH_URL", origin);
    vi.stubEnv("BETTER_AUTH_SECRET", secret);
    vi.stubEnv("DATABASE_URL", database);
    vi.stubEnv("RESEND_API_KEY", "synthetic-email-key");
    vi.stubEnv("EMAIL_FROM", "test@example.test");
    expect(() => runtime()).toThrow(error);
  });
});
