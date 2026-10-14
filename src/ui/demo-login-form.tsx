"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export function DemoLoginForm() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setFailed(false);
    try {
      const response = await fetch("/api/access/demo", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
      });
      if (response.ok && response.redirected) { window.location.assign(response.url); return; }
      setFailed(true);
    } catch { setFailed(true); }
    setBusy(false);
  }
  return <form onSubmit={submit} aria-busy={busy}>
    <p className="notice">Everyone using this demo shares saved work, so enter fictional information only.</p>
    <label htmlFor="demo-password">Shared demo password</label>
    <input id="demo-password" type="password" autoComplete="current-password" required maxLength={256} value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} />
    <button disabled={busy} type="submit">{busy ? "Signing into the shared demo…" : "Sign into the shared demo"}</button>
    <p role="status">{failed ? "Sign-in failed or was temporarily limited, so check your password and try again later." : busy ? "Your demo session is being created, so please wait." : ""}</p>
  </form>;
}
