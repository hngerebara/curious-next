import { AccessForm } from "./access-form";

export function AccessView({ state }: { state?: string }) {
  return <main id="main" tabIndex={-1} className="access-shell">
    <p className="eyebrow">A useful next step</p>
    <h1>Your next step starts here.</h1>
    <p>Enter your email to sign in to CuriousNext. No password to remember.</p>
    {state === "invalid" && <p className="notice" role="status">This link has expired, was already used, or could not be confirmed. Request a new link below.</p>}
    {state === "unavailable" && <p className="notice" role="status">Sign-in is unavailable right now. Please try again later.</p>}
    <section className="card" aria-label="Sign up or log in"><AccessForm /></section>
    <p className="muted">Practical AI and Cybersecurity Essentials are the planned pilot courses.</p>
  </main>;
}

export function ConfirmView({ csrf, state }: { csrf: string; state?: string }) {
  return <main id="main" tabIndex={-1} className="access-shell">
    <p className="eyebrow">Confirm your request</p><h1>Ready to sign in?</h1>
    <p>Continue only if you requested this link. You will be signed in on this device.</p>
    {state === "unavailable" && <p role="status" className="notice">We could not confirm your sign-in. Try again or request a new link.</p>}
    {state === "limited" && <p role="status" className="notice">Too many attempts. Please wait before trying again.</p>}
    <form action="/api/access/confirm" method="post" className="card">
      <input type="hidden" name="csrf" value={csrf} />
      <button type="submit">Confirm and continue</button>
      <a href="/access" className="secondary">Cancel and return</a>
    </form>
  </main>;
}

export function VerifiedView() {
  return <main id="main" tabIndex={-1} className="access-shell">
    <p className="eyebrow">Email verified</p><h1>You’re signed in.</h1>
    <p>This authentication preview confirms your access. Goal setting and course entry are the next implementation slice.</p>
    <form action="/api/access/logout" method="post"><button type="submit">Log out</button></form>
  </main>;
}
