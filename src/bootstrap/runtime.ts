import { postgres } from "../adapters/postgres";
import { makeAuth } from "../adapters/better-auth";
import { repositories } from "../adapters/access-repositories";
import { confirmationPort } from "../adapters/confirmation";
import { emailDelivery } from "./email-delivery";
import { events } from "../adapters/events";
import { accessService } from "../application/access-service";
import { accessHttp } from "../application/access-http";

let current: ReturnType<typeof accessHttp> | undefined;

export function runtime() {
  if (current) return current;
  const origin = process.env.BETTER_AUTH_URL;
  const secret = process.env.BETTER_AUTH_SECRET;
  const database = process.env.DATABASE_URL;
  if (!origin || !secret || secret.length < 32 || !database) throw new Error("ACCESS_NOT_CONFIGURED");
  const url = new URL(origin);
  if (url.origin !== origin || !["http:", "https:"].includes(url.protocol) || (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("INVALID_ACCESS_ORIGIN");
  const databaseUrl = new URL(database);
  if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) throw new Error("INVALID_DATABASE_URL");
  if (url.protocol === "https:" && !["require", "verify-ca", "verify-full"].includes(databaseUrl.searchParams.get("sslmode") ?? "")) throw new Error("DATABASE_TLS_REQUIRED");
  const send = emailDelivery();
  const { db } = postgres(database);
  const auth = makeAuth(db, origin, secret, send);
  const { abuse, records } = repositories(db, secret);
  current = accessHttp({ auth, confirmation: confirmationPort(secret), service: accessService(auth, abuse, events), records, origin, trustedProxy: process.env.TRUST_VERCEL_PROXY === "true" && process.env.VERCEL === "1" });
  return current;
}
