"use client";
import { usePathname } from "next/navigation";
export function SiteHeader() {
  const path=usePathname();
  const learning=path === "/learning" || path === "/onboarding";
  return <header className="site-header"><a href="/" aria-label="CuriousNext home" className="brand"><span className="brand-symbol" aria-hidden="true">↗</span>Curious<span>Next</span></a>{learning ? <span className="header-note">Your next step, made clear</span> : <nav aria-label="Main navigation"><a href="/#how-it-works">How it works</a><a href="/#courses">Explore courses</a><a href="/access" className="header-login">Log in <span aria-hidden="true">↗</span></a></nav>}</header>;
}
