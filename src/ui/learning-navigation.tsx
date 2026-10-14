"use client";
import type { LearningPageView } from "./learning-controller";
import { LogoutButton } from "./logout-button";
import { TextSizeControl } from "./display-preferences";

export function LearningNavigation({view,enrollmentId,navigate,confirmLeave,busy}:{view:LearningPageView;enrollmentId:string;navigate:(view:LearningPageView)=>void;confirmLeave:()=>boolean;busy:boolean}) {
  return <div className="learning-nav"><nav aria-label="Your learning">{(["today","path","work"] as const).map(item=><a key={item} href={"/learning?enrollment="+encodeURIComponent(enrollmentId)+"&view="+item} aria-current={view === item ? "page" : undefined} aria-disabled={busy} onClick={e=>{e.preventDefault();if(!busy)navigate(item);}}>{item === "today" ? "Today" : item === "path" ? "Your path" : "Your work"}</a>)}</nav><details className="account-menu" onKeyDown={e=>{if(e.key === "Escape"){e.currentTarget.open=false;e.currentTarget.querySelector("summary")?.focus();}}}><summary aria-label="Account and preferences"><span className="account-label">Account</span><span className="account-icon" aria-hidden="true">☰</span></summary><div><TextSizeControl/><a href={"/onboarding?enrollment="+encodeURIComponent(enrollmentId)} aria-disabled={busy} onClick={e=>{if(busy || !confirmLeave())e.preventDefault();}}>Course and preferences</a><a href="/" onClick={e=>{if(!confirmLeave())e.preventDefault();}}>About CuriousNext</a><LogoutButton confirmLeave={confirmLeave}/></div></details></div>;
}
