"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export function AccessForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed" | "limited">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/api/access/request", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      setState(response.status === 202 ? "sent" : response.status === 429 ? "limited" : "failed");
    } catch {
      setState("failed");
    }
  }
  return <form onSubmit={submit} aria-busy={state === "sending"}>
    <label htmlFor="email">Email address</label>
    <input id="email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required value={email} readOnly={state === "sending"} onChange={(event) => { setEmail(event.target.value); setState("idle"); }} aria-describedby="email-help access-status" />
    <p id="email-help" className="muted">The same link signs you in or creates your account after verification.</p>
    <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending your link…" : state === "sent" ? "Send another link" : "Send me a magic link"}</button>
    <div id="access-status" role="status" aria-live="polite" className="status">
      {state === "sent" && <p>Check your inbox for a sign-in link. Open it, then confirm that you requested access.</p>}
      {state === "failed" && <p className="error">We could not send your link. Your email is still here. Please try again.</p>}
      {state === "limited" && <p>Too many requests. Please wait and try again later.</p>}
    </div>
  </form>;
}
