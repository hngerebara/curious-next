import type { LessonBlock } from "../contracts/tutor-lesson";
import { TutorVisual } from "./tutor-visual";
export function TutorLessonBlock({block}:{block:LessonBlock}) {
 return <section className={"tutor-concept tutor-"+block.kind} aria-label={block.title}><p className="eyebrow">{block.kind === "example"?"See it in action":block.kind === "explanation"?"Understand the idea":block.kind==="story"?"Learn through a short story":"Explore the idea visually"}</p><h2>{block.title}</h2><p className="preserve-text">{block.text}</p>{block.nodes.length>0 && <TutorVisual key={JSON.stringify(block)} block={block}/>}</section>;
}
