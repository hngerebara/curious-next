import { TutorProse } from "./tutor-prose";
import type { ReactNode } from "react";
import type { LessonBlock } from "../contracts/tutor-lesson";
import { TutorVisual } from "./tutor-visual";
export function TutorLessonBlock({block,graphic}:{block:LessonBlock;graphic?:ReactNode}) {
 return <section className={"tutor-concept tutor-"+block.kind} aria-label={block.title}><p className="eyebrow">{block.kind === "example"?"See it in action":block.kind === "explanation"?"Understand the idea":block.kind==="story"?"Learn through a short story":"Explore the idea visually"}</p><h2>{block.title}</h2><TutorProse text={block.text}/>{graphic}{!graphic && block.nodes.length>0 && <TutorVisual key={JSON.stringify(block)} block={block}/>}</section>;
}
