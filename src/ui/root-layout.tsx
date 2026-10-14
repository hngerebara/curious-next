import type { ReactNode } from "react";
import "@fontsource/fredoka/latin-600.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "./global.css";
import "./home.css";
import "./learning.css";
import { SiteHeader } from "./site-header";
import { DisplayPreferences } from "./display-preferences";

export function RootView({ children }: { children: ReactNode }) {
  return <html lang="en"><body><DisplayPreferences>
    <a href="#main" className="skip">Skip to main content</a>
    <SiteHeader />
    {children}
    <footer><a href="/" className="brand">CuriousNext</a><span>Small steps. Skills you can use.</span><span className="preview">English learning preview</span></footer>
  </DisplayPreferences></body></html>;
}
