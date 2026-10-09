import type { ReactNode } from "react";
import "@fontsource/fredoka/latin-600.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "./global.css";

export function RootView({ children }: { children: ReactNode }) {
  return <html lang="en"><body>
    <a href="#main" className="skip">Skip to main content</a>
    <header><a href="/access" aria-label="CuriousNext home" className="brand">CuriousNext</a><span className="preview">Authentication preview</span></header>
    {children}
    <footer>CuriousNext · Pilot in development</footer>
  </body></html>;
}
