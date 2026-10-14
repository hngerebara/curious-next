import { LogoutButton } from "./logout-button";
import { AccessForm } from "./access-form";

export function AccessView({ state, local = false }: { state?: string; local?: boolean }) {
  return <main id="main" tabIndex={-1} className="access-shell">
    <p className="eyebrow">A useful next step</p>
    <h1>A useful next step starts here.</h1>
    <p>Sign in with your email to save your learning goal, work and feedback. No password to remember.</p>
    {state === "invalid" && <p className="notice" role="status">This link has expired, was already used, or could not be confirmed. Request a new link below.</p>}
    {state === "unavailable" && <p className="notice" role="status">Sign-in is unavailable right now. Please try again later.</p>}
    <section className="workspace-panel" aria-label="Sign up or log in"><AccessForm local={local} /></section>
    {local && <p className="notice">Local test access. No email will be sent. <a href="/dev/mail">Open the test email inbox</a>. Use fictional addresses only.</p>}
    <p className="muted">Practical AI and Cybersecurity Essentials. English learning previews.</p>
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

export function VerifiedView({ local = false }: { local?: boolean }) {
  return <main id="main" tabIndex={-1} className="access-shell">
    <p className="eyebrow">{local ? "Local test session" : "Email verified"}</p><h1>You’re signed in.</h1>
    <p>{local ? "Your test link was confirmed. This does not verify ownership of a real email address." : "Your email is verified."} Set a goal to preview a personalised course plan.</p>
    <a className="primary-button" href="/onboarding">Go to my learning</a>
    <LogoutButton/>
  </main>;
}
