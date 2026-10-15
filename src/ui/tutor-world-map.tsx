import type { TutorPublicPath } from "../contracts/tutor";
import type { TutorPublicSession } from "../contracts/tutor-lesson";
import "./tutor-world.css";

export function TutorWorldMap({ path, sessions, current, busy, explore }: { path: TutorPublicPath; sessions: TutorPublicSession[]; current?: string | null; busy: boolean; explore: (id: string) => void }) {
  const modules = path.proposal?.modules ?? [];
  return <section className="learning-world" aria-label="Your learning world">
    <div className="world-intro"><p className="eyebrow">A world built around your curiosity</p><h2>Every discovery gives you somewhere new to go</h2><p>Explore a destination, experiment with an idea, then explain what you discovered. Your saved work lets you return whenever you need.</p></div>
    <div className="world-landscape">
      <svg className="world-scenery" viewBox="0 0 800 540" preserveAspectRatio="none" aria-hidden="true"><path fill="#ded5ee" d="M0 200Q100 80 210 200T450 160T800 180V540H0Z"/><path fill="#d8e4bd" d="M0 310Q170 210 330 330T800 260V540H0Z"/><path fill="none" stroke="#a59a7e" strokeWidth="5" strokeDasharray="5 12" d="M180 75C700 30 700 170 190 210S80 365 610 365S650 490 190 490"/><ellipse fill="#d5e5e2" cx="700" cy="475" rx="85" ry="30"/></svg>
      <ol className="world-destinations">{modules.map((module, i) => {
        const work = sessions.filter(s => s.module.id === module.id);
        const supported = work.some(s => s.evidence);
        const isCurrent = current === module.id;
        const state = supported ? "Supported practice completed" : isCurrent ? "Your recommended next destination" : work.length ? "Saved learning to revisit" : "Available to explore";
        return <li key={module.id} className={isCurrent ? "world-current" : ""}>
          <button type="button" disabled={busy} aria-current={isCurrent ? "step" : undefined} onClick={() => explore(module.id)}>
            <span className="world-island" aria-hidden="true"><span className="world-marker">{supported ? "✓" : String(i + 1).padStart(2, "0")}</span>{isCurrent && <span className="world-explorer">●<span>··</span></span>}</span>
            <span className="world-destination-title">{module.title}</span><span className="world-state">{state}</span>
          </button><p>{module.outcome}</p>
        </li>;
      })}</ol>
    </div>
    <p className="muted">Checkpoints record supported learning, while independent demonstration requires separate evidence. You can revisit any destination without losing progress.</p>
  </section>;
}
