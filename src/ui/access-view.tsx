import { DemoLoginForm } from "./demo-login-form";
import { LogoutButton } from "./logout-button";
import { AccessForm } from "./access-form";

export function AccessView({ state, local = false, demo = false, demoPassword }: { state?: string; local?: boolean; demo?: boolean; demoPassword?: string }) {
  return <main id="main" tabIndex={-1} className="access-shell">
    <p className="eyebrow">A useful next step</p>
    <h1>Your learning goal starts with a useful next step</h1>
    <p>{demo ? "Use the shared demo password to explore learning with fictional examples." : "Sign in with your email to save your learning goal, work and feedback without remembering a password."}</p>
    {state === "invalid" && <p className="notice" role="status">This link has expired, was already used, or could not be confirmed. Request a new sign-in link using the form below.</p>}
    {state === "unavailable" && <p className="notice" role="status">Sign-in is unavailable right now, so please try again later.</p>}
    {demo && demoPassword && <p className="notice">Use this displayed password to try the shared demo: <strong>DEMO_LOGIN_PASSWORD</strong>: <code style={{ overflowWrap: "anywhere" }}>{demoPassword}</code></p>}
    <section className="workspace-panel" aria-label="Sign up or log in">{demo ? <DemoLoginForm /> : <AccessForm local={local} />}</section>
    {local && <p className="notice">This local preview captures test links without sending email. <a href="/dev/mail">Open the test email inbox</a> and use fictional addresses for this preview.</p>}
    <p className="muted">Explore Practical AI and Cybersecurity Essentials through these English learning previews.</p>
  </main>;
}

export function ConfirmView({ csrf, state }: { csrf: string; state?: string }) {
  return <main id="main" tabIndex={-1} className="access-shell">
    <p className="eyebrow">Confirm your request</p><h1>Confirm your request before signing in on this device</h1>
    <p>Continue only if you requested this link, which signs you in on this device.</p>
    {state === "unavailable" && <p role="status" className="notice">We could not confirm your sign-in, so try again or request a new link.</p>}
    {state === "limited" && <p role="status" className="notice">There have been too many attempts, so please wait before trying again.</p>}
    <form action="/api/access/confirm" method="post" className="card">
      <input type="hidden" name="csrf" value={csrf} />
      <button type="submit">Confirm and continue</button>
      <a href="/access" className="secondary">Cancel and return</a>
    </form>
  </main>;
}

export function VerifiedView({ local = false }: { local?: boolean }) {
  return <main id="main" tabIndex={-1} className="access-shell">
    <p className="eyebrow">{local ? "Local test session" : "Email verified"}</p><h1>You’re signed in and ready to continue your learning</h1>
    <p>{local ? "Your test link was confirmed, but this does not verify ownership of a real email address." : "Your email is verified so you can save your learning."} Set a goal to preview a personalised course plan.</p>
    <a className="primary-button" href="/onboarding">Go to my learning</a>
    <LogoutButton/>
  </main>;
}
