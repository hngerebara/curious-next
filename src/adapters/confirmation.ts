import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Confirmation, ConfirmationPort } from "../contracts/access";
import { accessPolicy, isToken } from "../domain/access-policy";

export function confirmationPort(secret: string, now = Date.now): ConfirmationPort {
  const key = createHash("sha256").update(`confirmation-v1:${secret}`).digest();
  return {
    create(token) {
      const csrf = randomBytes(32).toString("base64url");
      const data: Confirmation = { token, csrf, expiresAt: now() + accessPolicy.linkSeconds * 1000 };
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
      return { value: Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url"), csrf };
    },
    read(value) {
      if (!value || value.length > 2048 || !/^[\w-]+$/.test(value)) return null;
      try {
        const bytes = Buffer.from(value, "base64url");
        const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
        decipher.setAuthTag(bytes.subarray(12, 28));
        const data = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString()) as Confirmation;
        if (!isToken(data.token) || !isToken(data.csrf) || !Number.isFinite(data.expiresAt) || data.expiresAt <= now()) return null;
        return data;
      } catch {
        return null;
      }
    },
  };
}
