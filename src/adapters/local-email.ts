import { chmod, mkdir, open, readdir, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { LocalEmailEnvironment, LocalMessage } from "../contracts/access";
import type { EmailSender } from "./better-auth";
import { accessPolicy, emailAddress, isToken } from "../domain/access-policy";
import { localEmailOrigin } from "../domain/local-email-policy";

export function localEmail(environment: LocalEmailEnvironment, directory = join(process.cwd(), ".local-mail"), now = () => Date.now()) {
  const origin = localEmailOrigin(environment);
  const missing = (error: unknown) => !!error && typeof error === "object" && "code" in error && error.code === "ENOENT";
  async function remove(path: string) { try { await unlink(path); } catch (error) { if (!missing(error)) throw error; } }
  async function inbox(): Promise<LocalMessage[]> {
    localEmailOrigin(environment);
    await mkdir(directory, { recursive: true, mode: 0o700 }); await chmod(directory, 0o700);
    const messages: LocalMessage[] = [];
    for (const filename of await readdir(/* turbopackIgnore: true */ directory)) {
      if (!/^message-[a-f0-9-]{36}\.json$/.test(filename)) continue;
      const path = join(/* turbopackIgnore: true */ directory, filename);
      let file: Awaited<ReturnType<typeof open>>;
      try { file = await open(/* turbopackIgnore: true */ path, constants.O_RDONLY | constants.O_NOFOLLOW); } catch (error) { if (missing(error)) continue; throw error; }
      let content: string;
      try { if ((await file.stat()).size > 4096) throw new Error("LOCAL_EMAIL_INVALID"); content = await file.readFile("utf8"); } finally { await file.close(); }
      const message: LocalMessage = JSON.parse(content);
      const url = new URL(message.link);
      if (filename !== `message-${message.id}.json` || !/^[a-f0-9-]{36}$/.test(message.id) || !Number.isFinite(Date.parse(message.createdAt)) || content.length > 4096 || !emailAddress(message.email) || url.origin !== origin || url.pathname !== "/access/confirm" || !isToken(url.searchParams.get("token")) || !Number.isFinite(Date.parse(message.expiresAt))) throw new Error("LOCAL_EMAIL_INVALID");
      if (Date.parse(message.expiresAt) <= now()) await remove(path);
      else messages.push(message);
    }
    messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    for (const message of messages.slice(20)) await remove(join(directory, `message-${message.id}.json`));
    return messages.slice(0, 20);
  }
  const send: EmailSender = async (email, link) => {
    const url = new URL(link);
    if (!emailAddress(email) || url.origin !== origin || url.pathname !== "/access/confirm" || !isToken(url.searchParams.get("token"))) throw new Error("LOCAL_EMAIL_INVALID");
    await inbox();
    const message: LocalMessage = { id: randomUUID(), email, link, createdAt: new Date(now()).toISOString(), expiresAt: new Date(now() + accessPolicy.linkSeconds * 1000).toISOString() };
    await writeFile(join(directory, `message-${message.id}.json`), JSON.stringify(message), { mode: 0o600, flag: "wx" });
  };
  return { send, inbox };
}
