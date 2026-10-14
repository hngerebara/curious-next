"use client";
import { useState } from "react";
import type { FormEvent } from "react";

export function LogoutButton({confirmLeave=()=>true}:{confirmLeave?:()=>boolean}) {
  const [error,setError]=useState("");
  const [leaving,setLeaving]=useState(false);
  async function logout(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(leaving || !confirmLeave())return;
    setLeaving(true);setError("");
    try {
      const response=await fetch("/api/access/logout",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
      if(!response.ok)throw new Error("logout");
      window.location.assign("/access");
    } catch {setLeaving(false);setError("Log out did not finish. Please try again.");}
  }
  return <><form action="/api/access/logout" method="post" onSubmit={logout}><button className="text-button" disabled={leaving}>{leaving ? "Logging out…" : "Log out"}</button></form>{error && <p role="alert">{error}</p>}</>;
}
